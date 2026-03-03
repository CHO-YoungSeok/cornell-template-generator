import time
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class ProgressManager:
    """
    내용: 작업 ID별 진행 상태(Day 1~7 및 진행률)를 관리하는 싱글톤 클래스입니다.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ProgressManager, cls).__new__(cls)
            cls._instance.tasks: Dict[str, Dict[str, Any]] = {}
        return cls._instance

    def update_progress(self, task_id: str, day: int, message: str, progress: float) -> None:
        """
        내용: 특정 작업의 진행 상태를 업데이트합니다.
        param: task_id - 고유 작업 ID
        param: day - 창세기 기준 날짜 (1-7)
        param: message - 표시할 메시지
        param: progress - 0-100 사이의 진행률
        return: 없음
        """
        self.tasks[task_id] = {
            "day": day,
            "message": message,
            "progress": progress,
            "timestamp": time.time()
        }
        logger.info(f"Task {task_id} updated: Day {day} ({progress}%) - {message}")

    def get_status(self, task_id: str) -> Dict[str, Any]:
        """
        내용: 특정 작업의 현재 상태를 조회합니다.
        param: task_id - 고유 작업 ID
        return: 상태 정보를 담은 딕셔너리 (없을 경우 기본값 반환)
        """
        return self.tasks.get(task_id, {
            "day": 1,
            "message": "준비 중...",
            "progress": 0,
            "timestamp": time.time()
        })

    def remove_task(self, task_id: str) -> None:
        """
        내용: 완료되거나 실패한 작업을 목록에서 제거합니다.
        param: task_id - 고유 작업 ID
        return: 없음
        """
        if task_id in self.tasks:
            del self.tasks[task_id]
            logger.info(f"Task {task_id} removed from progress manager.")

# 글로벌 인스턴스
progress_manager = ProgressManager()
