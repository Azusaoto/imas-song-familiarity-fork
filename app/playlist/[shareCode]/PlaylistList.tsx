'use client';

import React, { useState, useMemo } from 'react';
import MemberToggle from '@/components/MemberToggle';
import MultiSelect, { MultiSelectOption } from '@/components/MultiSelect';
import { BrandIcon } from '@/components/BrandIcon';
import { getBrandColor, getBrandDisplayName, getAccentTextColor } from '@/lib/themeUtils';
import { brandToProduction, shouldFilterByProduction } from '@/lib/brandMap';
import { filterSongs } from '@/lib/filterSongs';

export interface PlaylistSong {
  id: string;
  title: string;
  brand: string;
  musicType: string;
  lyrics: string | null;
  composer: string | null;
  arranger: string | null;
  lowestPitch: string | null;
  highestPitch: string | null;
  members: Array<{ id?: string; name: string; cvName: string | null }>;
  units: Array<{ id: string; name: string }>;
  familiarity: number; // 1-4
}

export interface PlaylistIdol {
  id: string;
  name: string;
  kana: string | null;
  cvName: string | null;
  production: string | null;
}

export interface PlaylistUnit {
  id: string;
  name: string;
  kana: string | null;
  production: string | null;
  memberCount: number;
}

interface Props {
  songs: PlaylistSong[];
  idols: PlaylistIdol[];
  units: PlaylistUnit[];
}

const FAMILIARITY_LABEL: Record<number, string> = {
  1: '會唱',
  2: '常聽/只聽',
  3: '有聽過',
  4: '不太記得',
};

const BRAND_VALUES = [
  'music_ml',
  'music_cg',
  'music_shiny',
  'music_as',
  'music_876',
  'music_sidem',
  'music_gakuen',
  'music_godo',
  'music_cover',
  'music_remix',
] as const;

