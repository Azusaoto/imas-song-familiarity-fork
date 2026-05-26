'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BrandIcon } from './BrandIcon';
import { getBrandColor, getBrandShortName } from '@/lib/themeUtils';
import { brandToProduction, shouldFilterByProduction, BRAND_VALUES } from '@/lib/brandMap';

export interface PickerUnit {
  id: string;
  name: string;
  kana: string | null;
  production: string | null; // 可能是 'mixed' (跨 IP)
  memberCount: number;
}

interface Props {
  /** 全部 unit 列表(沒被上層 brand 篩選過的原始集合) */
  allUnits: PickerUnit[];
  /** 已選 unit id */
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  className?: string;
  /** 上層 brand 篩選;非空 → modal 鎖定該篩選 */
  selectedBrands?: string[];
}

/**
 * 組合選擇器 — 跟 IdolPickerModal 同一個 modal 模式。
 * 差別:沒有 cvName、有 memberCount;production === 'mixed' 視為跨 IP 永遠合法。
 */
export default function UnitPickerModal({
  allUnits,
  value,
  onChange,
  placeholder,
  className,
  selectedBrands = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Set<string>>(new Set(value));
  const [query, setQuery] = useState('');
  const [modalBrands, setModalBrands] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setDraft(new Set(value));
      setQuery('');
      setModalBrands([]);
    }
  }, [open, value.join(',')]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const upstreamBrandActive = selectedBrands.length > 0;

  const effectiveBrands = upstreamBrandActive ? selectedBrands : modalBrands;
  const allowedProductions = useMemo<Set<string> | null>(() => {
    if (effectiveBrands.length === 0) return null;
    const acc = new Set<string>();
    for (const b of effectiveBrands) {
      if (!shouldFilterByProduction(b)) return null;
      for (const p of brandToProduction[b]) acc.add(p);
    }
    return acc;
  }, [effectiveBrands.join(',')]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allUnits.filter((u) => {
      // brand 篩選 — 'mixed' (跨 IP) 永遠合法
      if (allowedProductions !== null) {
        if (u.production !== 'mixed') {
          if (!u.production || !allowedProductions.has(u.production)) return false;
        }
      }
      if (q.length === 0) return true;
      if (u.name.toLowerCase().includes(q)) return true;
      if (u.kana && u.kana.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [allUnits, allowedProductions, query]);

  const localBrandOptions = useMemo<readonly string[]>(() => {
    const presentProds = new Set(allUnits.map((u) => u.production).filter(Boolean));
    return BRAND_VALUES.filter((b) => {
      const prods = brandToProduction[b] || [];
      return prods.some((p) => presentProds.has(p));
    });
  }, [allUnits]);

  function toggle(id: string) {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleModalBrand(b: string) {
    setModalBrands((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b],
    );
  }

  function handleConfirm() {
    onChange(Array.from(draft));
    setOpen(false);
  }

  function clearAllSelected(e?: React.MouseEvent) {
    e?.stopPropagation();
    onChange([]);
  }

  const triggerLabel = useMemo(() => {
    if (value.length === 0) return null;
    if (value.length <= 2) {
      const map = new Map(allUnits.map((u) => [u.id, u.name]));
      return value.map((id) => map.get(id) ?? '(已移除)').join('、');
    }
    return `已選 ${value.length} 組`;
  }, [value, allUnits]);

  return (
    <>
      <div className={`multiselect ${className ?? ''}`}>
        <button
          type="button"
          className="multiselect-trigger form-input"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          data-testid="unit-picker-trigger"
        >
          <span className="multiselect-trigger-label">
            {triggerLabel ?? (
              <span style={{ color: 'var(--text-muted, #888)' }}>{placeholder}</span>
            )}
          </span>
          {value.length > 0 && (
            <span
              role="button"
              aria-label="清除所有選擇"
              tabIndex={0}
              onClick={clearAllSelected}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') clearAllSelected();
              }}
              className="multiselect-clear"
              title="清除"
            >
              ×
            </span>
          )}
        </button>
      </div>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div
            className="modal-content idol-picker-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="unit-picker-title"
            style={{ maxWidth: '640px', width: '100%' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <h2 id="unit-picker-title" style={{ margin: 0, fontSize: '18px' }}>
                選擇組合
              </h2>
              {draft.size > 0 && (
                <button
                  type="button"
                  onClick={() => setDraft(new Set())}
                  data-testid="unit-picker-clear"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-color)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '2px 6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  清除已選 ({draft.size})
                </button>
              )}
            </div>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                margin: '6px 0 14px',
              }}
            >
              點列表多選；按完成套用篩選。
            </p>

            {/* brand chip row — always show */}
            {localBrandOptions.length > 0 && (
              <div
                className={`idol-picker-brand-row ${upstreamBrandActive ? 'is-locked' : ''}`}
                data-testid="unit-picker-brand-row"
              >
                <span className="idol-picker-brand-label">
                  {upstreamBrandActive ? '已套用團體' : '先縮窄到'}
                </span>
                {localBrandOptions.map((b) => {
                  const active = upstreamBrandActive
                    ? selectedBrands.includes(b)
                    : modalBrands.includes(b);
                  const color = getBrandColor(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => !upstreamBrandActive && toggleModalBrand(b)}
                      disabled={upstreamBrandActive}
                      aria-pressed={active}
                      data-testid={`unit-picker-brand-${b}`}
                      title={upstreamBrandActive ? '請從上方的 brand 篩選調整' : undefined}
                      className={`idol-picker-brand-chip ${active ? 'is-active' : ''} ${upstreamBrandActive ? 'is-locked' : ''}`}
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
                {!upstreamBrandActive && modalBrands.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setModalBrands([])}
                    className="idol-picker-brand-clear"
                  >
                    清除
                  </button>
                )}
              </div>
            )}

            <input
              type="text"
              className="form-input"
              placeholder="搜尋組合名 / 假名 (空白列出全部)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-testid="unit-picker-search"
            />

            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                margin: '10px 2px',
              }}
            >
              共 {filtered.length} 組{value.length > 0 && ` · 已選 ${draft.size}`}
            </div>

            <div
              className="idol-picker-list"
              style={{
                maxHeight: '50vh',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '4px 0',
              }}
            >
              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                  }}
                >
                  沒有符合的組合。
                </div>
              ) : (
                filtered.map((u) => {
                  const checked = draft.has(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      role="option"
                      aria-selected={checked}
                      className={`idol-picker-row ${checked ? 'is-selected' : ''}`}
                      data-testid={`unit-picker-${u.id}`}
                      onClick={() => toggle(u.id)}
                    >
                      <span className="idol-picker-name">{u.name}</span>
                      {u.memberCount > 0 && (
                        <span className="idol-picker-cv">({u.memberCount} 人)</span>
                      )}
                      {u.production === 'mixed' && (
                        <span
                          className="idol-picker-cv"
                          style={{ color: 'var(--accent-color)' }}
                        >
                          跨 IP
                        </span>
                      )}
                      {checked && (
                        <span className="idol-picker-check" aria-hidden="true">✓</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setOpen(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirm}
                data-testid="unit-picker-confirm"
              >
                完成 ({draft.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
