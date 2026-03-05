import os
import sys
import logging
import shutil
from fastapi import FastAPI, Response
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

# 프로젝트 루트를 Python PATH에 추가하여 모듈 임포트 지원
# backend 디렉토리의 상위 디렉토리(프로젝트 루트)를 추가합니다.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
sys.path.append(PROJECT_ROOT)

# 내부 모듈 임포트
from backend.controllers import conversion_controller, progress_controller
from backend.core.exceptions import ConversionException, conversion_exception_handler
from backend.services.converter import get_soffice_path

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# 시스템 환경 변수 설정 (LibreOffice, Poppler 탐색 지원)
os.environ["PATH"] = f"/opt/homebrew/bin:{os.environ.get('PATH', '')}"

# 프론트엔드 빌드 경로 설정
FRONTEND_DIR = os.path.normpath(os.path.join(BASE_DIR, "..", "frontend", "dist"))

def create_app() -> FastAPI:
    """
    내용: FastAPI 애플리케이션 인스턴스를 생성하고 라우터, 미들웨어, 예외 처리기를 설정합니다.
    return: 설정이 완료된 FastAPI 인스턴스
    """
    app = FastAPI(
        title="Cornell Flow API",
        description="강의 자료를 코넬 양식 DOCX로 자동 변환하는 API",
        version="2.0.0"
    )

    # CORS 설정
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 예외 처리기 등록
    app.add_exception_handler(ConversionException, conversion_exception_handler)

    # 컨트롤러(라우터) 등록
    app.include_router(conversion_controller.router)
    app.include_router(progress_controller.router)

    # 정적 파일 서빙 (Frontend Build Assets)
    assets_path = os.path.join(FRONTEND_DIR, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")
        logger.info(f"정적 자산 경로 마운트 완료: {assets_path}")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str) -> Response:
        """
        내용: SPA 라우팅 지원을 위해 정의되지 않은 모든 요청에 대해 index.html을 반환합니다.
        """
        index_path = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        
        return JSONResponse(
            status_code=404,
            content={"error": "프론트엔드 빌드 결과물을 찾을 수 없습니다. 'npm run build'가 필요합니다."}
        )

    @app.on_event("startup")
    async def startup_event() -> None:
        """
        내용: 서버 시작 시 시스템 의존성 및 템플릿 파일 존재 여부를 확인합니다.
        """
        logger.info("시스템 의존성 체크 중...")
        
        soffice_path = get_soffice_path()
        if soffice_path == "soffice" and not shutil.which("soffice"):
            logger.warning("경고: LibreOffice(soffice)를 시스템 PATH에서 찾을 수 없습니다.")
        
        if not shutil.which("pdftoppm") and not os.getenv("POPPLER_PATH"):
            logger.warning("경고: Poppler(pdftoppm)를 시스템 PATH에서 찾을 수 없습니다.")

        template_path = os.path.join(BASE_DIR, "templates", "필기양식_template.docx")
        if not os.path.exists(template_path):
            logger.error(f"치명적 오류: 템플릿 파일을 찾을 수 없습니다. ({template_path})")

    return app

app = create_app()

if __name__ == "__main__":
    # 개발 서버 실행
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
