import axios from 'axios';

/**
 * 내용: 프로젝트 전역에서 사용할 Axios 인스턴스 설정
 */
const apiClient = axios.create({
  baseURL: '/', // 동일 출처 또는 프록시 설정 기반
  timeout: 120000, // 대용량 파일 변환을 고려한 2분 타임아웃
});

// 요청 인터셉터 (필요 시 공통 헤더 추가 등)
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (공통 에러 핸들링)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
