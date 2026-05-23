import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// E2E 設定 — 用於 `npm run test:e2e`
// 跟單元測試的差別:
// - 只跑 tests/e2e/**
// - 依賴本機 dev server (LOCAL_BASE) + 外部 API (api.fujiwarahaji.me)
// - 比較長的 timeout (網路請求)
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    include: ['tests/e2e/**/*.test.{ts,tsx}'],
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
