import os
import shutil
import logging
from typing import Dict, List, Union
from fastapi import UploadFile
from starlette.datastructures import FormData

logger = logging.getLogger(__name__)

class FileService:
    """
    내용: 임시 파일 저장, 디렉토리 관리 및 클린업을 담당하는 서비스 클래스
    """
    
    @staticmethod
    def cleanup_temp_dir(temp_dir: str) -> None:
        """
        내용: 임시 디렉토리를 재귀적으로 삭제합니다.
        param: temp_dir - 삭제할 임시 디렉토리의 절대 경로
        return: 없음
        """
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
            logger.info(f"임시 디렉토리 삭제 완료: {temp_dir}")

    async def parse_group_data(self, form_data: FormData) -> Dict[int, Dict[str, Any]]:
        """
        내용: 클라이언트로부터 받은 multipart/form-data를 그룹별 구조로 파싱합니다.
        param: form_data - Request.form()으로부터 받은 폼 데이터
        return: 인덱싱된 그룹 데이터 딕셔너리
        """
        groups: Dict[int, Dict[str, Any]] = {}
        
        for key in form_data.keys():
            if not key.startswith("group_"):
                continue
                
            parts = key.split("_")
            if len(parts) < 3:
                continue
                
            try:
                group_index = int(parts[1])
            except ValueError:
                continue
                
            field_name = parts[2]
            
            if group_index not in groups:
                groups[group_index] = {
                    "filename": "document", 
                    "documentTitle": "", 
                    "imageSize": "standard", 
                    "files": []
                }
                
            values = form_data.getlist(key)
            
            for value in values:
                if field_name == "filename":
                    groups[group_index]["filename"] = str(value)
                elif field_name == "documentTitle":
                    groups[group_index]["documentTitle"] = str(value)
                elif field_name == "imageSize":
                    groups[group_index]["imageSize"] = str(value)
                elif field_name == "files":
                    if hasattr(value, "filename"):
                        groups[group_index]["files"].append(value)
                    
        return groups

file_service = FileService()
