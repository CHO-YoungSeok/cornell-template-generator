import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import FileGroupManager from './components/FileGroupManager';
import LandingInfo from './components/LandingInfo';
import './App.css';

/**
 * 내용: 메인 애플리케이션 컴포넌트. 파일 업로드와 그룹 관리 UI를 조합합니다.
 * param: 없음
 * return: JSX 요소
 */
function App() {
  const [files, setFiles] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState('genesis');

  /**
   * 내용: 새로 추가된 파일들을 기존 목록에 병합합니다.
   * param: newFiles - 추가된 File 객체 배열
   * return: 없음
   */
  const handleFilesAdded = (newFiles) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  /**
   * 내용: 모든 파일 상태를 초기화합니다.
   * param: 없음
   * return: 없음
   */
  const handleClearFiles = () => {
    setFiles([]);
  };

  return (
    <div className={`app-container ${selectedTheme}-theme`}>
      {/* 화면 전체 좌측 상단 고정 테마 선택 바 */}
      <div className="theme-selector-container">
        <select 
          value={selectedTheme} 
          onChange={(e) => setSelectedTheme(e.target.value)}
          className="theme-select"
        >
          <option value="genesis">🌌 테마: 세계 창조 (창세기)</option>
          <option value="genius">💡 테마: 천재 탄생 (열공)</option>
        </select>
      </div>

      <div className="app-content">
        <header className="app-header">
          <h1>PDF/PPTX to DOCX 자동 변환</h1>
          <p>강의 자료를 요약 필기 양식으로 빠르게 변환하세요.</p>
        </header>

        <main>
          {files.length === 0 ? (
            <FileUploader onFilesAdded={handleFilesAdded} />
          ) : (
            <FileGroupManager files={files} onClearFiles={handleClearFiles} selectedTheme={selectedTheme} />
          )}
        </main>
      </div>

      {/* 랜딩 정보 섹션 (전체 폭 활용) */}
      <LandingInfo theme={selectedTheme} />
    </div>
  );
}

export default App;