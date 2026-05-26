# Song Guessing Game Cleanup and High Score Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Tailwind dependencies, implement high score persistence, fix logic race conditions, and clean up hardcoded values to ensure a polished and reliable game experience.

**Architecture:** 
- CSS-in-JS/Standard CSS: Convert Tailwind classes to inline styles and existing project CSS variables.
- Persistence: Use `localStorage` for high score tracking.
- Robust React State: Use `useRef` for transition timer management to prevent race conditions.
- Semantic Styling: Replace hardcoded colors with project-wide CSS variables.

**Tech Stack:** React (TypeScript), Next.js, localStorage API.

---

### Task 1: Tailwind Removal (Page & YoutubePlayer)

**Files:**
- Modify: `app/guess/page.tsx`
- Modify: `components/guess/YoutubePlayer.tsx`

- [ ] **Step 1: Clean up `app/guess/page.tsx`**

Replace Tailwind classes with standard CSS and project classes.

```tsx
// app/guess/page.tsx
export default function GuessPage() {
  return (
    <main style={{ minHeight: '100vh', transition: 'background-color 0.25s ease' }}>
      <div className="container" style={{ maxWidth: '896px', paddingTop: '2rem', paddingBottom: '5rem' }}>
        <GameClient />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Clean up `components/guess/YoutubePlayer.tsx`**

Convert Tailwind classes to standard CSS. Ensure the mask correctly covers the video.

```tsx
// components/guess/YoutubePlayer.tsx
// ... imports
export default function YoutubePlayer({ videoId, showVideo, onReady, onEnd, onError }: YoutubePlayerProps) {
  // ... opts
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', backgroundColor: 'black' }}>
      {!showVideo && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'linear-gradient(135deg, rgba(49, 46, 129, 0.9), rgba(88, 28, 135, 0.9))', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}>
          <div style={{ color: 'white', fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '0.1em', textAlign: 'center' }}>
            {/* SVG Icon */}
            <svg style={{ width: '64px', height: '64px', marginBottom: '16px', color: '#d8b4fe', opacity: 0.8 }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
            <span style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>請仔細聽...</span>
          </div>
        </div>
      )}
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={onReady}
        onEnd={onEnd}
        onError={onError}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: !showVideo ? 'none' : 'auto' }}
        iframeClassName="w-full h-full"
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/guess/page.tsx components/guess/YoutubePlayer.tsx
git commit -m "style: remove tailwind from guess page and youtube player"
```

### Task 2: Best Record (High Score) Persistence

**Files:**
- Modify: `components/guess/useGameLogic.ts`
- Modify: `components/guess/GameClient.tsx`
- Modify: `components/guess/GameStatusHeader.tsx`

- [ ] **Step 1: Add High Score logic to `useGameLogic.ts`**

```typescript
// components/guess/useGameLogic.ts
// ... imports
export function useGameLogic() {
  // ... existing states
  const [bestRecord, setBestRecord] = useState(0);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('imas-guess-highscore');
    if (saved) setBestRecord(parseInt(saved, 10));
  }, []);

  // Update in handleOptionClick
  const handleOptionClick = (optionId: string) => {
    // ... logic
    if (isCorrect) {
      const newScore = score + 1;
      setScore(newScore);
      if (newScore > bestRecord) {
        setBestRecord(newScore);
        localStorage.setItem('imas-guess-highscore', newScore.toString());
      }
      // ... transition
    }
  };

  return {
    // ...
    bestRecord,
    // ...
  };
}
```

- [ ] **Step 2: Update `GameClient.tsx` to pass `bestRecord`**

```tsx
// components/guess/GameClient.tsx
// ...
  const {
    gameState,
    score,
    bestRecord, // Add this
    // ...
  } = useGameLogic();

// ...
      <GameStatusHeader
        score={score}
        bestRecord={bestRecord} // Add this
        eliminationCount={eliminationCount}
// ...
```

- [ ] **Step 3: Update `GameStatusHeader.tsx` to display High Score**

```tsx
// components/guess/GameStatusHeader.tsx
interface GameStatusHeaderProps {
  score: number;
  bestRecord: number; // Add this
  // ...
}

export default function GameStatusHeader({
  score,
  bestRecord, // Add this
  // ...
}) {
  return (
    <div style={{ /* existing styles */ }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
          SCORE: <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-color)', marginLeft: '4px' }}>{score}</span>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)' }}>
          BEST: <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-secondary)', marginLeft: '4px' }}>{bestRecord}</span>
        </div>
      </div>
      {/* ... buttons */}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/guess/useGameLogic.ts components/guess/GameClient.tsx components/guess/GameStatusHeader.tsx
git commit -m "feat: implement best record persistence"
```

### Task 3: Race Condition Fix (Transition Timer)

**Files:**
- Modify: `components/guess/useGameLogic.ts`

- [ ] **Step 1: Use `useRef` for transition timer**

```typescript
// components/guess/useGameLogic.ts
import { useState, useEffect, useCallback, useRef } from 'react';

export function useGameLogic() {
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const generateQuestion = useCallback(() => {
    // Clear timer if manually called or on new question
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    // ... existing logic
  }, [playableSongs, allSongs]);

  const startGame = () => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    setScore(0);
    generateQuestion();
  };

  const handleOptionClick = (optionId: string) => {
    // ...
    if (isCorrect) {
      setGameState('answered');
      // Set transition timer
      transitionTimerRef.current = setTimeout(() => {
        generateQuestion();
      }, 1500);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  // ...
}
```

- [ ] **Step 2: Commit**

```bash
git add components/guess/useGameLogic.ts
git commit -m "fix: resolve race condition in game transitions"
```

### Task 4: Hardcoded Colors & Final Polish

**Files:**
- Modify: `components/guess/GameStatusHeader.tsx`
- Modify: `components/guess/SongOptionCard.tsx`
- Modify: `components/guess/GameOverModal.tsx`

- [ ] **Step 1: Replace hardcoded colors with CSS variables**

Use `--accent-color`, `--text-secondary`, `--text-muted`, and define local semantic constants for Correct/Wrong states if needed.

- [ ] **Step 2: Verify and Commit**

```bash
git add components/guess/GameStatusHeader.tsx components/guess/SongOptionCard.tsx components/guess/GameOverModal.tsx
git commit -m "style: cleanup hardcoded colors and apply final polish"
```
