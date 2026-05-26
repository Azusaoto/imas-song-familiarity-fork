# GameClient Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `GameClient.tsx` into a modular, type-safe, and well-tested component by extracting logic into a custom hook and breaking down the UI.

**Architecture:** 
- `useGameLogic` hook: Encapsulates all state and business logic.
- `GameStatusHeader`: Displays score and hint buttons.
- `SongOptionCard`: Individual selectable song option.
- `GameClient`: Main orchestrator component.
- Fisher-Yates shuffle: Standardized for all randomization.

**Tech Stack:** React (Next.js), TypeScript, Vitest, Testing Library.

---

### Task 1: Fisher-Yates Shuffle Utility

**Files:**
- Create: `lib/shuffle.ts`

- [ ] **Step 1: Create the shuffle utility**
```typescript
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

- [ ] **Step 2: Commit**
```bash
git add lib/shuffle.ts
git commit -m "feat: add fisher-yates shuffle utility"
```

### Task 2: Extract useGameLogic Hook

**Files:**
- Create: `components/guess/useGameLogic.ts`

- [ ] **Step 1: Implement the hook with TDD (Mental/Plan)**
Implement state management for `gameState`, `allSongs`, `playableSongs`, `currentQuestion`, `selectedOptionId`, `score`, `error`, and hints.

- [ ] **Step 2: Write tests for hint logic and scoring**
(To be done in Task 6)

- [ ] **Step 3: Implement minimal hook**
```typescript
import { useState, useEffect, useCallback } from 'react';
import { Song, Question, GameState } from '@/types/game';
import { shuffle } from '@/lib/shuffle';

export function useGameLogic() {
  const [gameState, setGameState] = useState<GameState>('loading');
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [playableSongs, setPlayableSongs] = useState<Song[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const [eliminationCount, setEliminationCount] = useState(3);
  const [sameBrandCount, setSameBrandCount] = useState(3);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [sameBrandUsedOnCurrent, setSameBrandUsedOnCurrent] = useState(false);

  useEffect(() => {
    fetch('/api/songs')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch songs');
        return res.json();
      })
      .then((data: Song[]) => {
        setAllSongs(data);
        setPlayableSongs(data.filter((s) => s.youtubeIds));
        setGameState('idle');
      })
      .catch((err) => {
        console.error(err);
        setError('載入題庫失敗，請稍後再試。');
        setGameState('idle');
      });
  }, []);

  const generateQuestion = useCallback(() => {
    if (playableSongs.length === 0 || allSongs.length < 4) return;
    
    const answerIndex = Math.floor(Math.random() * playableSongs.length);
    const answer = playableSongs[answerIndex];

    const distractors = shuffle(allSongs.filter(s => s.id !== answer.id)).slice(0, 3);
    const options = shuffle([answer, ...distractors]);

    setCurrentQuestion({ answer, options });
    setSelectedOptionId(null);
    setEliminatedOptions([]);
    setSameBrandUsedOnCurrent(false);
    setGameState('playing');
  }, [playableSongs, allSongs]);

  const startGame = () => {
    setScore(0);
    setEliminationCount(3);
    setSameBrandCount(3);
    generateQuestion();
  };

  const handleOptionClick = (optionId: string) => {
    if (gameState !== 'playing' || eliminatedOptions.includes(optionId)) return;
    
    setSelectedOptionId(optionId);
    if (optionId === currentQuestion?.answer.id) {
      setGameState('answered');
      setScore(s => s + 1);
      setTimeout(() => generateQuestion(), 1500);
    } else {
      setGameState('gameover');
    }
  };

  const useElimination = () => {
    if (eliminationCount <= 0 || !currentQuestion || gameState !== 'playing') return;
    const wrongOptions = shuffle(currentQuestion.options.filter(
      o => o.id !== currentQuestion.answer.id && !eliminatedOptions.includes(o.id)
    ));
    const toEliminate = wrongOptions.slice(0, 2).map(o => o.id);
    setEliminatedOptions(prev => [...prev, ...toEliminate]);
    setEliminationCount(prev => prev - 1);
  };

  const useSameBrand = () => {
    if (sameBrandCount <= 0 || !currentQuestion || gameState !== 'playing' || sameBrandUsedOnCurrent) return;
    const { answer } = currentQuestion;
    const sameBrandSongs = shuffle(allSongs.filter(s => s.brand === answer.brand && s.id !== answer.id));
    const differentBrandSongs = shuffle(allSongs.filter(s => s.brand !== answer.brand && s.id !== answer.id));
    
    const newDistractors = sameBrandSongs.slice(0, 3);
    if (newDistractors.length < 3) {
      newDistractors.push(...differentBrandSongs.slice(0, 3 - newDistractors.length));
    }
    
    setCurrentQuestion({ answer, options: shuffle([answer, ...newDistractors]) });
    setSameBrandCount(c => c - 1);
    setSameBrandUsedOnCurrent(true);
    setEliminatedOptions([]);
  };

  return {
    gameState, score, error, currentQuestion, selectedOptionId,
    eliminationCount, sameBrandCount, eliminatedOptions, sameBrandUsedOnCurrent,
    startGame, handleOptionClick, handleNext: generateQuestion, useElimination, useSameBrand
  };
}
```

- [ ] **Step 4: Commit**
```bash
git add components/guess/useGameLogic.ts
git commit -m "feat: extract useGameLogic hook"
```

### Task 3: Create GameStatusHeader Component

**Files:**
- Create: `components/guess/GameStatusHeader.tsx`

- [ ] **Step 1: Implement GameStatusHeader**
```tsx
import React from 'react';

