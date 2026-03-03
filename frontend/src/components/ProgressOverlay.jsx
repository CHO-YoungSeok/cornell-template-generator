import React, { useEffect, useState, useRef } from 'react';
import './ProgressOverlay.css';

export const THEMES = {
// ... existing themes ...
  genesis: {
    name: "세계 창조",
    steps: {
      1: "첫째 날: 빛이 있으라 하시니 빛이 있었고",
      2: "둘째 날: 물 가운데에 궁창이 있어",
      3: "셋째 날: 뭍이 드러나라 하시니 땅이 생기고",
      4: "넷째 날: 하늘의 궁창에 광명체들이 있어",
      5: "다섯째 날: 생물들이 번성하라 하시고",
      6: "여섯째 날: 우리의 형상을 따라 사람을 만들고",
      7: "일곱째 날: 모든 일을 마치시고 안식하시니라"
    }
  },
  genius: {
    name: "천재 탄생",
    steps: {
      1: "공부가 하고 싶어 몸이 근질근질해지는 중...",
      2: "창의적으로 막 곱셈이 배워지는 중!",
      3: "지식이 뇌세포 구석구석 스며드는 중...",
      4: "논리력이 광채를 발하며 정렬되는 중!",
      5: "지혜가 샘솟아 전교 1등이 되어가는 중...",
      6: "완벽한 지성체로 거듭나는 중!",
      7: "지혜의 정점에 도달하여 하산할 준비 완료!"
    }
  }
};

/**
 * 내용: 선택된 테마에 맞춰 변환 진행 상태를 보여주는 오버레이 컴포넌트입니다.
 * param: theme - 선택된 테마 ('genesis' | 'genius')
 * param: day - 현재 진행 중인 단계 (1-7)
 * param: progress - 전체 진행률 (0-100)
 * param: message - 현재 단계의 상세 메시지
 * return: JSX 요소
 */
const ProgressOverlay = ({ theme = 'genesis', day, progress, message }) => {
  const [isVisible, setIsVisible] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
    return () => {
      setIsVisible(false);
    };
  }, []);

  // 거북이 드로잉 애니메이션 로직
  useEffect(() => {
    // 테마가 'genius'가 아니거나 캔버스가 없으면 애니메이션 실행 안 함
    if (theme !== 'genius' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let time = 0;

    /**
     * 내용: 캔버스에 공부하는 거북이 캐릭터를 그립니다.
     * param: 없음:
     * return: 없음:
     */
    const drawTurtle = () => {
      // 캔버스 초기화
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // 애니메이션 효과를 위한 값 (연필 움직임, 땀 등)
      const armSwing = Math.sin(time * 0.1) * 10;
      const sweatDropY = (time * 2) % 30;

      // 진행률에 따른 상태 변화 (진행률이 높을수록 책 더미가 줄어듦)
      const remainingBooks = Math.max(0, 5 - Math.floor(progress / 20));

      ctx.save();
      ctx.translate(centerX, centerY);

      // --- 책상 ---
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(-150, 80, 300, 20);
      ctx.fillStyle = '#654321';
      ctx.fillRect(-140, 100, 20, 80);
      ctx.fillRect(120, 100, 20, 80);

      // --- 쌓인 책 (진행률에 따라 감소) ---
      for (let i = 0; i < remainingBooks; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#4682B4' : '#B22222';
        ctx.fillRect(80, 60 - (i * 15), 50, 15);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(80, 60 - (i * 15) + 2, 45, 11);
      }

      // --- 거북이 몸통 (등껍질) ---
      ctx.beginPath();
      ctx.arc(-20, 30, 60, Math.PI, 0); // 반원
      ctx.fillStyle = '#228B22'; // 짙은 녹색
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#006400';
      ctx.stroke();

      // 등껍질 무늬 (육각형 패턴 등 간략화)
      ctx.beginPath();
      ctx.moveTo(-50, 30); ctx.lineTo(-20, 0); ctx.lineTo(10, 30);
      ctx.stroke();

      // --- 거북이 머리 ---
      ctx.beginPath();
      ctx.arc(30, 10, 25, 0, Math.PI * 2);
      ctx.fillStyle = '#32CD32'; // 밝은 녹색
      ctx.fill();
      ctx.stroke();

      // 안경
      ctx.beginPath();
      ctx.arc(35, 5, 10, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#111';
      ctx.stroke();
      // 안경테 연결
      ctx.beginPath();
      ctx.moveTo(15, 5); ctx.lineTo(25, 5);
      ctx.stroke();

      // 눈알 (집중!)
      ctx.beginPath();
      ctx.arc(38, 5, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();

      // 입 (살짝 미소)
      ctx.beginPath();
      ctx.arc(45, 18, 5, 0, Math.PI);
      ctx.stroke();

      // 땀 (열공 표현)
      if (progress > 30 && progress < 90) {
        ctx.beginPath();
        ctx.arc(10, -15 + sweatDropY, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(173, 216, 230, 0.8)'; // 물방울 색
        ctx.fill();
      }

      // --- 팔과 연필 (애니메이션) ---
      ctx.save();
      ctx.translate(40, 50); // 어깨 위치
      ctx.rotate((armSwing * Math.PI) / 180); // 팔 회전

      // 팔
      ctx.beginPath();
      ctx.rect(-10, 0, 20, 30);
      ctx.fillStyle = '#32CD32';
      ctx.fill();
      ctx.stroke();

      // 연필
      ctx.save();
      ctx.translate(0, 30);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = '#FFD700'; // 노란 연필
      ctx.fillRect(0, -5, 40, 10);
      ctx.fillStyle = '#FFA07A'; // 지우개
      ctx.fillRect(-10, -5, 10, 10);
      ctx.fillStyle = '#000'; // 연필심
      ctx.beginPath();
      ctx.moveTo(40, -5); ctx.lineTo(50, 0); ctx.lineTo(40, 5);
      ctx.fill();
      ctx.restore();

      ctx.restore();

      // --- 펴져 있는 책 ---
      ctx.fillStyle = '#FFF';
      ctx.fillRect(-40, 75, 80, 15);
      ctx.strokeStyle = '#CCC';
      ctx.beginPath();
      ctx.moveTo(0, 75); ctx.lineTo(0, 90);
      ctx.stroke();

      ctx.restore();

      time++;
      animationFrameId = requestAnimationFrame(drawTurtle);
    };

    drawTurtle();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [theme, progress]);

  const currentTheme = THEMES[theme] || THEMES.genesis;
  const mainText = currentTheme.steps[day] || "작업 진행 중...";
  const badgeText = theme === 'genesis' ? `Day ${day}` : `Level ${day}`;

  return (
    <div className={`progress-overlay ${theme}-theme ${isVisible ? 'fade-in' : ''}`}>
      {theme === 'genius' && (
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={300} 
          className="genius-canvas"
        />
      )}
      <div className="progress-content">
        <div className="progress-badge">{badgeText}</div>
        <h2 className="progress-main-text" key={mainText}>{mainText}</h2>
        <p className="progress-sub-text">{message}</p>

        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          <span className="progress-percentage-text">{progress}%</span>
        </div>

        <div className="progress-loading-dots">
          <span>.</span><span>.</span><span>.</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressOverlay;

