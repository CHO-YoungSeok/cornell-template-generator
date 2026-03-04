import os
import tempfile
import zipfile
import shutil
import logging
import json
import asyncio
from typing import Dict, List, Union, Any
from fastapi import FastAPI, Request, Response
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.background import BackgroundTask
from starlette.datastructures import FormData
from services.converter import convert_pptx_to_pdf, convert_pdf_to_images, generate_docx, get_soffice_path
from services.progress_manager import progress_manager
from fastapi.datastructures import UploadFile
import uvicorn

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 시스템 PATH 설정 보완 (LibreOffice, Poppler 탐색을 위함)
os.environ["PATH"] = f"/opt/homebrew/bin:{os.environ.get('PATH', '')}"

# 프론트엔드 빌드 경로 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.normpath(os.path.join(BASE_DIR, "..", "frontend", "dist"))

app = FastAPI(title="Cornell Flow API")

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 유틸리티 함수 ---

def cleanup_temp_dir(temp_dir: str) -> None:
    """
    내용: 임시 디렉토리를 재귀적으로 삭제합니다.
    param: temp_dir - 삭제할 임시 디렉토리의 절대 경로
    return: 없음
    """
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
        logger.info(f"임시 디렉토리 삭제 완료: {temp_dir}")

async def parse_group_data(form_data: FormData) -> Dict[int, Dict[str, Union[str, List[UploadFile]]]]:
    """
    내용: 클라이언트로부터 받은 multipart/form-data를 그룹별 구조로 파싱합니다.
    param: form_data - Request.form()으로부터 받은 폼 데이터 (FormData 타입)
    return: 인덱싱된 그룹 데이터 딕셔너리
    """
    groups: Dict[int, Dict[str, Union[str, List[UploadFile]]]] = {}
    
    for key in form_data.keys():
        if not key.startswith("group_"):
            continue
            
        parts = key.split("_")
        if len(parts) < 3:
            continue
            
        try:
            group_index = int(parts[1])
        except ValueError:
            continue
            
        field_name = parts[2]
        
        if group_index not in groups:
            groups[group_index] = {"filename": "document", "documentTitle": "", "imageSize": "standard", "files": []}
            
        values = form_data.getlist(key)
        
        for value in values:
            if field_name == "filename":
                groups[group_index]["filename"] = str(value)
            elif field_name == "documentTitle":
                groups[group_index]["documentTitle"] = str(value)
            elif field_name == "imageSize":
                groups[group_index]["imageSize"] = str(value)
            elif field_name == "files":
                if hasattr(value, "filename"):
                    groups[group_index]["files"].append(value)
                
    return groups

# --- API 엔드포인트 ---