interface GameStatusHeaderProps {
  score: number;
  eliminationCount: number;
  sameBrandCount: number;
  gameState: string;
  eliminatedOptionsLength: number;
  sameBrandUsedOnCurrent: boolean;
  onUseElimination: () => void;
  onUseSameBrand: () => void;
}

export default function GameStatusHeader({
  score, eliminationCount, sameBrandCount, gameState,
  eliminatedOptionsLength, sameBrandUsedOnCurrent,
  onUseElimination, onUseSameBrand
}: GameStatusHeaderProps) {
  return (
    <div className="flex justify-between items-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-6">
        <div className="text-lg font-bold text-gray-700 dark:text-gray-200">
          SCORE: <span className="text-3xl font-black text-purple-600 dark:text-purple-400 ml-1">{score}</span>
        </div>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={onUseElimination}
          disabled={gameState !== 'playing' || eliminationCount <= 0 || eliminatedOptionsLength >= 2}
          className="btn btn-secondary relative"
        >
          <span className="relative z-10">50/50 刪去法</span>
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full z-20 shadow-sm border-2 border-orange-500">
            {eliminationCount}
          </span>
        </button>
        
        <button
          onClick={onUseSameBrand}
          disabled={gameState !== 'playing' || sameBrandCount <= 0 || sameBrandUsedOnCurrent}
          className="btn btn-secondary relative"
        >
          <span className="relative z-10">同品牌提示</span>
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full z-20 shadow-sm border-2 border-pink-500">
            {sameBrandCount}
          </span>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add components/guess/GameStatusHeader.tsx
git commit -m "feat: create GameStatusHeader component"
```

### Task 4: Create SongOptionCard Component

**Files:**
- Create: `components/guess/SongOptionCard.tsx`

- [ ] **Step 1: Implement SongOptionCard**
```tsx
import React from 'react';
import { Song } from '@/types/game';
import { getBrandDisplayName, getBrandColor } from '@/lib/themeUtils';

interface SongOptionCardProps {
  option: Song;
  isEliminated: boolean;
  isAnswered: boolean;
  isSelected: boolean;
  isCorrectAnswer: boolean;
  onClick: (id: string) => void;
}

export default function SongOptionCard({
  option, isEliminated, isAnswered, isSelected, isCorrectAnswer, onClick
}: SongOptionCardProps) {
  const getSingerText = (song: Song) => {
    if (song.units?.length > 0) return song.units.map(u => u.name).join('、');
    if (song.members?.length > 0) return song.members.map(m => m.name).join('、');
    return '群星 / 其他';
  };

  const brandColor = getBrandColor(option.brand);
  let cardClasses = "card-el relative flex flex-col p-6 text-left overflow-hidden transition-all duration-300 ease-out";
  
  if (isEliminated) {
    cardClasses += " opacity-30 cursor-not-allowed scale-95 bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-800";
  } else if (isAnswered) {
    if (isCorrectAnswer) {
      cardClasses += " border-green-500 bg-green-50 dark:bg-green-900/20 shadow-[0_0_20px_rgba(34,197,94,0.2)] z-10 scale-[1.02]";
    } else if (isSelected) {
      cardClasses += " border-red-500 bg-red-50 dark:bg-red-900/20 shadow-[0_0_20px_rgba(239,68,68,0.2)] opacity-80";
    } else {
      cardClasses += " opacity-50 scale-95 border-gray-200 dark:border-gray-800";
    }
  } else {
    cardClasses += " cursor-pointer hover:scale-[1.02] hover:border-accent-color hover:shadow-lg";
  }

  return (
    <button
      onClick={() => onClick(option.id)}
      disabled={isAnswered || isEliminated}
      className={cardClasses}
      style={!isEliminated ? { '--border-color-hover': brandColor } as React.CSSProperties : {}}
    >
      {!isEliminated && (
        <div className="absolute top-0 left-0 w-1.5 h-full opacity-70" style={{ backgroundColor: brandColor }} />
      )}
      
      <div className="flex items-center justify-between w-full mb-3 pl-2">
        <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
          {isEliminated ? 'ELIMINATED' : getBrandDisplayName(option.brand)}
        </span>
        {isAnswered && isCorrectAnswer && (
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-bold animate-pulse">
            CORRECT
          </span>
        )}
        {isAnswered && isSelected && !isCorrectAnswer && (
          <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-bold">
            WRONG
          </span>
        )}
      </div>
      
      <div className="pl-2">
        <h3 className={`text-lg font-bold mb-1 leading-tight ${isEliminated ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
          {isEliminated ? '---' : option.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center">
          <span className="opacity-60 mr-1.5">BY</span>
          {isEliminated ? '---' : getSingerText(option)}
        </p>
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add components/guess/SongOptionCard.tsx
git commit -m "feat: create SongOptionCard component"
```

### Task 5: Refactor GameClient Component

**Files:**
- Modify: `components/guess/GameClient.tsx`

- [ ] **Step 1: Refactor GameClient to use hook and sub-components**
```tsx
'use client';

import React, { useState } from 'react';
import YoutubePlayer from './YoutubePlayer';
import GameOverModal from './GameOverModal';
import GameStatusHeader from './GameStatusHeader';
import SongOptionCard from './SongOptionCard';
import { useGameLogic } from './useGameLogic';
import { buildThemeVars } from '@/lib/themeUtils';

export default function GameClient() {
  const {
    gameState, score, error, currentQuestion, selectedOptionId,
    eliminationCount, sameBrandCount, eliminatedOptions, sameBrandUsedOnCurrent,
    startGame, handleOptionClick, handleNext, useElimination, useSameBrand
  } = useGameLogic();

  const [isPlaying, setIsPlaying] = useState(false);

  if (gameState === 'loading') return <div className="loading-spinner" />;
  if (error) return <div className="error-message">{error}</div>;
  if (gameState === 'idle') return <div className="start-screen" onClick={startGame}>Start Game</div>;
  if (!currentQuestion) return null;

  const videoId = currentQuestion.answer.youtubeIds?.split(',')[0].trim() || '';
  const isAnswered = gameState === 'answered';

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 flex flex-col space-y-6" style={buildThemeVars('#92cfbb')}>
      <GameStatusHeader
        score={score}
        eliminationCount={eliminationCount}
        sameBrandCount={sameBrandCount}
        gameState={gameState}
        eliminatedOptionsLength={eliminatedOptions.length}
        sameBrandUsedOnCurrent={sameBrandUsedOnCurrent}
        onUseElimination={useElimination}
        onUseSameBrand={useSameBrand}
      />

      <YoutubePlayer 
        videoId={videoId} 
        showVideo={isAnswered} 
        onReady={(e) => { e.target.playVideo(); setIsPlaying(true); }}
        onError={handleNext}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {currentQuestion.options.map((option) => (
          <SongOptionCard
            key={option.id}
            option={option}
            isEliminated={eliminatedOptions.includes(option.id)}
            isAnswered={isAnswered}
            isSelected={option.id === selectedOptionId}
            isCorrectAnswer={option.id === currentQuestion.answer.id}
            onClick={handleOptionClick}
          />
        ))}
      </div>

      {isAnswered && <button onClick={handleNext}>Next</button>}
      {gameState === 'gameover' && <GameOverModal score={score} onRestart={startGame} />}
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add components/guess/GameClient.tsx
git commit -m "refactor: use hook and sub-components in GameClient"
```

### Task 6: Update Tests

**Files:**
- Modify: `tests/GameClient.test.tsx`

- [ ] **Step 1: Mock Math.random() and add hint tests**
```typescript
vi.spyOn(Math, 'random').mockReturnValue(0); // Stable randomness for testing
```

- [ ] **Step 2: Run and verify all tests pass**
```bash
npm test tests/GameClient.test.tsx
```

- [ ] **Step 3: Commit**
```bash
git add tests/GameClient.test.tsx
git commit -m "test: update GameClient tests with deterministic randomness and hint tests"
```

---
Plan complete and saved to `docs/superpowers/plans/2026-05-26-refactor-game-client-v3.md`.
Approach: Inline Execution.
