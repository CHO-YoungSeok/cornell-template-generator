import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // FastAPI 기본 포트

/**
 * 내용: 업로드된 파일 그룹 정보를 백엔드 API에 전달하여 변환을 요청합니다.
 * param: groups - 변환할 파일 그룹들의 배열
 * param: taskId - 진행 상태 추적을 위한 고유 ID
 * return: AxiosResponse 객체
 */
export const convertFiles = async (groups, taskId = 'unknown') => {
  const formData = new FormData();

  groups.forEach((group, index) => {
    formData.append(`group_${index}_filename`, group.filename);
    formData.append(`group_${index}_documentTitle`, group.documentTitle);
    formData.append(`group_${index}_imageSize`, group.imageSize || 'standard');

    group.files.forEach(file => {
      formData.append(`group_${index}_files`, file);
    });
  });

  const response = await axios.post(`${API_BASE_URL}/api/convert`, formData, {
    headers: {
      'X-Task-ID': taskId
    },
    responseType: 'blob', // 다운로드 처리를 위해 blob으로 설정
  });

  return response;
};

/**
 * 내용: 서버로부터 진행 상태(SSE)를 구독합니다.
 * param: taskId - 구독할 작업 ID
 * param: onMessage - 메시지 수신 시 호출될 콜백 함수
 * param: onError - 오류 발생 시 호출될 콜백 함수
 * param: onOpen - 연결 성공 시 호출될 콜백 함수
 * return: EventSource 인스턴스 (연결 종료를 위해 반환)
 */
export const subscribeToProgress = (taskId, onMessage, onError, onOpen) => {
  const eventSource = new EventSource(`${API_BASE_URL}/api/progress/${taskId}`);

  if (onOpen) {
    eventSource.onopen = onOpen;
  }

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (err) {
      console.error('SSE 데이터 파싱 오류:', err);
    }
  };

  eventSource.onerror = (err) => {
    console.error('SSE 연결 오류:', err);
    if (onError) onError(err);
    eventSource.close();
  };

  return eventSource;
};