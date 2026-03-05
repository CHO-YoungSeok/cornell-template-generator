from pydantic import BaseModel, Field
from typing import List, Optional

class ConversionRequest(BaseModel):
    """
    내용: 파일 변환 요청 데이터 모델
    """
    taskId: str = Field(..., description="클라이언트에서 생성한 고유 작업 ID")

class ConversionResponse(BaseModel):
    """
    내용: 변환 결과 응답 모델
    """
    success: bool
    message: str
    download_url: Optional[str] = None
    task_id: str