export default function PlaylistList({ songs, idols, units }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedIdols, setSelectedIdols] = useState<string[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  // 公開歌單裡 familiarity 只會是 1-4(0 不會寫入 DB)，所以這裡也只開 4 個選項
  const [selectedFamiliarities, setSelectedFamiliarities] = useState<number[]>([]);

  const allowedProductions = useMemo<Set<string> | null>(() => {
    if (selectedBrands.length === 0) return null;
    const acc = new Set<string>();
    for (const b of selectedBrands) {
      if (!shouldFilterByProduction(b)) return null;
      for (const p of brandToProduction[b]) acc.add(p);
    }
    return acc;
  }, [selectedBrands]);

  const idolOptions = useMemo<MultiSelectOption[]>(() => {
    const filtered =
      allowedProductions === null
        ? idols
        : idols.filter((i) => i.production && allowedProductions.has(i.production));
    return filtered.map((i) => ({
      id: i.id,
      label: i.name,
      sublabel: i.cvName ? `(${i.cvName})` : undefined,
      searchAlias: [i.kana, i.cvName].filter(Boolean).join(' '),
    }));
  }, [idols, allowedProductions]);

  const unitOptions = useMemo<MultiSelectOption[]>(() => {
    const filtered =
      allowedProductions === null
        ? units
        : units.filter(
            (u) =>
              u.production === 'mixed' ||
              (u.production && allowedProductions.has(u.production)),
          );
    return filtered.map((u) => ({
      id: u.id,
      label: u.name,
      sublabel: u.memberCount > 0 ? `(${u.memberCount}人)` : undefined,
      searchAlias: u.kana ?? undefined,
    }));
  }, [units, allowedProductions]);

  const brandOptions = useMemo<MultiSelectOption[]>(() => {
    // 只列實際出現在這份歌單裡的 brand，下拉才不會有一堆空選項
    const present = new Set(songs.map((s) => s.brand));
    return BRAND_VALUES.filter((b) => present.has(b)).map((b) => ({
      id: b,
      label: getBrandDisplayName(b),
    }));
  }, [songs]);

  const typeOptions = useMemo<MultiSelectOption[]>(
    () => [
      { id: 'solo', label: 'Solo (單人獨唱)' },
      { id: 'unit', label: 'Unit (組合 / 合唱)' },
    ],
    [],
  );

  function handleBrandsChange(next: string[]) {
    setSelectedBrands(next);
    if (next.length === 0) return;
    const newAllowed = new Set<string>();
    let unrestricted = false;
    for (const b of next) {
      if (!shouldFilterByProduction(b)) {
        unrestricted = true;
        break;
      }
      for (const p of brandToProduction[b]) newAllowed.add(p);
    }
    if (unrestricted) return;
    setSelectedIdols((prev) =>
      prev.filter((id) => {
        const idol = idols.find((x) => x.id === id);
        return idol && idol.production && newAllowed.has(idol.production);
      }),
    );
    setSelectedUnits((prev) =>
      prev.filter((id) => {
        const u = units.find((x) => x.id === id);
        return (
          u &&
          (u.production === 'mixed' ||
            (u.production && newAllowed.has(u.production)))
        );
      }),
    );
  }

  const filteredSongs = useMemo(() => {
    const upstream = filterSongs(songs, {
      searchQuery,
      selectedBrands,
      selectedTypes,
      selectedIdols,
      selectedUnits,
    });
    if (selectedFamiliarities.length === 0) return upstream;
    const famSet = new Set(selectedFamiliarities);
    return upstream.filter((s) => famSet.has(s.familiarity));
  }, [
    songs,
    searchQuery,
    selectedBrands,
    selectedTypes,
    selectedIdols,
    selectedUnits,
    selectedFamiliarities,
  ]);

  function clearAllFilters() {
    setSearchQuery('');
    setSelectedBrands([]);
    setSelectedTypes([]);
    setSelectedIdols([]);
    setSelectedUnits([]);
    setSelectedFamiliarities([]);
  }

  const anyFilterActive =
    searchQuery.trim() !== '' ||
    selectedBrands.length > 0 ||
    selectedTypes.length > 0 ||
    selectedIdols.length > 0 ||
    selectedUnits.length > 0 ||
    selectedFamiliarities.length > 0;

  return (
    <>
      <section className="filter-panel" data-testid="filter-panel">
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            placeholder="搜尋歌名、參與成員、聲優姓名、組合名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="filter-search"
            style={{ paddingRight: searchQuery ? '36px' : undefined }}
          />
          {searchQuery && (
            <span
              role="button"
              aria-label="清除搜尋"
              onClick={() => setSearchQuery('')}
              className="multiselect-clear"
              data-testid="filter-search-clear"
            >
              ×
            </span>
          )}
        </div>
        <MultiSelect
          options={brandOptions}
          value={selectedBrands}
          onChange={handleBrandsChange}
          placeholder="所有偶像團體"
          searchPlaceholder="搜尋品牌..."
          leftIcon={
            <BrandIcon
              brand={selectedBrands[0] ?? 'all'}
              className="brand-select-icon"
            />
          }
          className="ms-brand"
        />
        <MultiSelect
          options={idolOptions}
          value={selectedIdols}
          onChange={setSelectedIdols}
          placeholder={`偶像 (${idolOptions.length})`}
          searchPlaceholder="搜尋偶像名 / CV / 假名..."
          className="ms-idol"
        />
        <MultiSelect
          options={unitOptions}
          value={selectedUnits}
          onChange={setSelectedUnits}
          placeholder={`組合 (${unitOptions.length})`}
          searchPlaceholder="搜尋組合名..."
          className="ms-unit"
        />
        <MultiSelect
          options={typeOptions}
          value={selectedTypes}
          onChange={setSelectedTypes}
          placeholder="歌曲類型"
          searchPlaceholder=""
          className="ms-type"
        />
      </section>

      <section
        className="familiarity-filter-panel"
        data-testid="familiarity-filter"
      >
        <span className="familiarity-filter-label">依熟悉度：</span>
        {[1, 2, 3, 4].map((v) => {
          const active = selectedFamiliarities.includes(v);
          return (
            <button
              key={v}
              type="button"
              className={`familiarity-btn state-${v} ${active ? 'active' : ''}`}
              data-testid={`fam-filter-${v}`}
              aria-pressed={active}
              onClick={() =>
                setSelectedFamiliarities((prev) =>
                  prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
                )
              }
            >
              {FAMILIARITY_LABEL[v]}
            </button>
          );
        })}
        {selectedFamiliarities.length > 0 && (
          <button
            type="button"
            className="btn btn-secondary familiarity-filter-clear"
            onClick={() => setSelectedFamiliarities([])}
            data-testid="fam-filter-clear"
          >
            清除
          </button>
        )}
      </section>

      <div
        style={{
          margin: '8px 0 12px',
          fontSize: '14px',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span data-testid="result-count">
          顯示 {filteredSongs.length} / {songs.length} 首歌曲
        </span>
        {anyFilterActive && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '12px', marginLeft: 'auto' }}
            onClick={clearAllFilters}
            data-testid="clear-all-filters"
          >
            清除所有篩選
          </button>
        )}
      </div>

      <section className="songs-grid">
        {filteredSongs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              color: 'var(--text-secondary)',
            }}
          >
            {anyFilterActive
              ? '沒有符合篩選條件的歌曲。'
              : '該使用者目前沒有標記任何熟悉的歌曲。'}
          </div>
        ) : (
          filteredSongs.map((song) => (
            <div key={song.id} className="song-card">
              <div className="song-info">
                <div className="song-title-row">
                  <span className="song-title">{song.title}</span>
                  <span
                    className="song-badge badge-brand"
                    style={{
                      backgroundColor: getBrandColor(song.brand),
                      color: getAccentTextColor(getBrandColor(song.brand)),
                    }}
                  >
                    {getBrandDisplayName(song.brand)}
                  </span>
                  {song.musicType.includes('solo') && (
                    <span className="song-badge badge-type">SOLO</span>
                  )}
                  {song.musicType.includes('unit') && (
                    <span className="song-badge badge-type">UNIT</span>
                  )}
                  {(song.lowestPitch || song.highestPitch) && (
                    <span className="song-badge badge-pitch">
                      音域: {song.lowestPitch || '--'} ~ {song.highestPitch || '--'}
                    </span>
                  )}
                </div>
                <div className="song-meta">
                  {song.lyrics && <span>作詞: {song.lyrics} </span>}
                  {song.composer && <span>/ 作曲: {song.composer} </span>}
                  {song.arranger && <span>/ 編曲: {song.arranger}</span>}
                </div>
                <MemberToggle members={song.members} />
              </div>

              <div>
                <span
                  className={`familiarity-btn state-${song.familiarity} active`}
                  style={{ cursor: 'default' }}
                >
                  {FAMILIARITY_LABEL[song.familiarity]}
                </span>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
