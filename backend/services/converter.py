import os
import subprocess
import shutil
from typing import List, Optional
from pathlib import Path
from pdf2image import convert_from_path
from docxtpl import DocxTemplate, InlineImage
from docx.shared import Mm
from PIL import Image

def get_soffice_path() -> str:
    """
    내용: 시스템에서 LibreOffice(soffice)의 실행 경로를 찾습니다.
    return: soffice의 절대 경로 또는 "soffice" (기본값)
    """
    # 1. 환경 변수 확인
    env_path = os.getenv("SOFFICE_PATH")
    if env_path and os.path.exists(env_path):
        return env_path
    
    # 2. MacOS 표준 경로 확인
    macos_path = "/Applications/LibreOffice.app/Contents/MacOS/soffice"
    if os.path.exists(macos_path):
        return macos_path
    
    # 3. PATH에서 찾기
    which_path = shutil.which("soffice")
    if which_path:
        return which_path
        
    return "soffice"

def convert_pptx_to_pdf(pptx_path: str, output_dir: str) -> str:
    """
    내용: LibreOffice를 사용하여 PPTX 파일을 PDF로 변환합니다.
    param: pptx_path - 변환할 PPTX 파일의 절대 경로
    param: output_dir - 생성될 PDF를 저장할 디렉토리 경로
    return: 생성된 PDF 파일의 절대 경로
    """
    soffice_path = get_soffice_path()
    
    command = [
        soffice_path,
        "--headless",
        "--convert-to", "pdf",
        "--outdir", output_dir,
        pptx_path
    ]
    
    try:
        # 쉘 실행 시 환경 변수 유지
        result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"PPTX to PDF 변환 실패 (LibreOffice 에러): {e.stderr or e.stdout}")
    except FileNotFoundError:
        raise RuntimeError(f"LibreOffice({soffice_path})를 시스템에서 찾을 수 없습니다. 설치 여부를 확인해주세요.")
    
    base_name = Path(pptx_path).stem
    pdf_path = os.path.join(output_dir, f"{base_name}.pdf")
    
    # LibreOffice는 때때로 성공해도 파일이 바로 나타나지 않을 수 있음 (I/O 지연)
    if not os.path.exists(pdf_path):
        # 대소문자 구분이나 공백 등으로 인한 파일명 불일치 가능성 체크
        files = [f for f in os.listdir(output_dir) if f.lower().endswith(".pdf")]
        if files:
            pdf_path = os.path.join(output_dir, files[0])
        else:
            raise FileNotFoundError(f"PDF 파일이 생성되지 않았습니다: {pdf_path}")
        
    return pdf_path

def convert_pdf_to_images(pdf_path: str, output_dir: str) -> List[str]:
    """
    내용: PDF 파일을 각 페이지별 이미지 파일(JPEG)로 변환합니다. 200 DPI 설정을 적용합니다.
    param: pdf_path - 변환할 PDF 파일의 절대 경로
    param: output_dir - 생성될 이미지 파일들을 저장할 디렉토리 경로
    return: 생성된 이미지 파일들의 절대 경로 리스트
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Poppler 경로 수동 지정 가능성 (환경 변수 POPPLER_PATH)
    poppler_path = os.getenv("POPPLER_PATH")
    
    try:
        # 200 DPI 설정으로 성능과 품질의 균형을 맞춤
        images = convert_from_path(pdf_path, dpi=200, poppler_path=poppler_path)
    except Exception as e:
        if "pdftoppm" in str(e).lower() or "poppler" in str(e).lower():
            raise RuntimeError("PDF 변환 엔진(Poppler)을 찾을 수 없습니다. 'brew install poppler' 등으로 설치해주세요.")
        raise e

    image_paths = []
    base_name = Path(pdf_path).stem
    for i, image in enumerate(images):
        img_path = os.path.join(output_dir, f"{base_name}_page_{i + 1}.jpg")
        image.save(img_path, "JPEG", quality=85)
        image_paths.append(img_path)
        
    return image_paths

def generate_docx(template_path: str, output_path: str, user_title: str, image_paths: List[str], size_option: str = "standard") -> None:
    """
    내용: DOCX 템플릿과 이미지들을 사용하여 최종 DOCX 파일을 생성합니다.
    param: template_path - 사용할 docxtpl 템플릿 파일의 경로
    param: output_path - 생성될 최종 DOCX 파일의 저장 경로
    param: user_title - 문서 내부에 삽입될 사용자 입력 제목
    param: image_paths - 문서에 삽입될 이미지 파일들의 경로 리스트
    param: size_option - 이미지 크기 옵션 ("standard" | "original")
    return: 없음
    """
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"템플릿 파일을 찾을 수 없습니다: {template_path}")

    doc = DocxTemplate(template_path)
    
    # 이미지 크기 결정 (표준: 110mm, 원본최대: 160mm)
    width_val = 110 if size_option == "standard" else 160
    
    # 이미지를 InlineImage 객체로 변환 (비율 유지하며 너비 지정)
    inline_images = [InlineImage(doc, img_path, width=Mm(width_val)) for img_path in image_paths]
        
    context = {
        'title': user_title,
        'slide_images': inline_images
    }
    
    doc.render(context)
    doc.save(output_path)
