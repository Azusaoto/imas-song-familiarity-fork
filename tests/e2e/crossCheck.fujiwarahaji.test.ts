import { expect, test, describe, beforeAll } from 'vitest';
import { filterSongs, type FilterableSong } from '../../lib/filterSongs';

// ──────────────────── 測試先決條件 ────────────────────
//
// 這個套件以 https://api.fujiwarahaji.me/v4 為 ground truth,
// 比對本地 /api/songs + filterSongs 對相同實體(unit / idol)
// 是否回傳同一組歌曲。
//
// 依賴:
// - 本機 dev server 在 http://localhost:3001 (或環境變數 LOCAL_BASE)
// - 對 api.fujiwarahaji.me 的網路存取
//
// 跑法: npm run test:e2e
// ─────────────────────────────────────────────────────

const LOCAL_BASE = process.env.LOCAL_BASE || 'http://localhost:3001';
const FUJI_BASE = 'https://api.fujiwarahaji.me/v4';
const UA = 'imas-song-familiarity-e2e/1.0';

interface LocalSong extends FilterableSong {
  id: string;
}
interface LocalIdol {
  id: string;
  taxId: number | null;
  name: string;
  production: string | null;
}
interface LocalUnit {
  id: string;
  taxId: number | null;
  name: string;
  production: string | null;
}

interface FujiMember {
  name: string;
  type: 'idol';
  tax_id: number;
}
interface FujiSong {
  name: string;
  type: 'music';
  song_id: number;
  music_type?: string;
}
interface FujiTaxResponse {
  name: string;
  type: string;
  tax_id: number;
  member?: FujiMember[];
  song?: FujiSong[];
  music?: FujiSong[];
}

interface FujiListIdol {
  name: string;
  tax_id: number;
  count: number;
  production: string;
}

