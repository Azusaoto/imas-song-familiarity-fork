import React, { useEffect } from 'react';

type GameOverModalProps = {
  score: number;
  onRestart: () => void;
};

export default function GameOverModal({ score, onRestart }: GameOverModalProps) {
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
        <h2 id="game-over-title" style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>遊戲結束！</h2>
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>本次連勝紀錄</p>
          <div style={{ fontSize: '64px', fontWeight: '800', color: 'var(--accent-color)', lineHeight: 1 }}>
            {score}
          </div>
        </div>
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
