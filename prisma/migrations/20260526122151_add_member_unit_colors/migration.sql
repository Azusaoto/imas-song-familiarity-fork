-- Member.color / Unit.color 兩個欄位
-- 用 IF NOT EXISTS 是因為部分環境 (prod) 之前已透過 prisma db push 或別的方式
-- 加過這兩個欄位,直接 ADD COLUMN 會撞 "column already exists" (PG 42701)
-- → P3018 把整個 migration 鎖住
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "color" TEXT;
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "color" TEXT;
