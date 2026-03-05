import { useState, useCallback, useRef } from 'react';
import { startConversionProcess, getProgressEventUrl } from '../services/conversionService';

/**
 * 내용: 파일 변환 프로세스(SSE 연결 및 POST 요청)를 제어하는 컨트롤러 훅
 * param: taskId - 클라이언트가 생성한 고유 작업 ID
 * return: status, isProcessing, error, startConversion 함수
 */
export const useConversionController = (taskId) => {
  const [status, setStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // SSE 연결 객체 참조 (컴포넌트 리렌더링과 독립적으로 관리)
  const eventSourceRef = useRef(null);

  /**
   * 내용: SSE 연결을 종료하고 참조를 초기화합니다.
   */
  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  /**
   * 내용: 변환 프로세스를 시작합니다. (SSE 연결 수립 후 POST 요청 전송)
   * param: formData - 업로드할 파일 및 설정 데이터
   */
  const startConversion = useCallback(async (formData) => {
    if (!taskId) return;

    setIsProcessing(true);
    setError(null);
    setStatus({ day: 0, message: '서버와 연결 중...', progress: 0 });

    try {
      // 1. SSE 연결 수립
      const url = getProgressEventUrl(taskId);
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      // SSE 연결 확인용 프로미스 (POST 요청 전 동기화)
      const connectionPromise = new Promise((resolve, reject) => {
        eventSource.onopen = () => {
          console.log('SSE Connection established.');
          resolve();
        };
        eventSource.onerror = (err) => {
          console.error('SSE Connection failed:', err);
          reject(new Error('진행 상태 서버와의 연결에 실패했습니다.'));
        };
      });

      // 진행률 데이터 수신 핸들러
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setStatus(data);

          // 작업 완료(7) 또는 실패(-1) 시 연결 종료
          if (data.day >= 7 || data.day === -1) {
            closeEventSource();
            setIsProcessing(false);
          }
        } catch (e) {
          console.error('Failed to parse SSE message:', e);
        }
      };

      // 2. 연결이 수립되면(또는 타임아웃 3초) POST 요청 전송
      try {
        await Promise.race([
          connectionPromise,
          new Promise((resolve) => setTimeout(resolve, 3000)) // 타임아웃 후 강행
        ]);
      } catch (e) {
        console.warn('SSE connection timeout or error, proceeding with POST anyway.');
      }

      // 3. 실제 변환 요청 전송
      const response = await startConversionProcess(taskId, formData);

      // 4. 파일 다운로드 처리
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const downloadUrl = window.URL.createObjectURL(blob);
      const contentDisposition = response.headers['content-disposition'];
      
      let fileName = 'converted_document.docx';
      if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
        fileName = contentDisposition.split('filename=')[1].replace(/"/g, '');
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

    } catch (err) {
      console.error('Conversion failed:', err);
      setError(err.message || '파일 변환 중 오류가 발생했습니다.');
      setStatus({ day: -1, message: '변환 실패', progress: 0 });
      closeEventSource();
      setIsProcessing(false);
    }
  }, [taskId, closeEventSource]);

  return { status, isProcessing, error, startConversion };
};
