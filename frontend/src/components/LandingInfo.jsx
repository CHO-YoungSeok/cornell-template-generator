import React from 'react';
import { BookOpen, BrainCircuit, Zap, ArrowRight, FileType, Image as ImageIcon, LayoutTemplate } from 'lucide-react';
import './LandingInfo.css';

/**
 * 내용: 코넬 노트 자동 변환기의 장점과 작동 원리를 설명하는 랜딩 페이지 정보 컴포넌트입니다.
 * param: theme - 현재 선택된 앱 테마 ('genesis' | 'genius')
 * return: JSX 요소
 */
const LandingInfo = ({ theme }) => {
  return (
    <div className={`landing-info-container ${theme}-theme`}>
      
      {/* 1. 코넬 노트의 장점 섹션 */}
      <section className="info-section">
        <div className="section-header">
          <h2 className="section-title">왜 코넬 노트 템플릿인가요?</h2>
          <p className="section-subtitle">단순한 필기를 넘어, 능동적인 학습을 위한 최고의 시스템</p>
        </div>
        
        <div className="grid-container">
          <div className="info-card">
            <div className="icon-wrapper">
              <BrainCircuit className="info-icon" size={32} />
            </div>
            <h3 className="card-title">능동적 회상 (Active Recall)</h3>
            <p className="card-desc">
              단서를 적는 공간과 필기 공간이 분리되어 있어, 키워드만 보고 전체 내용을 떠올리는 훈련을 통해 기억력을 극대화합니다.
            </p>
          </div>
          
          <div className="info-card">
            <div className="icon-wrapper">
              <Zap className="info-icon" size={32} />
            </div>
            <h3 className="card-title">핵심 파악 (Keyword Focus)</h3>
            <p className="card-desc">
              강의의 흐름 속에서 무엇이 중요한지 스스로 묻고 단서를 추출하는 과정에서 구조적 사고력이 길러집니다.
            </p>
          </div>
          
          <div className="info-card">
            <div className="icon-wrapper">
              <BookOpen className="info-icon" size={32} />
            </div>
            <h3 className="card-title">요약의 힘 (Summary)</h3>
            <p className="card-desc">
              하단 요약 영역에 한 페이지의 내용을 자신의 언어로 압축함으로써, 지식을 장기 기억으로 확실하게 정착시킵니다.
            </p>
          </div>
        </div>
      </section>

      {/* 2. 자동 변환 작동 원리 섹션 */}
      <section className="info-section alternate">
        <div className="section-header">
          <h2 className="section-title">클릭 한 번으로 끝나는 마법</h2>
          <p className="section-subtitle">복잡한 자료 정리, 이제 AI 변환기에게 맡기세요</p>
        </div>
        
        <div className="process-flow">
          <div className="flow-step">
            <div className="step-circle">
              <FileType size={28} />
            </div>
            <h4 className="step-title">자료 업로드</h4>
            <p className="step-desc">PDF, PPTX 등 다양한 형식의 강의 자료를 드래그 앤 드롭</p>
          </div>
          
          <div className="flow-arrow-container">
            <ArrowRight className="flow-arrow" size={24} />
          </div>
          
          <div className="flow-step">
            <div className="step-circle">
              <ImageIcon size={28} />
            </div>
            <h4 className="step-title">고화질 렌더링</h4>
            <p className="step-desc">자료의 각 슬라이드/페이지를 선명한 이미지 에셋으로 추출</p>
          </div>
          
          <div className="flow-arrow-container">
            <ArrowRight className="flow-arrow" size={24} />
          </div>
          
          <div className="flow-step">
            <div className="step-circle">
              <LayoutTemplate size={28} />
            </div>
            <h4 className="step-title">템플릿 자동 매핑</h4>
            <p className="step-desc">코넬 노트 양식(DOCX)에 맞게 이미지를 자동 크기 조정 및 배치</p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingInfo;
