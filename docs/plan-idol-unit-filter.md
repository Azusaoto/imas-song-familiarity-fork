# 計畫書：偶像 + 組合連動篩選器

> 狀態：草案 / 待審查
> 目標版本：v0.2.0
> 預估工時：3 個 PR（合計 ~8 小時）

---

## 1. 目標

讓使用者能透過「品牌 → 偶像 → 組合」三層下拉連動，更精準找到歌曲。

### 使用情境
> 「我想找 灰姑娘女孩 → 三村かな子 → asterisk 的歌」

目前只能：搜尋框輸入「三村」+ 品牌選 `music_cg` → 全部 cg 三村的歌混在一起。

### 成功標準
- [ ] 品牌選 `music_cg` 時，偶像下拉只顯示 CG 偶像
- [ ] 品牌 + 偶像都選定後，組合下拉只顯示「該偶像所屬 + 該品牌」的組合
- [ ] 三層篩選結果即時生效（與既有 keyword search、musicType 共存）
- [ ] DB 完整保存偶像 production 與組合資訊，不再靠字串推斷

---

## 2. 範圍

### In scope
- 加 `Member.production` / `Member.taxId` / `Member.kana` 等欄位
- 新增 `Unit` / `UnitMember` / `SongUnit` 三張表
- 寫 `sync-idols.ts` / `sync-units.ts` 兩支同步腳本
- 抽 `scripts/lib/` 共用模組（API client、Prisma、normalize）
- `/api/songs` 回傳補帶 `units` 關聯
- 新增 `/api/idols` / `/api/units` 端點（帶 `production` query）
- 前端 `app/page.tsx` 加兩個 dependent dropdown
- `package.json` 補上 `sync:*` npm scripts

### Out of scope（這次不做）
- 改用 v4 API 替換歌曲爬蟲本體（`scrape.ts` 暫不動 —— 下一個迭代再做）
- 新增 CD / Live 表
- 後端搜尋 API（仍用前端 filter）
- 音域範圍篩選 UI
- kana / 羅馬字搜尋
- FTS5 全文索引

---

## 3. DB 變更

### Migration: `add_idol_unit`

```prisma
model Member {
  // 既有
  id      String       @id @default(uuid())
  name    String       @unique
  cvName  String?
  songs   SongMember[]

  // 新增
  taxId      Int?         @unique
  kana       String?
  cvKana     String?
  production String?      // cg | 765 | sc | 315 | gakuen | hatsuboshi | 876
  units      UnitMember[]

  @@index([production])
}

model Unit {
  id         String       @id @default(uuid())
  taxId      Int          @unique
  name       String
  kana       String?
  production String?      // 派生：成員 production 多數決；跨 IP 取 "mixed"
  members    UnitMember[]
  songs      SongUnit[]

  @@index([production])
  @@index([name])
}

model UnitMember {
  unitId   String
  memberId String
  unit     Unit   @relation(fields: [unitId], references: [id], onDelete: Cascade)
  member   Member @relation(fields: [memberId], references: [id], onDelete: Cascade)

  @@id([unitId, memberId])
}

model SongUnit {
  songId String
  unitId String
  song   Song @relation(fields: [songId], references: [id], onDelete: Cascade)
  unit   Unit @relation(fields: [unitId], references: [id], onDelete: Cascade)

  @@id([songId, unitId])
}

model Song {
  // 既有不動，僅補反向關聯
  units SongUnit[]
}
```

### 資料回填策略
1. `sync-idols.ts` 跑完後，舊 `Member` 用 `name` match 把 `taxId / production / kana` 補回去
2. 同名衝突 (例：聲優與偶像同名) → log 出來人工確認；以 idol 優先
3. 找不到對應 idol 的 `Member` 條目 → 保留 `production = null`，從前端 idol 下拉中排除（但歌曲層的 `SongMember` 不受影響）

### Rollback
Migration 是純 additive（不刪除舊欄位），出問題直接 `prisma migrate resolve --rolled-back`。

---

## 4. 爬蟲變更

### 新增檔案

```
scripts/
├── lib/
│   ├── api.ts          # fujiwarahaji v4 client（rate limit + retry）
│   ├── prisma.ts       # PrismaClient singleton for scripts
│   └── normalize.ts    # 既有的標題正規化邏輯抽出
├── sync-idols.ts       # 新
├── sync-units.ts       # 新（含 song↔unit）
└── sync-all.ts         # orchestrator
```

