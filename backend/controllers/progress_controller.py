import json
import asyncio
import logging
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from backend.models.task import progress_manager

router = APIRouter(prefix="/api/progress", tags=["progress"])
logger = logging.getLogger(__name__)

@router.get("/{task_id}")
async def stream_progress(task_id: str) -> StreamingResponse:
    """
    내용: 특정 작업의 진행 상태를 SSE(Server-Sent Events)를 통해 클라이언트에 스트리밍합니다.
    param: task_id - 클라이언트가 생성한 고유 작업 ID
    return: StreamingResponse (text/event-stream)
    """
    async def event_generator():
        try:
            while True:
                status = progress_manager.get_status(task_id)
                yield f"data: {json.dumps(status)}\n\n"
                
                # 작업 완료(Day 7) 또는 에러(Day -1) 시 연결 종료
                if status["day"] >= 7 or status["day"] == -1:
                    await asyncio.sleep(1) # 마지막 메시지가 전달될 시간을 확보
                    break
                    
                await asyncio.sleep(0.5)
        except asyncio.CancelledError:
            logger.info(f"Task {task_id} progress stream cancelled.")
        except Exception as e:
            logger.error(f"Error in progress stream for Task {task_id}: {str(e)}")

    return StreamingResponse(event_generator(), media_type="text/event-stream")
