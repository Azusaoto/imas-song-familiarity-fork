# GameClient Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine GameClient logic and interface by adding GameOverModal, polishing option cards, and ensuring automatic next question flow.

**Architecture:** Use React state for game state management (`loading`, `idle`, `playing`, `answered`, `gameover`). Implement `GameOverModal` as a conditional overlay.

**Tech Stack:** Next.js (App Router), React, CSS Modules/Globals.

---

### Task 1: Integrate GameOverModal

**Files:**
- Modify: `components/guess/GameClient.tsx`

- [ ] **Step 1: Implement GameOverModal in JSX**
  Add the `GameOverModal` component to the main return statement of `GameClient`, shown when `gameState === 'gameover'`.

- [ ] **Step 2: Connect onRestart**
  Pass the `startGame` function to the `onRestart` prop of `GameOverModal`.

### Task 2: Polish Option Cards and Brand Colors

**Files:**
- Modify: `components/guess/GameClient.tsx`

- [ ] **Step 1: Refine Card Styling**
  Update the option card mapping logic to strictly follow the design requirements, using `.card-el` and brand-specific accent colors.

- [ ] **Step 2: Improve Visual Feedback**
  Ensure clear distinction between correct, incorrect, and eliminated states with appropriate colors and animations (e.g., bounce for correct answer).

### Task 3: Robust Automatic Next Question

**Files:**
- Modify: `components/guess/GameClient.tsx`

- [ ] **Step 1: Ensure Correct Transition**
  Verify the `setTimeout` in `handleOptionClick` correctly triggers `handleNext` after 1.5s when the answer is correct.

- [ ] **Step 2: Prevent Multiple Clicks**
  Confirm that `handleOptionClick` is disabled when the state is `answered`.

### Task 4: Verification and Final Polish

- [ ] **Step 1: Manual Verification**
  Test the entire game flow: Idle -> Playing -> Correct -> Next OR Wrong -> GameOver -> Restart.

- [ ] **Step 2: Clean up unused state or logs**
  Check for any debug logs or unused variables.
