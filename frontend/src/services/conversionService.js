import apiClient from './apiClient';

/**
 * 내용: 백엔드에 파일 변환 요청을 보내고 결과 파일을 다운로드합니다.
 * param: taskId - 고유 작업 ID (헤더 전달용)
 * param: formData - 업로드할 파일 및 그룹 설정 데이터
 * return: AxiosResponse
 */
export const startConversionProcess = async (taskId, formData) => {
  return apiClient.post('/api/convert', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'X-Task-ID': taskId,
    },
    responseType: 'blob', // 파일 다운로드를 위해 blob 타입 지정
  });
};

/**
 * 내용: 특정 작업 ID에 대한 SSE URL을 생성합니다.
 * param: taskId - 고유 작업 ID
 * return: SSE URL 문자열
 */
export const getProgressEventUrl = (taskId) => {
  return `/api/progress/${taskId}`;
};
