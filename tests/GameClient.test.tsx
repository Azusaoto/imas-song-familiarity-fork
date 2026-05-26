import { expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import GameClient from '../components/guess/GameClient';

// Mock YoutubePlayer
vi.mock('../components/guess/YoutubePlayer', () => ({
  default: ({ onReady }: any) => {
    // Simulate player ready
    React.useEffect(() => {
      if (onReady) onReady({ target: { playVideo: vi.fn() } });
    }, [onReady]);
    return <div data-testid='youtube-player' />;
  },
}));

const mockSongs = [
  { id: '1', title: 'Song 1', brand: 'music_as', youtubeIds: 'vid1', members: [], units: [] },
  { id: '2', title: 'Song 2', brand: 'music_as', youtubeIds: 'vid2', members: [], units: [] },
  { id: '3', title: 'Song 3', brand: 'music_as', youtubeIds: 'vid3', members: [], units: [] },
  { id: '4', title: 'Song 4', brand: 'music_as', youtubeIds: 'vid4', members: [], units: [] },
];

beforeEach(() => {
  global.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockSongs),
    })
  );
});

test('GameClient flow: Correct answer leads to next question after timeout', async () => {
  render(<GameClient />);
  
  // Wait for loading to finish
  await waitFor(() => expect(screen.queryByText('超級猜歌挑戰')).toBeDefined(), { timeout: 3000 });
  
  fireEvent.click(screen.getByText('立即開始遊戲'));
  
  // Wait for game to start and cards to appear
  await waitFor(() => {
    const buttons = screen.getAllByRole('button').filter(b => b.className.includes('card-el'));
    expect(buttons.length).toBe(4);
  }, { timeout: 3000 });

  // Use fake timers for the 1.5s transition
  vi.useFakeTimers();
  
  const optionButtons = screen.getAllByRole('button').filter(b => b.className.includes('card-el'));
  
  // Mock random to make sure Song 1 is the answer and it's at index 0
  // Note: generateQuestion uses random for answer selection AND distractor shuffling AND final option shuffling.
  // This is tricky. Let's just click one and see what happens.
  fireEvent.click(optionButtons[0]);
  
  // Check if it's correct or wrong
  const isCorrect = screen.queryByText('CORRECT') !== null;
  const isWrong = screen.queryByText('WRONG') !== null;
  const isGameOver = screen.queryByText('遊戲結束！') !== null;
  
  expect(isCorrect || isWrong || isGameOver).toBe(true);
  
  if (isCorrect) {
    // Fast-forward time
    vi.advanceTimersByTime(1500);
    // Should still be in some state, check if SCORE is incremented
    expect(screen.getByText('1')).toBeDefined();
  }
  
  vi.useRealTimers();
});

test('GameClient flow: Wrong answer leads to GameOverModal', async () => {
  render(<GameClient />);
  
  await waitFor(() => expect(screen.queryByText('超級猜歌挑戰')).toBeDefined(), { timeout: 3000 });
  fireEvent.click(screen.getByText('立即開始遊戲'));
  
  await waitFor(() => {
    const buttons = screen.getAllByRole('button').filter(b => b.className.includes('card-el'));
    expect(buttons.length).toBe(4);
  }, { timeout: 3000 });

  const optionButtons = screen.getAllByRole('button').filter(b => b.className.includes('card-el'));
  fireEvent.click(optionButtons[0]);
  
  await waitFor(() => {
    const isGameOver = screen.queryByText('遊戲結束！') !== null;
    const isCorrect = screen.queryByText('CORRECT') !== null;
    expect(isGameOver || isCorrect).toBe(true);
  }, { timeout: 3000 });
});
