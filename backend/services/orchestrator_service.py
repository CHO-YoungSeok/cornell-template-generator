import os
import tempfile
import zipfile
import logging
from typing import Dict, List, Tuple, Any
from fastapi import UploadFile
from starlette.datastructures import FormData
from backend.models.task import ProgressManager, progress_manager
from backend.services.file_service import FileService, file_service
from backend.services.converter import convert_pptx_to_pdf, convert_pdf_to_images, generate_docx
from backend.core.exceptions import ConversionException

logger = logging.getLogger(__name__)

class ConversionOrchestrator:
    """
    내용: 모델 및 컨버터와 통신하여 파일 변환의 전 과정을 제어하는 오케스트레이터 서비스
    """
    def __init__(self, pm: ProgressManager, fs: FileService):
        self.pm = pm
        self.fs = fs
        self.template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", "필기양식_template.docx")

    async def process_conversion(self, task_id: str, form_data: FormData) -> Tuple[str, str]:
        """
        내용: 파일 업로드부터 DOCX 생성, 압축까지의 전체 파이프라인을 실행합니다.
        param: task_id - 고유 작업 ID
        param: form_data - 요청으로부터 받은 폼 데이터
        return: (결과 파일 경로, 파일 이름) 튜플
        """
        temp_dir = tempfile.mkdtemp()
        try:
            self.pm.update_progress(task_id, 1, "초기화 및 준비 중...", 10)
            
            # 1. 폼 데이터 파싱
            groups = await self.fs.parse_group_data(form_data)
            if not groups:
                raise ConversionException("전송된 파일 그룹이 없습니다.")

            # 2. 템플릿 존재 여부 확인
            if not os.path.exists(self.template_path):
                raise ConversionException("템플릿 파일을 찾을 수 없습니다.")

            output_files: List[str] = []

            # 3. 각 그룹별 변환 프로세스 진행
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
                    file_ext = os.path.splitext(original_filename).lower()[1] if "." in original_filename else ""
                    file_ext = os.path.splitext(original_filename)[1].lower()
                    
                    input_file_path = os.path.join(group_temp_dir, original_filename)
                    with open(input_file_path, "wb") as f:
                        f.write(file_content)
                    
                    if file_ext == ".pptx":
                        self.pm.update_progress(task_id, 2, f"문서 구조 변환 중 ({original_filename})", 25)
                        pdf_path = convert_pptx_to_pdf(input_file_path, group_temp_dir)
                    elif file_ext == ".pdf":
                        pdf_path = input_file_path
                    else:
                        continue
                        
                    self.pm.update_progress(task_id, 3, "이미지 에셋 추출 중...", 40)
                    images = convert_pdf_to_images(pdf_path, os.path.join(group_temp_dir, f"images_{file_idx}"))
                    all_image_paths.extend(images)
                
                if all_image_paths:
                    self.pm.update_progress(task_id, 4, f"새로운 문서 렌더링 중 ({out_filename})", 60)
                    output_docx_path = os.path.join(temp_dir, out_filename)
                    generate_docx(self.template_path, output_docx_path, str(group["documentTitle"]), all_image_paths, str(group["imageSize"]))
                    output_files.append(output_docx_path)
                
            if not output_files:
                raise ConversionException("변환된 파일이 없습니다.")

            self.pm.update_progress(task_id, 6, "최종 결과물 패키징 중...", 90)

            # 4. 결과물 반환 준비 (단일 파일 vs ZIP 압축)
            if len(output_files) == 1:
                self.pm.update_progress(task_id, 7, "작업 완료. 다운로드를 시작합니다.", 100)
                return output_files[0], os.path.basename(output_files[0])
            else:
                zip_path = os.path.join(temp_dir, "converted_documents.zip")
                with zipfile.ZipFile(zip_path, 'w') as zipf:
                    for file_path in output_files:
                        zipf.write(file_path, arcname=os.path.basename(file_path))
                
                self.pm.update_progress(task_id, 7, "작업 완료. 다운로드를 시작합니다.", 100)
                return zip_path, "converted_documents.zip"

        except Exception as e:
            self.pm.update_progress(task_id, -1, f"에러 발생: {str(e)}", 0)
            self.fs.cleanup_temp_dir(temp_dir)
            if isinstance(e, ConversionException):
                raise e
            raise ConversionException(f"변환 프로세스 실패: {str(e)}")

    def get_cleanup_task(self, temp_dir: str, task_id: str):
        """
        내용: 작업 완료 후 임시 파일을 정리하기 위한 콜백 함수를 반환합니다.
        """
        def cleanup():
            self.fs.cleanup_temp_dir(os.path.dirname(temp_dir) if temp_dir.endswith(".zip") or ".docx" in temp_dir else temp_dir)
            self.pm.remove_task(task_id)
        return cleanup

# 의존성 주입을 위한 서비스 인스턴스
orchestrator_service = ConversionOrchestrator(progress_manager, file_service)

def get_orchestrator():
    """
    내용: FastAPI Depends를 통해 오케스트레이터 인스턴스를 제공합니다.
    """
    return orchestrator_service
