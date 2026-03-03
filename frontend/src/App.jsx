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
  const [selectedTheme, setSelectedTheme] = useState('genius');

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

  // 테마에 따른 배경 스타일
  const backgroundStyles = {
    genesis: 'radial-gradient(circle at 50% -20%, #4a5c73 0%, #1a1a24 50%, #0d0d12 100%)', // 우주의 빛, 창조의 느낌을 주는 어둡고 신비로운 배경
    genius: 'linear-gradient(135deg, #f4f7f6 0%, #e5ebee 100%)' // 눈부시지 않고 차분하며 밝은 그라데이션 (종이/노트 느낌)
  };

  const textColor = selectedTheme === 'genesis' ? '#ffffff' : '#2c3e50';
  const subTextColor = selectedTheme === 'genesis' ? '#bbbbbb' : '#546e7a';

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: backgroundStyles[selectedTheme], 
      transition: 'background 0.8s ease',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* 화면 전체 좌측 상단 고정 테마 선택 바 */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 100 }}>
        <select 
          value={selectedTheme} 
          onChange={(e) => setSelectedTheme(e.target.value)}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '8px', 
            border: '1px solid rgba(255,255,255,0.2)', 
            outline: 'none', 
            backgroundColor: selectedTheme === 'genesis' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.9)', 
            fontSize: '14px', 
            fontWeight: '600', 
            color: selectedTheme === 'genesis' ? '#fff' : '#333', 
            cursor: 'pointer', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.5s ease'
          }}
        >
          <option value="genesis">🌌 테마: 세계 창조 (창세기)</option>
          <option value="genius">💡 테마: 천재 탄생 (열공)</option>
        </select>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px 40px', fontFamily: 'sans-serif' }}>
        <header style={{ textAlign: 'center', marginBottom: '40px', transition: 'color 0.5s ease' }}>
          <h1 style={{ color: textColor, marginBottom: '8px', textShadow: selectedTheme === 'genesis' ? '0 0 20px rgba(255,255,255,0.3)' : '0 2px 4px rgba(0,0,0,0.1)' }}>PDF/PPTX to DOCX 자동 변환</h1>
          <p style={{ color: subTextColor, margin: 0 }}>강의 자료를 요약 필기 양식으로 빠르게 변환하세요.</p>
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