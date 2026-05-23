import axios, { AxiosError } from 'axios';

// fujiwarahaji.me 官方 v4 JSON API client
// Docs: https://api.fujiwarahaji.me/doc/v4
const BASE_URL = 'https://api.fujiwarahaji.me/v4';

const USER_AGENT =
  'imas-song-familiarity/0.2 (+https://github.com/parlayze/imas-song-familiarity)';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  // 注意：fujiwarahaji.me 的 Apache 設了 content negotiation，
  // 強制 Accept: application/json 會回 406 (找不到 PHP 變體)。
  // 用 */* 並信任 Content-Type，但 axios 仍會自動 JSON.parse 內容。
  headers: {
    'User-Agent': USER_AGENT,
    Accept: '*/*',
  },
  responseType: 'json',
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 隨機延遲（基本禮貌），沿用既有 scrape.ts 數值
async function politeDelay() {
  await sleep(100 + Math.random() * 150);
}

interface GetOptions {
  /** 自動 retry 次數，預設 3 */
  retries?: number;
  /** 是否在每次請求前加禮貌延遲，預設 true */
  delay?: boolean;
}

async function getRaw<T = any>(
  path: string,
  params: Record<string, any> = {},
  opts: GetOptions = {},
): Promise<T> {
  const { retries = 3, delay = true } = opts;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (delay) await politeDelay();
      const res = await client.get<T>(path, { params });
      return res.data;
    } catch (err) {
      const axErr = err as AxiosError;
      const status = axErr.response?.status;

      // 4xx 不重試（除了 429）
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw err;
      }
      if (attempt === retries) throw err;

      // 指數退避：500ms, 1s, 2s
      const backoff = 500 * 2 ** attempt;
      console.warn(
        `[api] ${path} attempt ${attempt + 1}/${retries + 1} failed (${
          status ?? axErr.code ?? 'network'
        })，${backoff}ms 後重試`,
      );
      await sleep(backoff);
    }
  }
  throw new Error('unreachable');
}

// ──────── 高階 API ────────

export interface ApiMember {
  name: string;
  type: 'idol';
  tax_id: number;
  link: string;
  api: string;
  production?: string;
  cv?: string;
  kana?: string;
  cvkana?: string;
}

export interface ApiMusicSummary {
  name: string;
  type: 'music';
  song_id: number;
  music_type: string;
  link: string;
  api: string;
}

export interface ApiTaxResponse {
  name: string;
  type: string; // 'unit' | 'idol' | 'live' | ...
  tax_id: number;
  kana?: string;
  member?: ApiMember[];
  /** 實測 unit 用 `song`，其他 type 文件寫 `music`。兩者都可能 */
  song?: ApiMusicSummary[];
  music?: ApiMusicSummary[];
  [key: string]: any;
}

/** GET /v4/list?type=idol — 拿全部偶像 */
export function listIdols() {
  return getRaw<ApiMember[]>('/list', { type: 'idol' });
}

/** GET /v4/tax?id={id} — 拿單一分類（unit / idol / live...）的詳情 + 關聯歌曲 */
export function getTax(taxId: number) {
  return getRaw<ApiTaxResponse>('/tax', { id: taxId });
}

/** GET /v4/music?id={id} — 拿單曲詳情 */
export function getMusic(songId: number) {
  return getRaw('/music', { id: songId });
}

export { getRaw, sleep };
