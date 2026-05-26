# Song Guessing Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 實作無盡挑戰模式的猜歌系統，套用專案標準 UI 樣式，並採用答錯即結束的機制與 1 分制計分。

**Architecture:** 
1. 新增 `GameOverModal` 負責顯示結算畫面。
2. 重構 `GameClient.tsx`：將原本的 `answered` 狀態擴充，答對直接下一題，答錯進入 `gameover` 狀態。導入 `buildThemeVars` 確保樣式整合。

**Tech Stack:** React, Next.js, CSS Variables

---

### Task 1: 建立 GameOverModal 結算元件

**Files:**
- Create: `components/guess/GameOverModal.tsx`

- [ ] **Step 1: 實作 GameOverModal 基礎結構**

```tsx
import React from 'react';

type GameOverModalProps = {
  score: number;
  onRestart: () => void;
};

export default function GameOverModal({ score, onRestart }: GameOverModalProps) {
  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }}>
      <div className="modal-content" style={{ textAlign: 'center', maxWidth: '400px' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>遊戲結束！</h2>
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>本次連勝紀錄</p>
          <div style={{ fontSize: '64px', fontWeight: '800', color: 'var(--accent-color)', lineHeight: 1 }}>
            {score}
          </div>
        </div>
        <div className="modal-actions" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" style={{ width: '100%', fontSize: '16px', padding: '12px' }} onClick={onRestart}>
            再玩一次
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Task 2: 重構 GameClient 邏輯與介面

**Files:**
- Modify: `components/guess/GameClient.tsx`

- [ ] **Step 1: 引入必要的模組與重構 State**

修改 `GameClient.tsx` 頂部的 imports 與 state 宣告：
- 引入 `GameOverModal`。
- 引入 `buildThemeVars`。
- 狀態 `gameState` 新增 `'gameover'`。
- 狀態 `score` 從 `{ correct: number, total: number }` 改為純數字 `number`。

- [ ] **Step 2: 更新遊戲控制邏輯 (startGame, handleOptionClick, useElimination, useSameBrand)**

- 修改 `startGame` 重置單一數值 `score`。
- 修改 `handleOptionClick`：
  - 答對時：`setScore(prev => prev + 1); setGameState('answered'); setTimeout(handleNext, 1500);` (延遲後自動換題)。
  - 答錯時：`setGameState('gameover');`。
- 修改提示工具函數，使其適應新的 state 檢查。

- [ ] **Step 3: 重新建構 UI 渲染層 (JSX)**

- 在最外層包裹容器注入 `style={buildThemeVars(currentAccentColor)}`。
- 替換原有的頂部狀態列為帶有 `SCORE` 標示的新設計。
- 將提示按鈕改為使用 `btn btn-secondary`。
- 選項區塊使用 `card-el`，並結合 `getBrandColor` 來設置左側邊框 `borderLeft`。
- 在 `gameState === 'gameover'` 時渲染 `GameOverModal`。