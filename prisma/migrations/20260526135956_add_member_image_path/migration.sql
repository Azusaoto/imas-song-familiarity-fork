-- Member.imagePath:偶像縮圖的相對路徑(例 /idol-images/{taxId}.webp)
-- 用 IF NOT EXISTS 防同樣的 P3018 — 跟同 PR 內的 colors migration 同理
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "imagePath" TEXT;
