import React, { useEffect, useRef } from 'react';
import { BookOpen, BrainCircuit, Zap, ArrowRight, FileType, Image as ImageIcon, LayoutTemplate, Target } from 'lucide-react';
import './LandingInfo.css';

/**
 * 내용: 코넬 노트의 4분할 구조를 애니메이션으로 보여주는 캔버스 컴포넌트입니다.
 * param: theme - 현재 선택된 앱 테마
 * return: JSX 요소
 */
const CornellCanvas = ({ theme }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const isDark = theme === 'genesis';
      const bgColor = isDark ? '#2a2a35' : '#ffffff';
      const strokeColor = isDark ? '#555555' : '#cccccc';
      const highlightColor = isDark ? 'rgba(255, 215, 0, 0.15)' : 'rgba(25, 118, 210, 0.1)';
      const accentColor = isDark ? '#ffd700' : '#1976d2';

      // Draw Paper Background
      ctx.fillStyle = bgColor;
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 5;
      ctx.fillRect(20, 20, 360, 460);
      ctx.shadowColor = 'transparent';

      // Draw Layout Lines
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      
      // Top Title line
      ctx.beginPath(); ctx.moveTo(20, 80); ctx.lineTo(380, 80); ctx.stroke();
      
      // Left Cue column line
      ctx.beginPath(); ctx.moveTo(120, 80); ctx.lineTo(120, 400); ctx.stroke();
      
      // Bottom Summary line
      ctx.beginPath(); ctx.moveTo(20, 400); ctx.lineTo(380, 400); ctx.stroke();

      // Cycle through 4 sections for highlighting
      const cycle = Math.floor(time / 150) % 4;

      ctx.fillStyle = highlightColor;
      if (cycle === 0) {
        ctx.fillRect(22, 22, 356, 56);
      } else if (cycle === 1) {
        ctx.fillRect(22, 82, 96, 316);
      } else if (cycle === 2) {
        ctx.fillRect(122, 82, 256, 316);
      } else if (cycle === 3) {
        ctx.fillRect(22, 402, 356, 76);
      }

      // Draw Section Texts
      ctx.fillStyle = accentColor;
      ctx.font = 'bold 16px sans-serif';
      
      if (cycle === 0) ctx.fillText("1. 제목 (Context 파악)", 35, 50);
      if (cycle === 1) {
        ctx.fillText("2. 단서", 40, 110);
        ctx.font = '12px sans-serif';
        ctx.fillText("(능동적 회상)", 30, 130);
      }
      if (cycle === 2) {
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText("3. 세부내용 (메타인지 점검)", 140, 110);
      }
      if (cycle === 3) {
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText("4. 요약 (마무리 & 강조)", 35, 430);
      }

      // Draw Dummy Content Lines
      ctx.strokeStyle = isDark ? '#444' : '#e0e0e0';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      // Title dummy
      ctx.beginPath(); ctx.moveTo(35, 65); ctx.lineTo(200, 65); ctx.stroke();
      
      // Cue dummy (정렬된 키워드/질문 형태)
      for (let y = 160; y <= 360; y += 40) {
        ctx.beginPath();
        ctx.moveTo(35, y);
        ctx.lineTo(100, y);
        ctx.stroke();
      }
      
      // Notes dummy (루프를 이용한 깔끔한 줄글 표현)
      for (let y = 140; y <= 380; y += 20) {
        // 일부러 약간씩 길이를 다르게 하여 자연스러운 텍스트 느낌 연출
        const lineEnd = y % 60 === 0 ? 320 : 360; 
        ctx.beginPath();
        ctx.moveTo(140, y);
        ctx.lineTo(lineEnd, y);
        ctx.stroke();
      }

      // Summary dummy (두 줄로 깔끔하게 요약)
      ctx.beginPath(); ctx.moveTo(35, 450); ctx.lineTo(350, 450); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(35, 470); ctx.lineTo(280, 470); ctx.stroke();

      time++;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return <canvas ref={canvasRef} width={400} height={500} className="cornell-canvas" />;
};

/**
 * 내용: 코넬 노트 자동 변환기의 장점과 작동 원리를 설명하는 랜딩 페이지 정보 컴포넌트입니다.
 * param: theme - 현재 선택된 앱 테마 ('genesis' | 'genius')
 * return: JSX 요소
 */
const LandingInfo = ({ theme }) => {
  return (
    <div className={`landing-info-container ${theme}-theme`}>
      
      {/* 0. 코넬 노트 구조 설명 (Canvas 애니메이션) */}
      <section className="info-section layout-section">
        <div className="section-header">
          <h2 className="section-title">코넬 노트의 과학적인 4분할 구조</h2>
          <p className="section-subtitle">배운 내용을 완벽하게 나의 것으로 만드는 체계적인 시스템</p>
        </div>

        <div className="split-layout">
          <div className="canvas-wrapper">
            <CornellCanvas theme={theme} />
          </div>
          <div className="structure-desc">
            <div className="desc-item">
              <div className="desc-number">1</div>
              <div className="desc-text">
                <h3>제목 (Title)</h3>
                <p>오늘 배울 내용의 <strong>Context(맥락)를 가장 먼저 파악</strong>합니다. 숲을 먼저 보고 나무를 보는 학습의 시작입니다.</p>
              </div>
            </div>
            <div className="desc-item">
              <div className="desc-number">2</div>
              <div className="desc-text">
                <h3>단서 (Cue)</h3>
                <p>좌측 단서만 보고 우측의 내용을 떠올리는 <strong>능동적 회상(Active Recall)</strong>을 훈련합니다. 핵심 키워드나 질문을 적어두세요.</p>
              </div>
            </div>
            <div className="desc-item">
              <div className="desc-number">3</div>
              <div className="desc-text">
                <h3>세부 내용 (Notes)</h3>
                <p>강의나 자료의 디테일을 기록합니다. 좌측의 단서를 바탕으로 회상한 후, <strong>내가 정확하게 이해했는지 점검(메타인지)</strong>하는 기준이 됩니다.</p>
              </div>
            </div>
            <div className="desc-item">
              <div className="desc-number">4</div>
              <div className="desc-text">
                <h3>요약 (Summary)</h3>
                <p>페이지 하단에 학습 내용을 한두 줄로 압축합니다. <strong>헷갈리거나 강조하고 싶은 부분, 다시 한번 보고 싶은 부분</strong>을 확실하게 정리하여 마무리합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 1. 코넬 노트의 장점 섹션 */}
      <section className="info-section alternate">
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
              <Target className="info-icon" size={32} />
            </div>
            <h3 className="card-title">메타인지 점검</h3>
            <p className="card-desc">
              단서를 통해 내용을 추론하고 본문과 대조하는 과정을 반복하며 내가 아는 것과 모르는 것을 명확하게 구분할 수 있습니다.
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
      <section className="info-section">
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
