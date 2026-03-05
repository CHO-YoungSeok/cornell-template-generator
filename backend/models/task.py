import logging
import json
from typing import Dict, Any

logger = logging.getLogger(__name__)

class ProgressManager:
    """
    내용: 작업의 실시간 진행 상태를 관리하는 싱글톤 매니저 클래스
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ProgressManager, cls).__new__(cls)
            cls._instance.tasks = {}
        return cls._instance

    def update_progress(self, task_id: str, day: int, message: str, progress: int) -> None:
        """
        내용: 특정 작업의 진행 상태를 업데이트합니다.
        param: task_id - 고유 작업 ID
        param: day - 진행 단계 (1-7)
        param: message - 사용자에게 보여줄 메시지
        param: progress - 진행률 (0-100)
        return: 없음
        """
        self.tasks[task_id] = {
            "day": day,
            "message": message,
            "progress": progress
        }
        logger.info(f"Task {task_id} updated: Day {day}, {message} ({progress}%)")

    def get_status(self, task_id: str) -> Dict[str, Any]:
        """
        내용: 특정 작업의 현재 진행 상태를 조회합니다.
        param: task_id - 고유 작업 ID
        return: 진행 상태 딕셔너리 (없을 경우 기본값 반환)
        """
        return self.tasks.get(task_id, {"day": 0, "message": "준비 중...", "progress": 0})

    def remove_task(self, task_id: str) -> None:
        """
        내용: 작업 완료 후 상태 데이터를 삭제합니다.
        param: task_id - 고유 작업 ID
        return: 없음
        """
        if task_id in self.tasks:
            del self.tasks[task_id]
            logger.info(f"Task {task_id} removed from ProgressManager")

# 싱글톤 인스턴스 노출
progress_manager = ProgressManager()
