import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // FastAPI 기본 포트

/**
 * 내용: 업로드된 파일 그룹 정보를 백엔드 API에 전달하여 변환을 요청합니다.
 * param: groups - 변환할 파일 그룹들의 배열
 * param: taskId - 진행 상태 추적을 위한 고유 ID
 * param: onUploadProgress - 업로드 진행률을 처리할 콜백 함수 (선택 사항)
 * return: AxiosResponse 객체
 */
export const convertFiles = async (groups, taskId = 'unknown', onUploadProgress) => {
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
    timeout: 120000, // 대용량 파일 처리를 위한 2분 타임아웃
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percent);
      }
    }
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
  console.log(`SSE 연결 시도: ${taskId}`);
  const eventSource = new EventSource(`${API_BASE_URL}/api/progress/${taskId}`);

  if (onOpen) {
    eventSource.onopen = (e) => {
      console.log(`SSE 연결 성공: ${taskId}`);
      onOpen(e);
    };
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
    console.error(`SSE 연결 오류 (ID: ${taskId}):`, err);
    if (onError) onError(err);
    eventSource.close();
  };

  return eventSource;
};