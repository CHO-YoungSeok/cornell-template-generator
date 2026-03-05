import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Loader2, Download, Plus } from 'lucide-react';
import ProgressOverlay from './ProgressOverlay';
import { useConversionController } from '../../controllers/useConversionController';
import './FileGroupManager.css';

/**
 * 내용: 업로드된 파일들을 관리하고 그룹별 설정(파일명, 제목)을 입력받아 변환 요청을 수행하는 컴포넌트입니다.
 * param: files - FileUploader를 통해 추가된 초기 파일 배열
 * param: onClearFiles - 모든 파일/그룹을 초기화하는 함수
 * param: selectedTheme - App 컴포넌트에서 전달받은 현재 선택된 테마
 * return: JSX 요소
 */
function FileGroupManager({ files, onClearFiles, selectedTheme }) {
  const [groups, setGroups] = useState([]);
  
  // 컴포넌트 생명주기 동안 유지될 고유 작업 ID 생성
  const taskId = useMemo(() => `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, []);
  
  // 커스텀 컨트롤러 훅 사용 (비즈니스 로직 분리)
  const { status, isProcessing, error: conversionError, startConversion } = useConversionController(taskId);

  const [localError, setLocalError] = useState(null);

  /**
   * 내용: 파일명에서 확장자를 제거한 순수 이름을 반환합니다.
   */
  const getBaseName = (fileName) => {
    if (!fileName) return "문서";
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex);
  };

  /**
   * 내용: 입력 필드 포커스 시 텍스트 전체를 선택합니다.
   */
  const handleFocus = (event) => {
    event.target.select();
  };

  // 초기 파일이 업로드되면 기본 그룹을 생성합니다.
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
   * 내용: 특정 그룹의 필드를 업데이트합니다.
   */
  const handleGroupChange = (id, field, value) => {
    setGroups(prevGroups => 
      prevGroups.map(g => g.id === id ? { ...g, [field]: value } : g)
    );
  };

  /**
   * 내용: 새로운 빈 그룹을 추가합니다.
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
   * 내용: 변환 요청을 실행합니다.
   */
  const handleConvert = async () => {
    if (groups.some(g => g.files.length === 0)) {
      setLocalError('모든 그룹에 최소 하나 이상의 파일이 포함되어야 합니다.');
      return;
    }

    setLocalError(null);
    
    // FormData 생성 (백엔드 요구 형식에 맞춤)
    const formData = new FormData();
    groups.forEach((group, index) => {
      formData.append(`group_${index}_filename`, group.filename);
      formData.append(`group_${index}_documentTitle`, group.documentTitle);
      formData.append(`group_${index}_imageSize`, group.imageSize);
      group.files.forEach(file => {
        formData.append(`group_${index}_files`, file);
      });
    });

    // 컨트롤러를 통해 변환 프로세스 시작
    await startConversion(formData);
  };

  if (groups.length === 0 && files.length === 0) return null;

  return (
    <div className="manager-container">
      {isProcessing && status && (
        <ProgressOverlay 
          theme={selectedTheme}
          day={status.day} 
          progress={status.progress} 
          message={status.message} 
        />
      )}
      
      <div className="manager-actions">
        <button 
          onClick={addGroup}
          className="btn-add-group"
          disabled={isProcessing}
        >
          <Plus size={18} /> 그룹 추가
        </button>
      </div>
      
      {groups.map((group, index) => (
        <div key={group.id} className="group-card">
          <div className="group-header">
            <h4>그룹 {index + 1}</h4>
            <span className="group-file-count">{group.files.length}개 파일 포함됨</span>
          </div>
          
          <div className="group-fields">
            <div>
              <label className="field-label">저장될 파일명</label>
              <input 
                type="text" 
                value={group.filename}
                onChange={(e) => handleGroupChange(group.id, 'filename', e.target.value)}
                onFocus={handleFocus}
                className="field-input"
                disabled={isProcessing}
                placeholder="예: AI수업_요약본"
              />
            </div>
            
            <div>
              <label className="field-label">문서 내부 &lt;제목&gt;</label>
              <input 
                type="text" 
                value={group.documentTitle}
                onChange={(e) => handleGroupChange(group.id, 'documentTitle', e.target.value)}
                onFocus={handleFocus}
                className="field-input"
                disabled={isProcessing}
                placeholder="문서 상단에 표시될 제목"
              />
            </div>

            <div>
              <label className="field-label">이미지 크기</label>
              <select 
                value={group.imageSize}
                onChange={(e) => handleGroupChange(group.id, 'imageSize', e.target.value)}
                className="field-select"
                disabled={isProcessing}
              >
                <option value="standard">표준 (110mm)</option>
                <option value="original">원본 최대 (160mm)</option>
              </select>
            </div>
          </div>
          
          <div className="file-list-container">
            <label className="file-list-label">파일 리스트</label>
            <ul className="file-list">
              {group.files.length === 0 ? (
                <li className="file-list-empty">파일을 이곳으로 드래그하거나 선택하세요.</li>
              ) : (
                group.files.map((file, i) => (
                  <li key={i} className="file-item">
                    <span>{file.name}</span>
                    <span className="file-size">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ))}

      {(localError || conversionError) && (
        <div className="error-message">
          {localError || conversionError}
        </div>
      )}

      <div className="sticky-actions">
        <button 
          onClick={onClearFiles}
          disabled={isProcessing}
          className="btn-clear"
        >
          <Trash2 size={18} /> 전체 초기화
        </button>
        <button 
          onClick={handleConvert}
          disabled={isProcessing || groups.length === 0}
          className="btn-convert"
        >
          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} 
          {isProcessing ? '문서 변환 중...' : '변환 및 다운로드 시작'}
        </button>
      </div>
    </div>
  );
}

export default FileGroupManager;