// 標準化歌名以避免微小排版差異(空白、版本後綴)
function normTitle(s: string): string {
  return s
    .replace(/[（(]\s*(?:M@STER|HYR|GAME|REM@STER-[A-Z]|Short|Remix)\s*VERSION?[）)]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*' } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return (await res.json()) as T;
}

// 測試實體 — 涵蓋全部 production
const UNIT_CASES: Array<{ taxId: number; expectedName: string }> = [
  { taxId: 531, expectedName: 'Triad Primus' },        // 765
  { taxId: 419, expectedName: 'new generations' },     // cg
  { taxId: 449, expectedName: '＊(Asterisk)' },        // sc / 283
  { taxId: 4066, expectedName: 'DRAMATIC STARS' },     // 315
  { taxId: 4686, expectedName: 'Begrazia' },           // gakuen
];

const IDOL_CASES: Array<{ taxId: number; expectedName: string }> = [
  { taxId: 23, expectedName: '島村卯月' },     // cg
  { taxId: 1107, expectedName: '天海春香' },   // 765
  { taxId: 1147, expectedName: '櫻木真乃' },   // 283
  { taxId: 3609, expectedName: '天道輝' },     // 315
  { taxId: 3553, expectedName: '藤田ことね' }, // gakuen
];

let localSongs: LocalSong[];
let localIdols: LocalIdol[];
let localUnits: LocalUnit[];
let fujiIdolList: FujiListIdol[]; // fujiwarahaji /list?type=idol — 提供 count 給所有 idol

beforeAll(async () => {
  // 撈本機資料 + fujiwarahaji 全偶像列表
  try {
    [localSongs, localIdols, localUnits, fujiIdolList] = await Promise.all([
      fetchJson<LocalSong[]>(`${LOCAL_BASE}/api/songs?schema=v2`),
      fetchJson<LocalIdol[]>(`${LOCAL_BASE}/api/idols`),
      fetchJson<LocalUnit[]>(`${LOCAL_BASE}/api/units`),
      fetchJson<FujiListIdol[]>(`${FUJI_BASE}/list?type=idol`),
    ]);
  } catch (e: any) {
    throw new Error(
      `無法連到本機 dev server (${LOCAL_BASE}) 或 fujiwarahaji。請先 \`npm run dev\`。原因: ${e.message}`,
    );
  }
  expect(localSongs.length).toBeGreaterThan(0);
  expect(fujiIdolList.length).toBeGreaterThan(0);
}, 30000);

describe('cross-check: units 對 fujiwarahaji v4', () => {
  test.each(UNIT_CASES)(
    'unit taxId=$taxId ($expectedName) 歌單與 fujiwarahaji 一致',
    async ({ taxId, expectedName }) => {
      const truth = await fetchJson<FujiTaxResponse>(`${FUJI_BASE}/tax?id=${taxId}`);
      expect(truth.type).toBe('unit');
      expect(truth.name).toBe(expectedName);

      const truthSongs = truth.song ?? truth.music ?? [];
      const truthTitles = new Set(truthSongs.map((s) => normTitle(s.name)));

      // 用 taxId 反查我們 DB 的 unit.id
      const localUnit = localUnits.find((u) => u.taxId === taxId);
      expect(localUnit, `本地 DB 找不到 unit taxId=${taxId}`).toBeDefined();

      const filtered = filterSongs(localSongs, {
        searchQuery: '',
        selectedBrands: [],
        selectedTypes: [],
        selectedIdols: [],
        selectedUnits: [localUnit!.id],
      });
      const localTitles = new Set(filtered.map((s) => normTitle(s.title)));

      expect(filtered.length, '歌曲數要相等').toBe(truthSongs.length);
      expect(localTitles, '歌名集合要相等').toEqual(truthTitles);
    },
    30000,
  );
});

describe('cross-check: idols 對 fujiwarahaji v4', () => {
  // 註: fujiwarahaji 的 /tax 對 SideM (production=315) 全部 idol 回 400,
  // 但 /list 有 count 欄位。所以策略: count 一律比;歌名集合在 /tax 可用時才比。
  test.each(IDOL_CASES)(
    'idol taxId=$taxId ($expectedName) 歌數一致(歌名集合在 /tax 可用時也驗)',
    async ({ taxId, expectedName }) => {
      const listEntry = fujiIdolList.find((x) => x.tax_id === taxId);
      expect(listEntry, `fujiwarahaji /list 找不到 taxId=${taxId}`).toBeDefined();
      expect(listEntry!.name).toBe(expectedName);

      const localIdol = localIdols.find((i) => i.taxId === taxId);
      expect(localIdol, `本地 DB 找不到 idol taxId=${taxId}`).toBeDefined();

      const filtered = filterSongs(localSongs, {
        searchQuery: '',
        selectedBrands: [],
        selectedTypes: [],
        selectedIdols: [localIdol!.id],
        selectedUnits: [],
      });
      expect(filtered.length, '歌曲數要等於 fujiwarahaji /list.count').toBe(
        listEntry!.count,
      );

      // 試 /tax 拿歌名;若該 idol 不支援(SideM 等)就只驗 count
      try {
        const truth = await fetchJson<FujiTaxResponse>(`${FUJI_BASE}/tax?id=${taxId}`);
        const truthSongs = truth.song ?? truth.music ?? [];
        const truthTitles = new Set(truthSongs.map((s) => normTitle(s.name)));
        const localTitles = new Set(filtered.map((s) => normTitle(s.title)));
        expect(localTitles, '歌名集合要相等').toEqual(truthTitles);
      } catch (e: any) {
        if (!String(e.message).includes('HTTP 400')) throw e;
        // 400: fujiwarahaji /tax 不支援此 idol。略過歌名比對,count 已驗過。
      }
    },
    30000,
  );
});

describe('cross-check: 進階 — AND-across 過濾組合', () => {
  test('Triad Primus AND 島村卯月 → 應該回 fuji /tax(Triad Primus).song ∩ /tax(島村).song', async () => {
    const [tpTruth, shimamuraTruth] = await Promise.all([
      fetchJson<FujiTaxResponse>(`${FUJI_BASE}/tax?id=531`),
      fetchJson<FujiTaxResponse>(`${FUJI_BASE}/tax?id=23`),
    ]);
    const tpTitles = new Set((tpTruth.song ?? []).map((s) => normTitle(s.name)));
    const shTitles = new Set((shimamuraTruth.song ?? []).map((s) => normTitle(s.name)));
    const intersection = new Set([...tpTitles].filter((t) => shTitles.has(t)));

    const tp = localUnits.find((u) => u.taxId === 531);
    const shimamura = localIdols.find((i) => i.taxId === 23);
    expect(tp).toBeDefined();
    expect(shimamura).toBeDefined();

    const filtered = filterSongs(localSongs, {
      searchQuery: '',
      selectedBrands: [],
      selectedTypes: [],
      selectedIdols: [shimamura!.id],
      selectedUnits: [tp!.id],
    });

    expect(filtered.length).toBe(intersection.size);
    expect(new Set(filtered.map((s) => normTitle(s.title)))).toEqual(intersection);
  }, 30000);

  test('關鍵字「Trinity」應命中 Triad Primus 之 Trinity Field', () => {
    const filtered = filterSongs(localSongs, {
      searchQuery: 'Trinity',
      selectedBrands: [],
      selectedTypes: [],
      selectedIdols: [],
      selectedUnits: [],
    });
    const titles = filtered.map((s) => s.title);
    expect(titles).toContain('Trinity Field');
  });
});

describe('cross-check: 全域資料量', () => {
  test('本地 /api/songs 至少有 2500 首(scraper 跑完應有 2560)', () => {
    expect(localSongs.length).toBeGreaterThanOrEqual(2500);
  });
  test('本地 /api/idols 至少 250 個', () => {
    expect(localIdols.length).toBeGreaterThanOrEqual(250);
  });
  test('本地 /api/units 至少 290 個', () => {
    expect(localUnits.length).toBeGreaterThanOrEqual(290);
  });
});
