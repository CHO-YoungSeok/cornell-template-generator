from fastapi import Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

class ConversionException(Exception):
    """
    내용: 변환 프로세스 중 발생하는 비즈니스 예외 클래스
    """
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)

async def conversion_exception_handler(request: Request, exc: ConversionException) -> JSONResponse:
    """
    내용: ConversionException을 캐치하여 클라이언트에 일관된 에러 응답을 반환합니다.
    """
    logger.error(f"변환 예외 발생: {exc.message}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": exc.message}
    )
