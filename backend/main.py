import os
import tempfile
import zipfile
import shutil
import logging
import json
import asyncio
from typing import Dict, Any, List
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.background import BackgroundTask
from services.converter import convert_pptx_to_pdf, convert_pdf_to_images, generate_docx, get_soffice_path
from services.progress_manager import progress_manager
from fastapi.datastructures import UploadFile

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 시스템 PATH 설정 보완
os.environ["PATH"] = f"/opt/homebrew/bin:{os.environ.get('PATH', '')}"

app = FastAPI()

@app.get("/api/progress/{task_id}")
async def stream_progress(task_id: str):
    """
    내용: 특정 작업의 진행 상태를 실시간으로 스트리밍합니다. (SSE)
    param: task_id - 클라이언트가 생성한 고유 작업 ID
    return: StreamingResponse (text/event-stream)
    """
    async def event_generator():
        try:
            while True:
                status = progress_manager.get_status(task_id)
                # JSON 형태로 데이터 전송
                yield f"data: {json.dumps(status)}\n\n"
                
                # 7일(안식)이 되면 스트림 종료
                if status["day"] >= 7:
                    # 잠시 대기 후 스트림 종료하여 클라이언트가 마지막 상태를 받을 수 있게 함
                    await asyncio.sleep(1)
                    break
                    
                await asyncio.sleep(0.5)
        except asyncio.CancelledError:
            logger.info(f"Progress stream for task {task_id} cancelled.")
        except Exception as e:
            logger.error(f"Error in progress stream: {str(e)}")

    return StreamingResponse(event_generator(), media_type="text/event-stream")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """서버 시작 시 시스템 의존성 체크"""
    logger.info("시스템 의존성 체크 중...")
    
    # 1. LibreOffice 체크
    soffice_path = get_soffice_path()
    if soffice_path == "soffice" and not shutil.which("soffice"):
        logger.warning("경고: LibreOffice(soffice)를 찾을 수 없습니다. PPTX 변환이 작동하지 않을 수 있습니다.")
    else:
        logger.info(f"LibreOffice 경로: {soffice_path}")

    # 2. Poppler 체크
    if not shutil.which("pdftoppm") and not os.getenv("POPPLER_PATH"):
        logger.warning("경고: Poppler(pdftoppm)를 찾을 수 없습니다. PDF 변환이 작동하지 않을 수 있습니다.")
    else:
        logger.info("Poppler(pdftoppm)가 감지되었습니다.")

    # 3. 템플릿 파일 체크
    template_path = os.path.join(os.path.dirname(__file__), "templates", "필기양식_template.docx")
    if not os.path.exists(template_path):
        logger.error(f"오류: 템플릿 파일을 찾을 수 없습니다 ({template_path}). 'python create_template.py'를 먼저 실행해주세요.")

def cleanup_temp_dir(temp_dir: str) -> None:
    """
    내용: 임시 디렉토리를 재귀적으로 삭제합니다.
    param: temp_dir - 삭제할 임시 디렉토리의 절대 경로
    return: 없음
    """
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)

async def parse_group_data(form_data: Any) -> Dict[int, Dict[str, Any]]:
    """
    내용: 클라이언트로부터 받은 multipart/form-data를 그룹별 구조로 파싱합니다.
    param: form_data - Request.form()으로부터 받은 폼 데이터
    return: 인덱싱된 그룹 데이터 딕셔너리
    """
    groups: Dict[int, Dict[str, Any]] = {}
    
    # 폼 데이터의 모든 키를 순회 (getlist를 사용하여 중복 키 처리)
    for key in form_data.keys():
        logger.info(f"파싱 중인 키: {key}")
        
        if not key.startswith("group_"):
            continue
            
        parts = key.split("_")
        if len(parts) < 3:
            continue
            
        try:
            group_index = int(parts[1])
        except ValueError:
            logger.warning(f"잘못된 그룹 인덱스 무시: {parts[1]}")
            continue
            
        field_name = parts[2]
        
        if group_index not in groups:
            groups[group_index] = {"filename": "document", "documentTitle": "", "imageSize": "standard", "files": []}
            
        # 해당 키의 모든 값들을 가져옴
        values = form_data.getlist(key)
        
        for value in values:
            if field_name == "filename":
                groups[group_index]["filename"] = str(value)
            elif field_name == "documentTitle":
                groups[group_index]["documentTitle"] = str(value)
            elif field_name == "imageSize":
                groups[group_index]["imageSize"] = str(value)
            elif field_name == "files":
                # 파일 객체인지 확인 (Starlette UploadFile)
                if hasattr(value, "filename") and (hasattr(value, "read") or hasattr(value, "file")):
                    groups[group_index]["files"].append(value)
                    logger.info(f"그룹 {group_index}에 파일 추가됨: {value.filename}")
                else:
                    logger.warning(f"그룹 {group_index}의 'files' 키로 파일이 아닌 데이터가 수신됨")
                
    return groups

