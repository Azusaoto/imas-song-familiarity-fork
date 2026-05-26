# 猜歌系統 (Song Guessing Game) 設計規格書

## 1. 專案目標
打造一個與 `imas-song-familiarity` 專案風格高度一致的猜歌遊戲。使用者可以透過聆聽 YouTube 歌曲片段，在 4 個選項中選出正確答案，並挑戰最高連勝分數。

## 2. 核心遊戲邏輯：無盡挑戰 (Survival Mode)
*   **單局流程**：
    1.  系統從資料庫中隨機抽選一首具備 YouTube ID 的歌曲作為答案。
    2.  隨機抽選另外 3 首歌曲作為干擾選項（共 4 選項）。
    3.  播放歌曲音訊（隱藏影片畫面）。
    4.  使用者選擇選項：
        *   **正確**：獲得連勝數 +1，目前分數 +1，進入下一題。
        *   **錯誤**：遊戲結束，進入結算畫面。
*   **計分方式**：
    *   基礎分：1 pts / 題。
    *   連勝加成：無（純累計答對題數）。
*   **提示道具 (Power-ups) 每局限定 3 次**：
    *   **50/50 刪去法**：隨機排除 2 個錯誤選項。
    *   **同品牌提示**：若當前答案是某品牌，則干擾選項也會儘量變換為同品牌歌曲。

## 3. UI/UX 規範 (與主站一致)
*   **佈局 (Layout)**：
    *   使用 `var(--bg-base)` 作為背景。
    *   頂部顯示當前連勝數/得分與最佳紀錄。
*   **元件樣式**：
    *   **選項卡片**：使用 `.card-el` 類別，搭配 `var(--radius-md)` 與 hover 陰影效果。
    *   **按鈕**：使用 `.btn .btn-primary` (主要) 與 `.btn .btn-secondary` (提示工具)。
    *   **播放器**：使用 `YoutubePlayer` 元件，寬高比 16:9，具備圓角 `var(--radius-lg)`。
*   **主題色支援**：
    *   所有強調色必須引用 CSS 變數（如 `var(--accent-color)`）。
    *   元件最外層必須注入 `lib/themeUtils.ts` 的 `buildThemeVars` 產生的樣式物件。
    *   選項卡片左側需根據品牌顯示對應的 `border-left` 色條（使用 `getBrandColor`）。

## 4. 資料與架構
*   **API 來源**：`/api/songs`。
*   **組件拆解**：
    *   `app/guess/page.tsx`：頁面容器與 Metadata。
    *   `components/guess/GameClient.tsx`：遊戲核心狀態機。
    *   `components/guess/YoutubePlayer.tsx`：YouTube 播放器封裝。
    *   `components/guess/GameOverModal.tsx`：(新) 結算畫面。
