// 標題正規化：去除 M@STER VERSION / Remix / Short / 括號 / 標點 / 大小寫
// 從原 scripts/scrape.ts 抽出，sync-pitches 等需要做歌名對照時都會用
export function normalize(str: string): string {
  if (!str) return '';
  return str
    .replace(/\s+/g, '')
    .replace(/[（\s(]*M@STERVERSION[）\s)]*/gi, '')
    .replace(/[（\s(]*HYRVERSION[）\s)]*/gi, '')
    .replace(/[（\s(]*REM@STER-[A-Z][）\s)]*/gi, '')
    .replace(/[（\s(]*GAMEVERSION[）\s)]*/gi, '')
    .replace(/[（\s(]*Remix[）\s)]*/gi, '')
    .replace(/[（\s(]*Short[）\s)]*/gi, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/（[^）]*）/g, '')
    .replace(/["'”「」『』!！?？\-－—–~～+＋*＊.。,，_＿\/／\\＼★☆♥♡♪＊◆◇]/g, '')
    .toLowerCase()
    .trim();
}