@app.post("/api/convert")
async def convert_files(request: Request) -> Any:
    """
    내용: 업로드된 파일 그룹들을 받아 각각 DOCX로 변환하고, 단일 파일 또는 ZIP 파일로 반환합니다.
    param: request - 클라이언트로부터 받은 multipart/form-data 요청
    return: 변환된 DOCX 파일 또는 여러 DOCX가 압축된 ZIP 파일의 FileResponse
    """
    task_id = request.headers.get("X-Task-ID", "unknown")
    try:
        logger.info(f"변환 요청 수신됨 (Task ID: {task_id})")
        
        # 첫째 날: 빛이 있으라 하시니 빛이 있었고 (준비 시작)
        progress_manager.update_progress(task_id, 1, "초기화 및 준비 중...", 10)
        await asyncio.sleep(0.5)
        
        form_data = await request.form()
        received_keys = list(form_data.keys())
        logger.info(f"수신된 폼 데이터 키: {received_keys}")
        
        groups = await parse_group_data(form_data)
        logger.info(f"파싱된 그룹 수: {len(groups)}")

        if not groups:
            logger.warning("전송된 파일 그룹이 없습니다.")
            return JSONResponse(
                status_code=400, 
                content={
                    "error": "전송된 파일 그룹이 없습니다.",
                    "debug": {
                        "received_keys": received_keys,
                        "form_items_count": len(form_data.multi_items()),
                        "groups_info": {str(k): {"files_count": len(v["files"]), "keys": list(v.keys())} for k, v in groups.items()}
                    }
                }
            )

        temp_dir = tempfile.mkdtemp()
        template_path = os.path.join(os.path.dirname(__file__), "templates", "필기양식_template.docx")
        
        if not os.path.exists(template_path):
            cleanup_temp_dir(temp_dir)
            return JSONResponse(status_code=500, content={"error": "서버에 템플릿 파일이 없습니다. 'python create_template.py'를 먼저 실행해 주세요."})

        output_files: List[str] = []

        try:
            for idx, group in sorted(groups.items()):
                out_filename = group["filename"]
                if not out_filename.endswith(".docx"):
                    out_filename += ".docx"
                doc_title = group["documentTitle"]
                
                logger.info(f"그룹 {idx} 처리 중: 파일 {len(group['files'])}개")
                
                group_temp_dir = os.path.join(temp_dir, f"group_{idx}")
                os.makedirs(group_temp_dir, exist_ok=True)
                
                all_image_paths: List[str] = []
                
                for file_idx, upload_file in enumerate(group["files"]):
                    file_content = await upload_file.read()
                    original_filename = upload_file.filename or f"file_{file_idx}"
                    file_ext = os.path.splitext(original_filename)[1].lower()
                    
                    input_file_path = os.path.join(group_temp_dir, original_filename)
                    with open(input_file_path, "wb") as f:
                        f.write(file_content)
                    
                    try:
                        if file_ext == ".pptx":
                            # 둘째 날: 물 가운데에 궁창이 있어 물과 물로 나뉘라 (PPTX 변환)
                            progress_manager.update_progress(task_id, 2, f"문서 구조 변환 중 ({original_filename})", 25)
                            await asyncio.sleep(0.5)
                            pdf_path = convert_pptx_to_pdf(input_file_path, group_temp_dir)
                        elif file_ext == ".pdf":
                            pdf_path = input_file_path
                        else:
                            logger.info(f"지원하지 않는 파일 형식 스킵: {file_ext}")
                            continue
                            
                        # 셋째 날: 천하의 물이 한 곳으로 모이고 뭍이 드러나라 (이미지 추출)
                        progress_manager.update_progress(task_id, 3, "이미지 에셋 추출 중...", 40)
                        await asyncio.sleep(0.5)
                        images = convert_pdf_to_images(pdf_path, os.path.join(group_temp_dir, f"images_{file_idx}"))
                        all_image_paths.extend(images)
                    except Exception as conv_err:
                        logger.error(f"파일 변환 중 오류 ({original_filename}): {str(conv_err)}")
                        progress_manager.update_progress(task_id, 1, f"오류 발생: {str(conv_err)}", 0)
                        raise conv_err
                
                if all_image_paths:
                    # 넷째 날: 하늘의 궁창에 광명체들이 있어 주야를 나뉘게 하라 (문서 구성)
                    progress_manager.update_progress(task_id, 4, f"새로운 문서 렌더링 중 ({out_filename})", 60)
                    await asyncio.sleep(0.5)
                    output_docx_path = os.path.join(temp_dir, out_filename)
                    generate_docx(template_path, output_docx_path, doc_title, all_image_paths, group["imageSize"])
                    
                    # 다섯째 날: 여러 파일 처리
                    progress_manager.update_progress(task_id, 5, "문서 병합 및 최적화 중...", 80)
                    await asyncio.sleep(0.5)
                    output_files.append(output_docx_path)
                
            if not output_files:
                cleanup_temp_dir(temp_dir)
                logger.warning("변환된 파일이 없습니다.")
                return JSONResponse(
                    status_code=400, 
                    content={
                        "error": "변환된 파일이 없습니다. 지원되는 형식(PDF, PPTX)인지 확인해 주세요.",
                        "debug": {
                            "groups_summary": {str(k): {"files_count": len(v["files"])} for k, v in groups.items()},
                            "group_0_files_extensions": [os.path.splitext(f.filename)[1].lower() for f in groups.get(0, {}).get("files", [])] if groups else []
                        }
                    }
                )

            # 여섯째 날: 우리의 형상을 따라 사람을 만들고 (최종 완성)
            progress_manager.update_progress(task_id, 6, "최종 결과물 패키징 중...", 90)
            await asyncio.sleep(0.5)

            if len(output_files) == 1:
                # 일곱째 날: 모든 일을 마치시고 일곱째 날에 안식하시니라 (완료)
                progress_manager.update_progress(task_id, 7, "작업 완료. 다운로드를 시작합니다.", 100)
                await asyncio.sleep(0.5)
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
                
                # 일곱째 날: 모든 일을 마치시고 일곱째 날에 안식하시니라 (완료)
                progress_manager.update_progress(task_id, 7, "작업 완료. 다운로드를 시작합니다.", 100)
                await asyncio.sleep(0.5)
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
