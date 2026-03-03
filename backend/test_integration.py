import os
import sys
from pathlib import Path

# backend 디렉토리를 path에 추가
sys.path.append(os.path.join(os.path.dirname(__file__), "services"))
from converter import convert_pdf_to_images, generate_docx

def test_docx_generation():
    """
    내용: PDF를 이미지로 변환하고 DOCX를 생성하는 핵심 로직을 테스트합니다.
    param: 없음
    return: 없음
    """
    # 1. 템플릿 존재 확인
    template_path = os.path.join(os.path.dirname(__file__), "templates", "필기양식_template.docx")
    if not os.path.exists(template_path):
        print(f"Error: Template not found at {template_path}")
        return

    # 2. 테스트용 임시 디렉토리 생성
    test_dir = os.path.join(os.path.dirname(__file__), "test_output")
    os.makedirs(test_dir, exist_ok=True)
    
    # 3. 테스트용 PDF 파일 (만약 있다면) 사용하거나 메시지 출력
    # 실제 테스트를 위해 간단한 더미 이미지를 사용하여 DOCX 생성만이라도 확인
    from PIL import Image
    dummy_img_path = os.path.join(test_dir, "dummy.jpg")
    Image.new('RGB', (100, 100), color = (73, 109, 137)).save(dummy_img_path)
    
    output_docx = os.path.join(test_dir, "test_result.docx")
    
    try:
        print("Generating DOCX with dummy image...")
        generate_docx(template_path, output_docx, "테스트 문서 제목", [dummy_img_path])
        
        if os.path.exists(output_docx):
            print(f"Success: DOCX generated at {output_docx}")
        else:
            print("Fail: DOCX not generated.")
            
    except Exception as e:
        print(f"Error during DOCX generation: {e}")

if __name__ == "__main__":
    test_docx_generation()
