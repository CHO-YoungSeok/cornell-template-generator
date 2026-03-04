# 🌌 cornell-template: 강의 자료를 내것으로 만드는 마법
> **PDF와 PPTX를 단 몇 초 만에 완벽한 코넬 노트(DOCX)로 변환하세요.**  
> 코넬 노트의 과학적인 4분할 구조를 활용하여 배운 내용을 완벽하게 나의 것으로 만드는 체계적인 시스템입니다.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-05998B?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

---

## ✨ 왜 cornell-template-generator 인가요?

### 1. 🎨 감성을 자극하는 멀티 테마 시스템
무미건조한 업로드 화면은 잊으세요. 당신의 취향에 맞는 테마를 선택할 수 있습니다.
*   **Genesis(창세기) 테마**: 심연의 우주와 황금빛 광채가 어우러진 신비로운 분위기.
*   **Genius(열공) 테마**: 공부하는 거북이 애니메이션과 함께 활기찬 학습 에너지를 전달.

### 2. 🐢 실시간 진행률 & 거북이 애니메이션
변환이 진행되는 동안 **공부하는 거북이**가 당신과 함께합니다. SSE(Server-Sent Events) 기술을 통해 서버의 처리 단계를 실시간으로 시각화하여 지루한 대기 시간을 즐거운 경험으로 바꿉니다.

### 3. 🖱️ 인터랙티브 4분할 가이드
코넬 노트의 과학적인 구조(제목, 단서, 세부내용, 요약)를 마우스 호버 한 번으로 확인하세요. 우측 설명을 가리키면 좌측 캔버스에서 해당 영역이 즉시 하이라이트됩니다.

---

## 🛠️ 기술 스택
*   **Frontend**: `React 19` 기반의 초고속 렌더링 및 `Canvas API` 기반 인터랙션.
*   **Backend**: `FastAPI`를 활용한 비동기 문서 처리 및 고성능 스트리밍.
*   **Engine**: `LibreOffice` & `Poppler`를 통한 무손실 고화질 이미지 추출.

---

## 🚀 3분 만에 시작하기

### 1. 필수 도구 설치 (Pre-requisites)
문서 변환의 마법을 부리기 위해 아래 도구가 필요합니다.

*   **MacOS**: `brew install --cask libreoffice poppler`
*   **Windows**: [LibreOffice](https://www.libreoffice.org/) 및 [Poppler](http://blog.alivate.com.au/poppler-windows/) 설치 후 PATH 등록.

### 2. 마법의 성 구축 (Setup)

```bash
# 🐍 Backend: 데이터 엔진 가동
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python3 backend/main.py

# ⚛️ Frontend: 인터페이스 소환
cd frontend
npm install
npm run build
```

---

## 📖 마법 사용법
1.  **자료 투척**: 준비된 PDF나 PPTX 파일을 화면 중앙 업로드 영역에 드래그 앤 드롭 하세요.
2.  **주문 입력**: 저장될 파일명과 문서 내부 제목을 입력합니다. (이미지 크기도 조절 가능!)
3.  **변환 시작**: '변환 및 다운로드 시작' 버튼을 누르고 거북이의 성장을 지켜보세요.
4.  **지혜 획득**: 완성된 DOCX 파일이 자동으로 다운로드됩니다. 이제 열공 모드 돌입!

---

## 🔍 트러블슈팅 및 팁
*   **폰트가 깨지나요?**: PPTX에 사용된 폰트를 시스템에 설치하면 서버가 더 완벽한 레이아웃을 유지할 수 있습니다.
*   **거북이가 멈췄나요?**: SSE 연결 안정화를 위해 초기 연결 시 약간의 대기 시간이 발생할 수 있습니다.

---
**작성일**: 2026-03-04  
**작성자**: cys
