/**
 * sync-units.ts
 *
 * 同步 fujiwarahaji.me 全部 Unit 至本地 DB。
 *
 * 流程：
 * 1. 爬 https://fujiwarahaji.me/sitemap/unit (HTML) 拿全部 unit tax_id
 * 2. 對每個 tax_id 呼叫 /v4/tax?id={tax_id}（pLimit 控制併發）
 * 3. 解析 member[]：
 *    - 推導 unit.production（成員 production 多數決；跨 IP 為 'mixed'）
 *    - 寫入 UnitMember
 * 4. 解析 music[]：
 *    - slug = MD5(`{music_type}/{song_id}`) → 對應本地 Song
 *    - 寫入 SongUnit
 *
 * 冪等。先跑 sync-idols.ts 再跑這個（成員 production 才會有資料）。
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import crypto from 'crypto';
import { getTax, type ApiMember, type ApiMusicSummary } from './lib/api';
import { prisma } from './lib/prisma';

const SITEMAP_URL = 'https://fujiwarahaji.me/sitemap/unit';
const USER_AGENT =
  'imas-song-familiarity/0.2 (+https://github.com/parlayze/imas-song-familiarity)';

async function fetchUnitTaxIds(): Promise<number[]> {
  console.log('[sync-units] 抓取 unit sitemap...');
  const res = await axios.get(SITEMAP_URL, {
    headers: { 'User-Agent': USER_AGENT, Accept: '*/*' },
    timeout: 20000,
  });
  const $ = cheerio.load(res.data);
  const ids = new Set<number>();
  $('a[href*="/unit/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const m = href.match(/\/unit\/(\d+)/);
    if (m) ids.add(parseInt(m[1], 10));
  });
  return [...ids].sort((a, b) => a - b);
}

function deriveProduction(members: ApiMember[]): string | null {
  const productions = members
    .map((m) => m.production)
    .filter((p): p is string => !!p);
  if (productions.length === 0) return null;

  const unique = [...new Set(productions)];
  if (unique.length === 1) return unique[0];
  return 'mixed';
}

function computeSlug(musicType: string, songId: number): string {
  return crypto.createHash('md5').update(`${musicType}/${songId}`).digest('hex');
}

interface SyncStats {
  unitsCreated: number;
  unitsUpdated: number;
  unitsFailed: number;
  songLinks: number;
  songLinksMissing: number;
  memberLinks: number;
  memberLinksMissing: number;
}

async function syncOneUnit(taxId: number, stats: SyncStats) {
  let tax;
  try {
    tax = await getTax(taxId);
  } catch (err: any) {
    console.error(`[sync-units] tax_id=${taxId} 抓取失敗: ${err.message}`);
    stats.unitsFailed++;
    return;
  }

  if (!tax || tax.type !== 'unit' || !tax.name) {
    // 某些 tax_id 可能是 idol/live 共用 namespace，不是 unit
    return;
  }

  const members = (tax.member ?? []) as ApiMember[];
  // v4 API 回應 unit 時，歌曲列表的 key 是 `song`，不是 `music`（與 docs 不一致）
  const songs = (tax.song ?? tax.music ?? []) as ApiMusicSummary[];
  const production = deriveProduction(members);

  let unitRow;
  try {
    const existing = await prisma.unit.findUnique({ where: { taxId } });
    if (existing) {
      unitRow = await prisma.unit.update({
        where: { id: existing.id },
        data: { name: tax.name, kana: tax.kana ?? null, production },
      });
      stats.unitsUpdated++;
    } else {
      unitRow = await prisma.unit.create({
        data: { taxId, name: tax.name, kana: tax.kana ?? null, production },
      });
      stats.unitsCreated++;
    }
  } catch (err: any) {
    console.error(`[sync-units] tax_id=${taxId} (${tax.name}) upsert 失敗: ${err.message}`);
    stats.unitsFailed++;
    return;
  }

  // Link members
  for (const m of members) {
    if (!m.tax_id) {
      stats.memberLinksMissing++;
      continue;
    }
    const member = await prisma.member.findUnique({ where: { taxId: m.tax_id } });
    if (!member) {
      stats.memberLinksMissing++;
      continue;
    }
    try {
      await prisma.unitMember.upsert({
        where: { unitId_memberId: { unitId: unitRow.id, memberId: member.id } },
        update: {},
        create: { unitId: unitRow.id, memberId: member.id },
      });
      stats.memberLinks++;
    } catch (err: any) {
      // 唯一鍵衝突或其他 race，視為已存在
      stats.memberLinks++;
    }
  }

  // Link songs
  for (const s of songs) {
    if (!s.song_id || !s.music_type) {
      stats.songLinksMissing++;
      continue;
    }
    const slug = computeSlug(s.music_type, s.song_id);
    const song = await prisma.song.findUnique({ where: { slug } });
    if (!song) {
      stats.songLinksMissing++;
      continue;
    }
    try {
      await prisma.songUnit.upsert({
        where: { songId_unitId: { songId: song.id, unitId: unitRow.id } },
        update: {},
        create: { songId: song.id, unitId: unitRow.id },
      });
      stats.songLinks++;
    } catch (err: any) {
      stats.songLinks++;
    }
  }
}

async function main() {
  const taxIds = await fetchUnitTaxIds();
  console.log(`[sync-units] 從 sitemap 找到 ${taxIds.length} 個 unit tax_id`);

  const limit = pLimit(8);
  const stats: SyncStats = {
    unitsCreated: 0,
    unitsUpdated: 0,
    unitsFailed: 0,
    songLinks: 0,
    songLinksMissing: 0,
    memberLinks: 0,
    memberLinksMissing: 0,
  };

  let done = 0;
  await Promise.all(
    taxIds.map((id) =>
      limit(async () => {
        await syncOneUnit(id, stats);
        done++;
        if (done % 100 === 0 || done === taxIds.length) {
          console.log(`[sync-units] 進度 ${done}/${taxIds.length}`);
        }
      }),
    ),
  );

  console.log('[sync-units] 統計:');
  console.log(JSON.stringify(stats, null, 2));

  const byProd = await prisma.unit.groupBy({ by: ['production'], _count: true });
  console.log('[sync-units] Unit production 分布:');
  for (const r of byProd) {
    console.log(`  ${r.production ?? '(null)'}: ${r._count}`);
  }
}

main()
  .catch((err) => {
    console.error('[sync-units] 中斷:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