### `lib/api.ts`
- Base URL: `https://api.fujiwarahaji.me/v4`
- `pLimit(10)` 控制併發
- 每個 request 100-250ms 隨機延遲（沿用 scrape.ts 既有禮貌）
- 自動 retry on 5xx（最多 3 次，指數退避）
- 統一 UA 與錯誤 log

### `sync-idols.ts`
```
GET /v4/list?type=idol
→ ~150 個 idol 一次拿完
→ for each: upsert Member by taxId
   - 既有 Member（用 name 找）→ 補 taxId/production/kana
   - 新 Member → create
```
~50 行。冪等，可重複跑。

### `sync-units.ts`
```
1. fetch https://fujiwarahaji.me/sitemap/unit (HTML)
   → cheerio 抽出所有 unit/{tax_id} link
2. for each unit tax_id (pLimit 10):
   GET /v4/tax?id={tax_id}
   → 取得 unit name, kana, member[], music[]
3. 計算 production:
   - 收集所有 member.production
   - 若全相同 → 該 production
   - 若混合 → "mixed"
4. Upsert Unit / UnitMember / SongUnit
   - SongUnit 寫入前確認 song.taxId 存在於 DB，否則跳過（log）
```
~120 行。

### `sync-all.ts`
```
sync-idols → sync-units（依序，因 unit 需要 idol production）
```

### `package.json` 補上
```json
"scripts": {
  "sync:idols":   "ts-node scripts/sync-idols.ts",
  "sync:units":   "ts-node scripts/sync-units.ts",
  "sync:songs":   "ts-node scripts/scrape.ts",
  "sync:pitches": "ts-node scripts/update-pitches.ts",
  "sync:all":     "ts-node scripts/sync-all.ts"
}
```

### 既有 `scrape.ts` 變更
- **此計畫不重寫**，只動最小修改：
  - 寫 Song 時若 API 有給 `taxId`（後續迭代會給）就帶上；目前繼續用既有 slug 機制
  - `scrapeAll()` 不再在頂層直接執行 —— 改 export 為 function（讓 sync-all.ts 呼叫）

---

## 5. API 變更

### 新增端點

**`GET /api/idols?production=cg`**
```ts
// app/api/idols/route.ts
// 回傳：[{ id, taxId, name, kana, cvName, production }]
// production 為 'all' 或省略時，回傳全部
// Cache-Control: public, max-age=3600
```

**`GET /api/units?production=cg`**
```ts
// app/api/units/route.ts
// 回傳：[{ id, taxId, name, kana, production, memberCount }]
// 同上，支援 production filter
// Cache-Control: public, max-age=3600
```

### 既有端點修改

**`GET /api/songs`** 在現有 response 補帶 `units`：
```ts
{
  id, slug, title, brand, musicType, lyrics, composer, arranger,
  lowestPitch, highestPitch,
  members: [...],
  units: [{ id, name }]  // ← 新增
}
```
Payload 預估從 1.2 MB → ~1.4 MB（可接受）。

---

## 6. 前端變更

### `app/page.tsx`

#### 新增 state
```ts
const [selectedIdol, setSelectedIdol] = useState<string>('all');
const [selectedUnit, setSelectedUnit] = useState<string>('all');
const [allIdols, setAllIdols] = useState<Idol[]>([]);
const [allUnits, setAllUnits] = useState<Unit[]>([]);
```

#### 啟動載入兩個列表
```ts
useEffect(() => {
  fetch('/api/idols').then(r => r.json()).then(setAllIdols);
  fetch('/api/units').then(r => r.json()).then(setAllUnits);
}, []);
```

#### Brand → Production 對照表 (`lib/brandMap.ts`)
```ts
export const brandToProduction: Record<string, string[]> = {
  music_cg:     ['cg'],
  music_ml:     ['765'],
  music_as:     ['765'],
  music_876:    ['876'],
  music_shiny:  ['sc'],
  music_sidem:  ['315'],
  music_gakuen: ['gakuen', 'hatsuboshi'],
  music_godo:   [],  // 跨 IP，不限制
  music_cover:  [],
  music_remix:  [],
  all:          [],
};
```

