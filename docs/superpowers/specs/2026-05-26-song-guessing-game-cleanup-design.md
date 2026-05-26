# Design Spec: Song Guessing Game Cleanup and Completion

This document outlines the changes required to remove Tailwind dependencies, implement high score persistence, fix logic race conditions, and clean up hardcoded values in the Song Guessing Game.

## 1. UI & Styling (Tailwind Removal)

The project does not use Tailwind CSS. All Tailwind classes will be replaced with standard CSS or existing project classes.

### 1.1 `app/guess/page.tsx`
- Replace `min-h-screen bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100 transition-colors` with a wrapper div using standard styles. (Note: `globals.css` already sets body background and color).
- Replace `container mx-auto max-w-4xl pt-8 pb-20` with `<div className="container" style={{ maxWidth: '896px', paddingTop: '2rem', paddingBottom: '5rem' }}>`.

### 1.2 `components/guess/YoutubePlayer.tsx`
- Replace `aspect-video` with `aspect-ratio: 16 / 9`.
- Replace `backdrop-blur-md` with `backdrop-filter: blur(12px)`.
- Convert all utility classes to inline styles or appropriate CSS properties in a `style` object.
- **YouTube Mask**: Ensure the mask is absolutely positioned (`inset: 0`) and has a higher z-index than the video when `showVideo` is false.

## 2. Best Record (High Score) Implementation

### 2.1 State & Persistence
- Add `bestRecord` state to `useGameLogic.ts`.
- Initialize `bestRecord` from `localStorage.getItem('imas-guess-highscore')` on mount.
- Update `bestRecord` whenever `score + 1` exceeds the current `bestRecord` (during a correct answer).

### 2.2 UI Display
- Update `GameStatusHeader.tsx` to display the "BEST RECORD".
- Layout: `SCORE: X | BEST: Y`.

## 3. Logic Race Condition Fix

### 3.1 Transition Timer Management
- Use `useRef<NodeJS.Timeout | null>(null)` to track the 1.5s automatic transition timer.
- **Clear Timer**:
    - In `generateQuestion`: Clear any existing timer to prevent double-skipping.
    - In `startGame`: Clear any existing timer.
    - In `onUnmount`: Clear the timer.
- **Manual "Next"**: If a "Next" button is ever added, it will safely call `generateQuestion` which clears the pending automatic transition.

## 4. Hardcoded Values Cleanup

### 4.1 Color Consolidation
- Use CSS variables from `globals.css` where possible:
    - `--accent-color`
    - `--text-primary`
    - `--text-secondary`
    - `--border-color`
- Define semantic local constants for game-specific states:
    - `COLOR_CORRECT = '#22c55e'` (or use a variable if defined)
    - `COLOR_WRONG = '#ef4444'`
    - `COLOR_ELIMINATED = '#9ca3af'`

## 5. Verification Plan

### 5.1 Manual Verification
- Play the game and verify:
    - Correct answer leads to a single transition after 1.5s.
    - High score updates and persists after page reload.
    - Video is completely masked when `showVideo` is false.
    - Responsiveness on mobile.

### 5.2 Automated Tests
- Add/Update tests in `tests/GameClient.test.tsx` (or similar) to verify high score logic and timer clearing.
