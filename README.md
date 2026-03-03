# Cornell Template: PDF/PPTX to DOCX 자동 변환 시스템

이 프로젝트는 PDF 또는 PPTX 파일을 이미지로 추출하여, 지정된 `필기양식.docx` 템플릿에 자동으로 삽입해 주는 문서 변환 시스템입니다. 강의 자료나 발표 슬라이드를 공부하기 좋은 필기용 문서로 변환하는 데 최적화되어 있습니다.

## 🚀 시스템 아키텍처
- **Backend**: FastAPI (Python 3.14+)
- **Frontend**: React (Vite)
- **Engine**: LibreOffice (PPTX -> PDF), Poppler (PDF -> Image), docxtpl (Image -> DOCX)

---

## 🛠️ 사전 준비 (System Dependencies)

프로젝트 핵심 기능을 수행하기 위해 시스템 레벨의 도구 설치가 반드시 필요합니다.

### MacOS (Homebrew)
```bash
# PPTX 변환 엔진
brew install --cask libreoffice

# PDF 이미지 추출 엔진
brew install poppler
```

### Windows
1. [LibreOffice 공식 홈페이지](https://www.libreoffice.org/download/download/)에서 설치 후 `soffice` 명령어를 환경 변수(PATH)에 추가합니다.
2. [Poppler for Windows](http://blog.alivate.com.au/poppler-windows/)를 다운로드하여 `bin` 폴더를 환경 변수(PATH)에 추가합니다.

---

## 💻 설치 및 실행 순서

### 1. 백엔드 (Backend) 설정
백엔드 서버를 구동하기 전, 가상 환경 설정과 템플릿 파일 생성이 필요합니다.
/templates/필기양식_template.docx를 기반으로 생성됩니다.

```bash
# 1. 가상 환경 생성 및 활성화
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 2. 의존성 라이브러리 설치
pip install -r backend/requirements.txt

# 3. API 서버 실행
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. 프론트엔드 (Frontend) 설정
새로운 터미널을 열어 진행합니다.

```bash
# 1. 프론트엔드 디렉토리 이동
cd frontend

# 2. 패키지 설치
npm install

# 3. 개발 서버 실행
npm run dev
```
실행 후 브라우저에서 `http://localhost:5173`에 접속합니다.

---

## 📖 사용 방법
1. 브라우저에서 화면 중앙의 업로드 영역에 변환할 PDF 또는 PPTX 파일을 드래그합니다.
2. 하단에 생성된 **문서 변환 설정** 영역에서 다음을 입력합니다.
   - **저장될 파일명**: 다운로드 시 저장될 이름 (예: `AI_수업_요약`)
   - **문서 내부 <제목>**: 생성된 DOCX 문서 상단에 표시될 제목
3. **변환 및 다운로드 시작** 버튼을 클릭합니다.
4. 변환이 완료되면 자동으로 결과 파일(단일 파일 또는 ZIP)이 다운로드됩니다.

---

## ⚠️ 주의 사항 및 트러블슈팅

- **PPTX 레이아웃 깨짐**: 서버 환경에 PPTX에서 사용된 폰트가 설치되어 있지 않으면 레이아웃이 어긋날 수 있습니다. 시스템에 관련 폰트를 추가해 주세요.
- **템플릿 오류**: `create_template.py`를 실행하지 않으면 백엔드에서 템플릿 파일을 찾지 못해 오류가 발생합니다.
- **Mac M1/M2/M3 경로 이슈**: `soffice` 명령어가 터미널에서 실행되지 않는다면 아래 경로를 `~/.zshrc`에 추가하세요.
  `export PATH="/Applications/LibreOffice.app/Contents/MacOS:$PATH"`

---

**작성일**: 2026-03-03
**작성자**: Senior Lead Developer
