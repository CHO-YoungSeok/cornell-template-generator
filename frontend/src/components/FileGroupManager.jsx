import React, { useState, useEffect } from 'react';
import { convertFiles, subscribeToProgress } from '../api/client';
import { Trash2, Loader2, Download, Plus } from 'lucide-react';
import ProgressOverlay from './ProgressOverlay';

/**
 * 내용: 업로드된 파일들을 관리하고 그룹별 설정(파일명, 제목)을 입력받아 변환 요청을 수행하는 컴포넌트입니다.
 * param: files - FileUploader를 통해 추가된 초기 파일 배열
 * param: onClearFiles - 모든 파일/그룹을 초기화하는 함수
 * param: selectedTheme - App 컴포넌트에서 전달받은 현재 선택된 테마
 * return: JSX 요소
 */
function FileGroupManager({ files, onClearFiles, selectedTheme }) {
  // groups 상태 구조를 엄격하게 정의합니다.
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 창세기 진행 상태 관리를 위한 state
  const [genesisDay, setGenesisDay] = useState(1);
  const [totalProgress, setTotalProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  /**
   * 내용: 파일명에서 확장자를 제거한 순수 이름을 반환합니다.
   * param: fileName - 전체 파일명 (예: document.pptx)
   * return: 확장자가 제거된 파일명 (예: document)
   */
  const getBaseName = (fileName) => {
    if (!fileName) return "문서";
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex);
  };

  /**
   * 내용: 입력 필드 포커스 시 텍스트 전체를 선택합니다.
   * param: event - 포커스 이벤트 객체
   * return: 없음
   */
  const handleFocus = (event) => {
    event.target.select();
  };

  // 초기 파일이 업로드되면 기본 그룹을 하나 생성합니다.
  useEffect(() => {
    if (files.length > 0 && groups.length === 0) {
      const defaultName = getBaseName(files[0].name);
      setGroups([{
        id: Date.now(),
        filename: defaultName,
        documentTitle: defaultName,
        imageSize: "standard",
        files: [...files]
      }]);
    } else if (files.length === 0) {
      setGroups([]);
    }
  }, [files, groups.length]);

  /**
   * 내용: 특정 그룹의 필드(파일명, 문서 제목, 이미지 크기)를 업데이트합니다.
   * param: id - 그룹 ID
   * param: field - 'filename' | 'documentTitle' | 'imageSize'
   * param: value - 변경될 값
   * return: 없음
   */
  const handleGroupChange = (id, field, value) => {
    setGroups(prevGroups => 
      prevGroups.map(g => g.id === id ? { ...g, [field]: value } : g)
    );
  };

  /**
   * 내용: 새로운 빈 그룹을 추가합니다. (사용자가 파일을 분배할 수 있도록 지원 가능)
   * param: 없음
   * return: 없음
   */
  const addGroup = () => {
    setGroups(prev => [...prev, {
      id: Date.now(),
      filename: `변환된문서_${prev.length + 1}`,
      documentTitle: "문서 제목",
      imageSize: "standard",
      files: []
    }]);
  };
  /**
   * 내용: 변환 요청을 실행하고 결과 파일을 다운로드합니다.
   * param: 없음
   * return: Promise<void>
   */
  const handleConvert = async () => {
    if (groups.some(g => g.files.length === 0)) {
      setError('모든 그룹에 최소 하나 이상의 파일이 포함되어야 합니다.');
      return;
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setIsLoading(true);
    setError(null);
    setGenesisDay(1);
    setTotalProgress(0);
    setStatusMessage("연결 준비 중...");

    let eventSource = null;

    try {
      // SSE 연결 수립을 기다림 (레이스 컨디션 방지)
      await new Promise((resolve) => {
        let isResolved = false;
        
        // 3초 후에도 연결이 안 되면 일단 넘어감 (무한 대기 방지)
        const timeoutId = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            console.warn('SSE 연결 대기 시간 초과, 변환 요청 강제 진행');
            resolve();
          }
        }, 3000);

        eventSource = subscribeToProgress(
          taskId,
          (data) => {
            setGenesisDay(data.day);
            setTotalProgress(data.progress);
            setStatusMessage(data.message);
          },
          (err) => {
            console.error('진행 상태 추적 중 오류:', err);
          },
          () => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeoutId);
              resolve();
            }
          }
        );
      });

      // 연결 확립 후 백엔드에 변환 POST 요청
      const response = await convertFiles(groups, taskId);
      
      // Blob 응답을 파일로 변환하여 다운로드
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // 서버에서 전달한 파일명 추출 (Content-Disposition 헤더 활용)
      const contentDisposition = response.headers['content-disposition'];
      let downloadFilename = 'converted_documents.zip';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?(?:;|$)/);
        if (filenameMatch && filenameMatch.length >= 2) {
          downloadFilename = decodeURIComponent(filenameMatch[1]);
        }
      } else if (groups.length === 1) {
        downloadFilename = `${groups[0].filename}.docx`;
      }

      link.setAttribute('download', downloadFilename);
      document.body.appendChild(link);
      link.click();
      
      // 리소스 정리
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('변환 오류:', err);
      
      let errorMessage = '문서 변환 중 오류가 발생했습니다.';
      
      // Blob 응답에서 에러 메시지 추출 (응답이 JSON인 경우)
      if (err.response && err.response.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch (parseErr) {
          console.error('에러 데이터 파싱 실패:', parseErr);
        }
      } else if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      if (eventSource) {
        eventSource.close(); // SSE 연결 종료
      }
    }
  };

  if (groups.length === 0 && files.length === 0) return null;

  return (
    <div style={{ marginTop: '30px', position: 'relative' }}>
      {isLoading && (
        <ProgressOverlay 
          theme={selectedTheme}
          day={genesisDay} 
          progress={totalProgress} 
          message={statusMessage} 
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px' }}>
        <button 
          onClick={addGroup}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',

            backgroundColor: '#e3f2fd', color: '#1976d2', border: 'none', borderRadius: '6px',
            cursor: 'pointer', fontWeight: '600'
          }}
        >
          <Plus size={18} /> 그룹 추가
        </button>
      </div>
      
      {groups.map((group, index) => (
        <div key={group.id} style={{
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h4 style={{ margin: 0, color: '#424242' }}>그룹 {index + 1}</h4>
            <span style={{ fontSize: '13px', color: '#757575' }}>{group.files.length}개 파일 포함됨</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#616161' }}>저장될 파일명</label>
              <input 
                type="text" 
                value={group.filename}
                onChange={(e) => handleGroupChange(group.id, 'filename', e.target.value)}
                onFocus={handleFocus}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #bdbdbd', outline: 'none' }}
                placeholder="예: AI수업_요약본"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#616161' }}>문서 내부 &lt;제목&gt;</label>
              <input 
                type="text" 
                value={group.documentTitle}
                onChange={(e) => handleGroupChange(group.id, 'documentTitle', e.target.value)}
                onFocus={handleFocus}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #bdbdbd', outline: 'none' }}
                placeholder="문서 상단에 표시될 제목"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#616161' }}>이미지 크기</label>
              <select 
                value={group.imageSize}
                onChange={(e) => handleGroupChange(group.id, 'imageSize', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #bdbdbd', outline: 'none', backgroundColor: '#fff' }}
              >
                <option value="standard">표준 (110mm)</option>
                <option value="original">원본 최대 (160mm)</option>
              </select>
            </div>
          </div>
          
          <div style={{ backgroundColor: '#f5f5f5', borderRadius: '8px', padding: '12px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#757575' }}>파일 리스트</label>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {group.files.length === 0 ? (
                <li style={{ fontSize: '13px', color: '#9e9e9e', fontStyle: 'italic' }}>파일을 이곳으로 드래그하거나 선택하세요.</li>
              ) : (
                group.files.map((file, i) => (
                  <li key={i} style={{ 
                    display: 'flex', justifyContent: 'space-between', padding: '6px 0', 
                    fontSize: '13px', color: '#424242', borderBottom: i === group.files.length - 1 ? 'none' : '1px solid #eeeeee' 
                  }}>
                    <span>{file.name}</span>
                    <span style={{ color: '#9e9e9e' }}>{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ))}

      {error && (
        <div style={{ padding: '14px', backgroundColor: '#ffebee', color: '#d32f2f', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', position: 'sticky', bottom: '20px' }}>
        <button 
          onClick={onClearFiles}
          disabled={isLoading}
          style={{ 
            padding: '12px 24px', borderRadius: '8px', border: '1px solid #e0e0e0', 
            backgroundColor: '#ffffff', cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '10px', color: '#424242', fontWeight: '600'
          }}
        >
          <Trash2 size={18} /> 전체 초기화
        </button>
        <button 
          onClick={handleConvert}
          disabled={isLoading || groups.length === 0}
          style={{ 
            padding: '12px 32px', borderRadius: '8px', border: 'none', 
            backgroundColor: isLoading ? '#bbdefb' : '#1976d2', color: '#ffffff', 
            fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
          }}
        >
          {isLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={18} />} 
          {isLoading ? '문서 변환 중...' : '변환 및 다운로드 시작'}
        </button>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default FileGroupManager;