@app.get("/api/progress/{task_id}")
async def stream_progress(task_id: str) -> StreamingResponse:
    """
    내용: 특정 작업의 진행 상태를 실시간으로 스트리밍합니다. (SSE)
    param: task_id - 클라이언트가 생성한 고유 작업 ID
    return: StreamingResponse (text/event-stream)
    """
    async def event_generator():
        try:
            while True:
                status = progress_manager.get_status(task_id)
                yield f"data: {json.dumps(status)}\n\n"
                
                if status["day"] >= 7:
                    await asyncio.sleep(1)
                    break
                    
                await asyncio.sleep(0.5)
        except asyncio.CancelledError:
            logger.info(f"작업 {task_id}의 진행 스트림이 취소되었습니다.")
        except Exception as e:
            logger.error(f"진행 스트림 오류: {str(e)}")

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/api/convert")
async def convert_files(request: Request) -> Response:
    """
    내용: 업로드된 파일 그룹들을 받아 각각 DOCX로 변환하고, 단일 파일 또는 ZIP 파일로 반환합니다.
    param: request - 클라이언트로부터 받은 multipart/form-data 요청
    return: 변환된 DOCX 파일 또는 여러 DOCX가 압축된 ZIP 파일의 FileResponse
    """
    task_id = request.headers.get("X-Task-ID", "unknown")
    try:
        progress_manager.update_progress(task_id, 1, "초기화 및 준비 중...", 10)
        
        form_data = await request.form()
        groups = await parse_group_data(form_data)

        if not groups:
            return JSONResponse(status_code=400, content={"error": "전송된 파일 그룹이 없습니다."})

        temp_dir = tempfile.mkdtemp()
        template_path = os.path.join(os.path.dirname(__file__), "templates", "필기양식_template.docx")
        
        if not os.path.exists(template_path):
            cleanup_temp_dir(temp_dir)
            return JSONResponse(status_code=500, content={"error": "템플릿 파일을 찾을 수 없습니다."})

        output_files: List[str] = []

        try:
            for idx, group in sorted(groups.items()):
                out_filename = str(group["filename"])
                if not out_filename.endswith(".docx"):
                    out_filename += ".docx"
                
                group_temp_dir = os.path.join(temp_dir, f"group_{idx}")
                os.makedirs(group_temp_dir, exist_ok=True)
                
                all_image_paths: List[str] = []
                
                for file_idx, upload_file in enumerate(group["files"]):
                    if not isinstance(upload_file, UploadFile):
                        continue
                        
                    file_content = await upload_file.read()
                    original_filename = upload_file.filename or f"file_{file_idx}"
                    file_ext = os.path.splitext(original_filename)[1].lower()
                    
                    input_file_path = os.path.join(group_temp_dir, original_filename)
                    with open(input_file_path, "wb") as f:
                        f.write(file_content)
                    
                    if file_ext == ".pptx":
                        progress_manager.update_progress(task_id, 2, f"문서 구조 변환 중 ({original_filename})", 25)
                        pdf_path = convert_pptx_to_pdf(input_file_path, group_temp_dir)
                    elif file_ext == ".pdf":
                        pdf_path = input_file_path
                    else:
                        continue
                        
                    progress_manager.update_progress(task_id, 3, "이미지 에셋 추출 중...", 40)
                    images = convert_pdf_to_images(pdf_path, os.path.join(group_temp_dir, f"images_{file_idx}"))
                    all_image_paths.extend(images)
                
                if all_image_paths:
                    progress_manager.update_progress(task_id, 4, f"새로운 문서 렌더링 중 ({out_filename})", 60)
                    output_docx_path = os.path.join(temp_dir, out_filename)
                    generate_docx(template_path, output_docx_path, str(group["documentTitle"]), all_image_paths, str(group["imageSize"]))
                    output_files.append(output_docx_path)
                
            if not output_files:
                cleanup_temp_dir(temp_dir)
                return JSONResponse(status_code=400, content={"error": "변환된 파일이 없습니다."})

            progress_manager.update_progress(task_id, 6, "최종 결과물 패키징 중...", 90)

            if len(output_files) == 1:
                progress_manager.update_progress(task_id, 7, "작업 완료. 다운로드를 시작합니다.", 100)
                return FileResponse(
                    output_files[0], 
                    filename=os.path.basename(output_files[0]),
                    background=BackgroundTask(lambda: (cleanup_temp_dir(temp_dir), progress_manager.remove_task(task_id)))
                )
            else:
                zip_path = os.path.join(temp_dir, "converted_documents.zip")
                with zipfile.ZipFile(zip_path, 'w') as zipf:
                    for file_path in output_files:
                        zipf.write(file_path, arcname=os.path.basename(file_path))
                
                progress_manager.update_progress(task_id, 7, "작업 완료. 다운로드를 시작합니다.", 100)
                return FileResponse(
                    zip_path, 
                    filename="converted_documents.zip",
                    background=BackgroundTask(lambda: (cleanup_temp_dir(temp_dir), progress_manager.remove_task(task_id)))
                )
                
        except Exception as e:
            cleanup_temp_dir(temp_dir)
            logger.error(f"변환 프로세스 실패: {str(e)}")
            return JSONResponse(status_code=500, content={"error": f"변환 실패: {str(e)}"})
            
    except Exception as e:
        logger.error(f"요청 처리 중 오류: {str(e)}")
        return JSONResponse(status_code=500, content={"error": "서버 내부 오류가 발생했습니다."})

# --- 정적 파일 및 SPA 서빙 ---

# 1. /assets 마운트 (index.html에서 참조하는 정적 파일들)
assets_path = os.path.join(FRONTEND_DIR, "assets")
if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")
    logger.info(f"정적 자산 경로 마운트: {assets_path}")

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str) -> Response:
    """
    내용: 정의되지 않은 모든 경로에 대해 프론트엔드 index.html을 반환하여 SPA 라우팅을 지원합니다.
    param: full_path - 요청된 전체 경로
    return: index.html 파일 또는 빌드 누락 알림
    """
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return JSONResponse(
        status_code=404,
        content={"error": "프론트엔드 빌드 결과물을 찾을 수 없습니다. 'npm run build'를 먼저 실행해 주세요."}
    )

# --- 생명주기 핸들러 ---

@app.on_event("startup")
async def startup_event() -> None:
    """
    내용: 서버 시작 시 필수 시스템 의존성(LibreOffice, Poppler) 및 템플릿 존재 여부를 확인합니다.
    return: 없음
    """
    logger.info("시스템 의존성 체크 중...")
    
    soffice_path = get_soffice_path()
    if soffice_path == "soffice" and not shutil.which("soffice"):
        logger.warning("경고: LibreOffice를 찾을 수 없습니다.")
    
    if not shutil.which("pdftoppm") and not os.getenv("POPPLER_PATH"):
        logger.warning("경고: Poppler를 찾을 수 없습니다.")

    template_path = os.path.join(os.path.dirname(__file__), "templates", "필기양식_template.docx")
    if not os.path.exists(template_path):
        logger.error("오류: 템플릿 파일을 찾을 수 없습니다.")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
