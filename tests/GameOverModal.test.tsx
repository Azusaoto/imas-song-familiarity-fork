import { expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import GameOverModal from '../components/guess/GameOverModal';

test('GameOverModal renders score and handles restart click', () => {
  const onRestart = vi.fn();
  const score = 10;
  
  render(<GameOverModal score={score} onRestart={onRestart} />);
  
  // Check if "遊戲結束！" is rendered
  expect(screen.getByText('遊戲結束！')).toBeDefined();
  
  // Check if score is rendered
  expect(screen.getByText('10')).toBeDefined();
  expect(screen.getByText('本次連勝紀錄')).toBeDefined();
  
  // Check if restart button is rendered and clickable
  const restartButton = screen.getByText('再玩一次');
  expect(restartButton).toBeDefined();
  
  fireEvent.click(restartButton);
  expect(onRestart).toHaveBeenCalledTimes(1);
});

test('GameOverModal handles Escape key', () => {
  const onRestart = vi.fn();
  render(<GameOverModal score={5} onRestart={onRestart} />);
  
  // Simulate Escape key press
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onRestart).toHaveBeenCalledTimes(1);
});

test('GameOverModal locks and unlocks body scroll', () => {
  const originalOverflow = document.body.style.overflow;
  const { unmount } = render(<GameOverModal score={5} onRestart={() => {}} />);
  
  // Verify scroll lock
  expect(document.body.style.overflow).toBe('hidden');
  
  // Unmount and verify restore
  unmount();
  expect(document.body.style.overflow).toBe(originalOverflow);
});
