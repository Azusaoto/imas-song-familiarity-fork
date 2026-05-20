import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  // 資料檔由 scripts/scrape-colors.ts 產生，沒跑過時不存在。
  // 顏色只是設定 modal 的擔當推薦，缺資料就回空陣列，不要把整個頁面拖去 500。
  try {
    const dataPath = path.join(process.cwd(), 'data', 'idol-colors.json');
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json([]);
    }
    const data = fs.readFileSync(dataPath, 'utf-8');
    const colors = JSON.parse(data);
    return NextResponse.json(Array.isArray(colors) ? colors : []);
  } catch {
    return NextResponse.json([]);
  }
}
