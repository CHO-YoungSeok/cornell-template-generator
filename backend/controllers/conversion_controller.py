from fastapi import APIRouter, Depends, Request
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from backend.services.orchestrator_service import get_orchestrator, ConversionOrchestrator

router = APIRouter(prefix="/api/convert", tags=["conversion"])

@router.post("")
async def convert_files(
    request: Request,
    orchestrator: ConversionOrchestrator = Depends(get_orchestrator)
):
    """
    내용: 업로드된 파일 그룹들을 받아 변환 프로세스를 시작하고 결과 파일을 반환합니다.
    param: request - 클라이언트 요청 (X-Task-ID 헤더 및 폼 데이터 포함)
    param: orchestrator - 변환 프로세스를 관리하는 서비스
    return: 변환된 DOCX 또는 ZIP 파일 (FileResponse)
    """
    task_id = request.headers.get("X-Task-ID", "unknown")
    form_data = await request.form()
    
    # 서비스 계층에 비즈니스 로직 위임
    file_path, filename = await orchestrator.process_conversion(task_id, form_data)
    
    # 클린업 작업을 백그라운드 태스크로 등록
    cleanup_task = orchestrator.get_cleanup_task(file_path, task_id)
    
    return FileResponse(
        file_path,
        filename=filename,
        background=BackgroundTask(cleanup_task)
    )
