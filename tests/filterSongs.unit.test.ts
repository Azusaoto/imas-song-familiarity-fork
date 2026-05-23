import { expect, test, describe } from 'vitest';
import { filterSongs, type FilterableSong, type FilterCriteria } from '../lib/filterSongs';

// 合成資料 — 涵蓋全部 brand、production、idol/unit 連接情境
const songs: FilterableSong[] = [
  {
    brand: 'music_cg',
    title: 'Trinity Field',
    musicType: '["unit"]',
    members: [
      { id: 'idol-cg-1', name: '島村卯月', cvName: '大橋彩香' },
      { id: 'idol-cg-2', name: '渋谷凛', cvName: '福原綾香' },
      { id: 'idol-cg-3', name: '本田未央', cvName: '原紗友里' },
    ],
    units: [{ id: 'unit-cg-tp', name: 'Triad Primus' }],
  },
  {
    brand: 'music_cg',
    title: 'Trancing Pulse',
    musicType: '["unit"]',
    members: [
      { id: 'idol-cg-1', name: '島村卯月', cvName: '大橋彩香' },
      { id: 'idol-cg-2', name: '渋谷凛', cvName: '福原綾香' },
      { id: 'idol-cg-3', name: '本田未央', cvName: '原紗友里' },
    ],
    units: [{ id: 'unit-cg-tp', name: 'Triad Primus' }],
  },
  {
    brand: 'music_cg',
    title: 'できたてEvo! Revo! Generation!',
    musicType: '["unit"]',
    members: [
      { id: 'idol-cg-1', name: '島村卯月', cvName: '大橋彩香' },
      { id: 'idol-cg-2', name: '渋谷凛', cvName: '福原綾香' },
      { id: 'idol-cg-3', name: '本田未央', cvName: '原紗友里' },
    ],
    units: [
      { id: 'unit-cg-tp', name: 'Triad Primus' },
      { id: 'unit-cg-ng', name: 'new generations' },
    ],
  },
  {
    brand: 'music_876',
    title: '"HELLO!"',
    musicType: '["unit"]',
    members: [
      { id: 'idol-876-1', name: '秋月律子', cvName: '若林直美' },
    ],
    units: [],
  },
  {
    brand: 'music_sidem',
    title: 'STORY',
    musicType: '["unit","drama"]',
    members: [
      { id: 'idol-315-1', name: '天道輝', cvName: '仲村宗悟' },
    ],
    units: [{ id: 'unit-315-ds', name: 'DRAMATIC STARS' }],
  },
  {
    brand: 'music_shiny',
    title: 'Spread the Wings!!',
    musicType: '["all"]',
    members: [
      { id: 'idol-283-1', name: '天空橋朋花', cvName: '小宮有紗' },
    ],
    units: [],
  },
];

describe('filterSongs — empty / passthrough', () => {
  test('完全空 criteria → 回全部', () => {
    const out = filterSongs(songs, {
      searchQuery: '',
      selectedBrands: [],
      selectedTypes: [],
      selectedIdols: [],
      selectedUnits: [],
    });
    expect(out).toHaveLength(songs.length);
  });

  test('searchQuery 只有空白 → 視為空,回全部', () => {
    const out = filterSongs(songs, {
      searchQuery: '   ',
      selectedBrands: [],
      selectedTypes: [],
      selectedIdols: [],
      selectedUnits: [],
    });
    expect(out).toHaveLength(songs.length);
  });
});

describe('filterSongs — brand', () => {
  test('單一 brand 過濾', () => {
    const out = filterSongs(songs, {
      searchQuery: '',
      selectedBrands: ['music_cg'],
      selectedTypes: [],
      selectedIdols: [],
      selectedUnits: [],
    });
    expect(out).toHaveLength(3);
    expect(out.every((s) => s.brand === 'music_cg')).toBe(true);
  });

  test('多個 brand 為 OR-within', () => {
    const out = filterSongs(songs, {
      searchQuery: '',
      selectedBrands: ['music_876', 'music_sidem'],
      selectedTypes: [],
      selectedIdols: [],
      selectedUnits: [],
    });
    expect(out).toHaveLength(2);
    expect(new Set(out.map((s) => s.brand))).toEqual(
      new Set(['music_876', 'music_sidem']),
    );
  });
});

describe('filterSongs — idols (OR-within)', () => {
  test('單一 idol', () => {
    const out = filterSongs(songs, {
      searchQuery: '',
      selectedBrands: [],
      selectedTypes: [],
      selectedIdols: ['idol-876-1'],
      selectedUnits: [],
    });
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe('"HELLO!"');
  });

  test('多個 idol = OR (任一命中即可)', () => {
    const out = filterSongs(songs, {
      searchQuery: '',
      selectedBrands: [],
      selectedTypes: [],
      selectedIdols: ['idol-876-1', 'idol-315-1'],
      selectedUnits: [],
    });
    expect(out).toHaveLength(2);
  });
});

