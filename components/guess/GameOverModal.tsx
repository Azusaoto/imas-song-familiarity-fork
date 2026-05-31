import React, { useEffect } from 'react';
import { Song } from '@/types/game';
import { getBrandColor } from '@/lib/themeUtils';

type GameOverModalProps = {
  score: number;
  correctAnswer?: Song | null;
  /** 池子答完觸發的「imas 猜歌大師」結尾,跟一般答錯結束的 UI 不同 */
  isMaster?: boolean;
  onRestart: () => void;
};

export default function GameOverModal({ score, correctAnswer, isMaster = false, onRestart }: GameOverModalProps) {
  // Handle Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onRestart();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onRestart]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div 
      className="modal-overlay" 
      style={{ zIndex: 3000 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
    >
      <div className="modal-content" style={{ textAlign: 'center', maxWidth: '400px' }}>
        <h2
          id="game-over-title"
          style={{
            color: isMaster ? '#9333ea' : 'var(--text-primary)',
            marginBottom: '16px',
          }}
        >
          {isMaster ? '🎉 imas 猜歌大師！' : '遊戲結束！'}
        </h2>
        {isMaster && (
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              marginBottom: '24px',
              lineHeight: 1.6,
            }}
          >
            恭喜您已經答完所有歌，<br />
            你是 imas 猜歌大師！
          </p>
        )}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>本次連勝紀錄</p>
          <div style={{ fontSize: '64px', fontWeight: '800', color: 'var(--accent-color)', lineHeight: 1 }}>
            {score}
          </div>
        </div>

        {!isMaster && correctAnswer && (
          <div style={{
            marginBottom: '32px',
            textAlign: 'center',
            backgroundColor: 'rgba(0,0,0,0.02)',
            padding: '16px',
            borderRadius: '16px',
            border: `2px solid ${getBrandColor(correctAnswer.brand)}`,
            boxShadow: `0 4px 12px ${getBrandColor(correctAnswer.brand)}22`
          }}>
            <p style={{ fontSize: '14px', color: '#dc2626', marginBottom: '8px', fontWeight: 'bold' }}>正確答案是</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{correctAnswer.title}</p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {correctAnswer.units && correctAnswer.units.length > 0
                ? correctAnswer.units.map(u => u.name).join('、')
                : (correctAnswer.members && correctAnswer.members.length > 0
                    ? correctAnswer.members.map(m => m.name).join('、')
                    : '群星 / 其他')}
            </p>
          </div>
        )}

        <div className="modal-actions" style={{ justifyContent: 'center' }}>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', fontSize: '16px', padding: '12px' }} 
            onClick={onRestart}
          >
            再玩一次
          </button>
        </div>
      </div>
    </div>
  );
}
