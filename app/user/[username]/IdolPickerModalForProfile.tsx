'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { BrandIcon } from '@/components/BrandIcon';
import { getBrandColor, getBrandShortName } from '@/lib/themeUtils';
import { BRAND_VALUES, brandToProduction, shouldFilterByProduction } from '@/lib/brandMap';

interface Props {
  open: boolean;
  onClose: () => void;
  initialIdolIds: string[];
  onConfirm: (selectedIds: string[]) => void;
  maxSelections: number;
}

interface Idol {
  id: string;
  name: string;
  cvName: string | null;
  production: string | null;
  imagePath: string | null;
}

export default function IdolPickerModalForProfile({
  open,
  onClose,
  initialIdolIds,
  onConfirm,
  maxSelections,
}: Props) {
  const [allIdols, setAllIdols] = useState<Idol[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Set<string>>(new Set(initialIdolIds));
  const [query, setQuery] = useState('');
  const [modalBrands, setModalBrands] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    fetch('/api/idols')
      .then((res) => res.json())
      .then((data) => {
        if (active && Array.isArray(data)) {
          setAllIdols(data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const effectiveBrands = modalBrands;
  const allowedProductions = useMemo(() => {
    if (effectiveBrands.length === 0) return null;
    const acc = new Set<string>();
    for (const b of effectiveBrands) {
      if (!shouldFilterByProduction(b)) return null;
      const prods = brandToProduction[b] || [];
      for (const p of prods) acc.add(p);
    }
    return acc;
  }, [effectiveBrands]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allIdols.filter((i) => {
      if (allowedProductions !== null) {
        if (!i.production || !allowedProductions.has(i.production)) return false;
      }
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        (i.cvName && i.cvName.toLowerCase().includes(q))
      );
    });
  }, [allIdols, allowedProductions, query]);

  // 找出所有當前已儲存的偶像
  const savedIdols = useMemo(() => {
    return allIdols.filter((i) => initialIdolIds.includes(i.id));
  }, [allIdols, initialIdolIds]);

  // 所有偶像排除掉已儲存的偶像
  const displayedIdols = useMemo(() => {
    const savedIds = new Set(initialIdolIds);
    return filtered.filter((i) => !savedIds.has(i.id));
  }, [filtered, initialIdolIds]);

  const localBrandOptions = useMemo(() => {
    const presentProds = new Set(allIdols.map((i) => i.production).filter(Boolean));
    return BRAND_VALUES.filter((b) => {
      const prods = brandToProduction[b] || [];
      return prods.some((p) => presentProds.has(p));
    });
  }, [allIdols]);

  function toggle(id: string) {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= maxSelections) {
          alert(`最多只能選擇 ${maxSelections} 位偶像！`);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  }

  function toggleModalBrand(b: string) {
    setModalBrands((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  }

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '90%' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600' }}>選擇擔當偶像</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            已選擇 {draft.size} / {maxSelections}
          </span>
        </div>

        {/* Brand chips filter */}
        {localBrandOptions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>團體篩選：</span>
            {localBrandOptions.map((b) => {
              const active = modalBrands.includes(b);
              const color = getBrandColor(b);
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleModalBrand(b)}
                  className={`idol-picker-brand-chip ${active ? 'is-active' : ''}`}
                  style={
                    active
                      ? {
                        borderColor: color,
                        color,
                        backgroundColor: `${color}1a`,
                      }
                      : undefined
                  }
                >
                  <BrandIcon brand={b} className="idol-picker-brand-icon" />
                  <span>{getBrandShortName(b)}</span>
                </button>
              );
            })}
          </div>
        )}

        <input
          type="text"
          className="form-input"
          placeholder="搜尋偶像姓名或 CV..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ marginBottom: '12px' }}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>載入中...</div>
        ) : (
          <div
            className="idol-picker-list"
            style={{
              maxHeight: '40vh',
              overflowY: 'auto',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '4px 0',
            }}
          >
            {savedIdols.length === 0 && displayedIdols.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                沒有符合的偶像。
              </div>
            ) : (
              <>
                {savedIdols.length > 0 && (
                  <>
                    <div style={{ padding: '6px 16px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-base)', borderBottom: '1px solid var(--border-color)' }}>
                      📌 已儲存的資料
                    </div>
                    {savedIdols.map((i) => {
                      const checked = draft.has(i.id);
                      return (
                        <button
                          key={`saved-${i.id}`}
                          type="button"
                          className={`idol-picker-row ${checked ? 'is-selected' : ''}`}
                          onClick={() => toggle(i.id)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 16px',
                            background: checked ? 'var(--accent-glow-soft)' : 'none',
                            border: 'none',
                            borderBottom: '1px solid var(--border-color)',
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                        >
                          <span className="idol-picker-avatar" aria-hidden="true" style={{ marginRight: '12px' }}>
                            {i.imagePath ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={i.imagePath}
                                alt=""
                                loading="lazy"
                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                            ) : (
                              <span className="idol-picker-avatar-placeholder" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: 'var(--bg-base)', fontSize: '14px' }}>
                                {i.name.charAt(0)}
                              </span>
                            )}
                          </span>
                          <span className="idol-picker-name" style={{ fontWeight: '500', flex: 1 }}>{i.name}</span>
                          {i.cvName && (
                            <span className="idol-picker-cv" style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '8px' }}>
                              ({i.cvName})
                            </span>
                          )}
                          {checked && <span className="idol-picker-check" style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>✓</span>}
                        </button>
                      );
                    })}
                    <div style={{ padding: '6px 16px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-base)', borderBottom: '1px solid var(--border-color)' }}>
                      🔍 所有偶像
                    </div>
                  </>
                )}

                {displayedIdols.map((i) => {
                  const checked = draft.has(i.id);
                  return (
                    <button
                      key={i.id}
                      type="button"
                      className={`idol-picker-row ${checked ? 'is-selected' : ''}`}
                      onClick={() => toggle(i.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 16px',
                        background: 'none',
                        border: 'none',
                        borderBottom: '1px solid var(--border-color)',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <span className="idol-picker-avatar" aria-hidden="true" style={{ marginRight: '12px' }}>
                        {i.imagePath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={i.imagePath}
                            alt=""
                            loading="lazy"
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span className="idol-picker-avatar-placeholder" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: 'var(--bg-base)', fontSize: '14px' }}>
                            {i.name.charAt(0)}
                          </span>
                        )}
                      </span>
                      <span className="idol-picker-name" style={{ fontWeight: '500', flex: 1 }}>{i.name}</span>
                      {i.cvName && (
                        <span className="idol-picker-cv" style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '8px' }}>
                          ({i.cvName})
                        </span>
                      )}
                      {checked && <span className="idol-picker-check" style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>✓</span>}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onConfirm(Array.from(draft));
              onClose();
            }}
          >
            確定 ({draft.size})
          </button>
        </div>
      </div>
    </div>
  );
}