describe('filterSongs — units (OR-within)', () => {
  test('單一 unit', () => {
    const out = filterSongs(songs, {
      searchQuery: '',
      selectedBrands: [],
      selectedTypes: [],
      selectedIdols: [],
      selectedUnits: ['unit-cg-tp'],
    });
    expect(out).toHaveLength(3); // 三首 Triad Primus
  });

  test('歌曲可有多個 unit,任一被選即命中', () => {
    const out = filterSongs(songs, {
      searchQuery: '',
      selectedBrands: [],
      selectedTypes: [],
      selectedIdols: [],
      selectedUnits: ['unit-cg-ng'], // new generations
    });
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe('できたてEvo! Revo! Generation!');
  });
});

describe('filterSongs — types (substring match)', () => {
  test('type substring 命中 — "drama" 命中 "[\\"unit\\",\\"drama\\"]"', () => {
    const out = filterSongs(songs, {
      searchQuery: '',
      selectedBrands: [],
      selectedTypes: ['drama'],
      selectedIdols: [],
      selectedUnits: [],
    });
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe('STORY');
  });

  test('type OR — "unit" 涵蓋多首', () => {
    const out = filterSongs(songs, {
      searchQuery: '',
      selectedBrands: [],
      selectedTypes: ['unit'],
      selectedIdols: [],
      selectedUnits: [],
    });
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((s) => s.musicType.toLowerCase().includes('unit'))).toBe(true);
  });
});

describe('filterSongs — AND-across filters', () => {
  test('brand=music_cg AND unit=new generations → 1 首', () => {
    const out = filterSongs(songs, {
      searchQuery: '',
      selectedBrands: ['music_cg'],
      selectedTypes: [],
      selectedIdols: [],
      selectedUnits: ['unit-cg-ng'],
    });
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe('できたてEvo! Revo! Generation!');
  });

  test('brand=music_sidem AND idol=島村卯月 → 0 首(跨 brand 不命中)', () => {
    const out = filterSongs(songs, {
      searchQuery: '',
      selectedBrands: ['music_sidem'],
      selectedTypes: [],
      selectedIdols: ['idol-cg-1'],
      selectedUnits: [],
    });
    expect(out).toHaveLength(0);
  });
});

describe('filterSongs — keyword search', () => {
  test('搜歌名', () => {
    const out = filterSongs(songs, {
      searchQuery: 'Trinity',
      selectedBrands: [],
      selectedTypes: [],
      selectedIdols: [],
      selectedUnits: [],
    });
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe('Trinity Field');
  });

  test('搜偶像名(中文)', () => {
    const out = filterSongs(songs, {
      searchQuery: '島村',
      selectedBrands: [],
      selectedTypes: [],
      selectedIdols: [],
      selectedUnits: [],
    });
    expect(out).toHaveLength(3); // 島村卯月在三首裡
  });

  test('搜 CV 名', () => {
    const out = filterSongs(songs, {
      searchQuery: '若林直美',
      selectedBrands: [],
      selectedTypes: [],
      selectedIdols: [],
      selectedUnits: [],
    });
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe('"HELLO!"');
  });

  test('搜 unit 名', () => {
    const out = filterSongs(songs, {
      searchQuery: 'DRAMATIC',
      selectedBrands: [],
      selectedTypes: [],
      selectedIdols: [],
      selectedUnits: [],
    });
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe('STORY');
  });

  test('關鍵字搜尋會「鬆綁」brand 限制(全域搜尋)', () => {
    // brand 是 music_cg,但搜 sidem 的 unit 名 — 仍應命中
    const out = filterSongs(songs, {
      searchQuery: 'DRAMATIC',
      selectedBrands: ['music_cg'], // 跟結果 brand 不符,但因有 query 應鬆綁
      selectedTypes: [],
      selectedIdols: [],
      selectedUnits: [],
    });
    expect(out).toHaveLength(1);
    expect(out[0].brand).toBe('music_sidem');
  });

  test('關鍵字不命中 → 0', () => {
    const out = filterSongs(songs, {
      searchQuery: 'this-string-does-not-exist',
      selectedBrands: [],
      selectedTypes: [],
      selectedIdols: [],
      selectedUnits: [],
    });
    expect(out).toHaveLength(0);
  });
});

describe('filterSongs — 邊界情境', () => {
  test('song 沒有 members / units 也不會炸', () => {
    const sparse: FilterableSong[] = [
      { brand: 'music_cg', title: 'lonely song', musicType: '["solo"]' },
    ];
    const out = filterSongs(sparse, {
      searchQuery: '',
      selectedBrands: [],
      selectedTypes: [],
      selectedIdols: [],
      selectedUnits: [],
    });
    expect(out).toHaveLength(1);
  });

  test('member 沒有 id 不會誤命中 idol filter', () => {
    const sparse: FilterableSong[] = [
      {
        brand: 'music_cg',
        title: 'no-id member',
        musicType: '["solo"]',
        members: [{ name: '島村卯月', cvName: '大橋彩香' }], // 沒 id
      },
    ];
    const out = filterSongs(sparse, {
      searchQuery: '',
      selectedBrands: [],
      selectedTypes: [],
      selectedIdols: ['idol-cg-1'],
      selectedUnits: [],
    });
    expect(out).toHaveLength(0); // 沒 id 不算
  });
});