#### 連動邏輯
```ts
const idolOptions = useMemo(() => {
  const productions = brandToProduction[selectedBrand] || [];
  if (productions.length === 0) return allIdols;
  return allIdols.filter(i => productions.includes(i.production));
}, [selectedBrand, allIdols]);

const unitOptions = useMemo(() => {
  const productions = brandToProduction[selectedBrand] || [];
  let units = allUnits;
  if (productions.length > 0) {
    units = units.filter(u => productions.includes(u.production) || u.production === 'mixed');
  }
  if (selectedIdol !== 'all') {
    // 該偶像所屬的組合（需要在 /api/units 多帶 memberIds，或前端 join）
    units = units.filter(u => u.memberIds.includes(selectedIdol));
  }
  return units;
}, [selectedBrand, selectedIdol, allUnits]);
```

#### 切換 brand 時重置下游
```ts
function handleBrandChange(brand: string) {
  setSelectedBrand(brand);
  setSelectedIdol('all');
  setSelectedUnit('all');
}
```

#### filteredSongs 加兩條
```ts
if (selectedIdol !== 'all' && !song.members.some(m => m.id === selectedIdol)) return false;
if (selectedUnit !== 'all' && !song.units.some(u => u.id === selectedUnit)) return false;
```

### UI 排版
```
[搜尋框----------------]  [品牌 ▾] [偶像 ▾] [組合 ▾] [類型 ▾]
```
四個 select 並排，視窗窄時換行。

---

## 7. 落地步驟（建議拆 3 個 PR）

### PR 1：基礎建設 + DB schema（~2 小時）
- [ ] 建 `scripts/lib/` 三個共用模組
- [ ] `prisma/schema.prisma` 加新欄位/新表
- [ ] `prisma migrate dev --name add_idol_unit`
- [ ] 跑 migration，確認 `dev.db` 結構正確（既有資料不動）
- [ ] commit、ship

### PR 2：爬蟲 + API 端點（~3 小時）
- [ ] `sync-idols.ts`，本地跑、驗證 Member 補上 production
- [ ] `sync-units.ts`，本地跑、驗證 Unit / UnitMember / SongUnit
- [ ] `/api/idols` / `/api/units` 端點
- [ ] `/api/songs` 補 `units` 欄位
- [ ] `package.json` 補 npm scripts
- [ ] commit、ship

### PR 3：前端 UI（~2.5 小時）
- [ ] `lib/brandMap.ts`
- [ ] `app/page.tsx` 加兩個 select + 連動邏輯
- [ ] 切 brand / idol 時的重置邏輯
- [ ] 視窗響應式測試
- [ ] commit、ship

---

## 8. 風險與開放問題

### 已知風險

1. **Unit 跨 IP `production = 'mixed'`** —— 篩選時要不要顯示在所有品牌下？
   - 提案：選任意品牌時，mixed unit 都顯示
   - 待確認：使用者偏好

2. **`music_876` 沒有對應 production**：API enum 沒列 `876`
   - 提案：先寫 `['876']`，第一次 sync 跑完看實際資料再調整
   - 可能要 fallback 到 `['765']`

3. **既有 `Member` upsert by `name`** 改 `taxId` 後，舊資料的 SongMember 關聯是否會錯位？
   - Migration 不刪 `name @unique`，只是補 `taxId` —— 既有 FK 不受影響
   - sync-idols.ts 用 name 找既有 Member 補 taxId，找不到才 create new

4. **`/api/songs` payload 從 1.2 MB → 1.4 MB**
   - 1 hour cache 仍生效，可接受
   - 若再大就要考慮分頁或 server-side filter

### 開放問題（待使用者拍板）

- [ ] 偶像下拉要按什麼排序？kana 字典序 / 出場次數 / 五十音分組？
- [ ] 偶像下拉要顯示 cv 名嗎？「島村卯月 (大橋彩香)」？
- [ ] 組合下拉是否要顯示成員數？「Triad Primus (3人)」？
- [ ] mixed unit 的呈現？所有品牌都顯示，還是僅在 `all` 時顯示？
- [ ] 「組合 → 偶像」反向連動：選了組合後，偶像下拉是否縮小到該組合成員？

---

## 9. 不在這次處理但要記得

- v4 API 也提供 `kana` 欄位，所有同步腳本要寫入，**為了下個迭代的日文搜尋**
- 雖然這次不做 CD/Live 表，但 `sync-units.ts` 跑 `/v4/tax` 時順手能拿到 `disc` / `live` 資訊 —— 可以先存原始 JSON 到 `data/raw/` 留底
- 重寫 `scrape.ts` 改用 v4 API 是下一個迭代的主項目
