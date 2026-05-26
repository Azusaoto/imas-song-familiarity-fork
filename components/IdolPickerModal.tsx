'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BrandIcon } from './BrandIcon';
import { getBrandColor, getBrandShortName } from '@/lib/themeUtils';
import { brandToProduction, shouldFilterByProduction, BRAND_VALUES } from '@/lib/brandMap';

export interface PickerIdol {
  id: string;
  name: string;
  kana: string | null;
  cvName: string | null;
  production: string | null;
  imagePath?: string | null;
}

interface Props {
  /** 全部偶像列表（沒被上層 brand 篩選過的原始集合） */
  allIdols: PickerIdol[];
  /** 已選中的偶像 id */
  value: string[];
  onChange: (next: string[]) => void;
  /** Trigger button 文字 */
  placeholder: string;
  /** 額外 className 對齊欄寬 */
  className?: string;
  /**
   * 上層已套用的 brand 篩選；若非空 → modal 套用這個篩選且不顯示臨時 brand chip
   * 若空 → 顯示臨時 brand chip 讓使用者在 modal 內縮窄列表
   */
  selectedBrands?: string[];
}

/**
 * 偶像選擇器 — 點 trigger 跳 modal,內含搜尋框 + (條件式)臨時 brand chip。
 * 搜尋框不 autoFocus,避免手機跳鍵盤。
 */
export default function IdolPickerModal({
  allIdols,
  value,
  onChange,
  placeholder,
  className,
  selectedBrands = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Set<string>>(new Set(value));
  const [query, setQuery] = useState('');
  // 臨時 brand 篩選(僅 modal 內有效)。只有當上層沒選 brand 時才用得到。
  const [modalBrands, setModalBrands] = useState<string[]>([]);

  // 開啟時同步外部值
  useEffect(() => {
    if (open) {
      setDraft(new Set(value));
      setQuery('');
      setModalBrands([]);
    }
  }, [open, value.join(',')]);

  // Esc 關掉
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // 上層 brand 是否已套用 → 決定 modal 內要不要顯示臨時 chip
  const upstreamBrandActive = selectedBrands.length > 0;

  // 算出 modal 套用的 brand → production 集合
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

  // 套 brand + 搜尋過濾
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allIdols.filter((i) => {
      // brand 篩選
      if (allowedProductions !== null) {
        if (!i.production || !allowedProductions.has(i.production)) return false;
      }
      // 搜尋(name / cvName / kana)
      if (q.length === 0) return true;
      if (i.name.toLowerCase().includes(q)) return true;
      if (i.cvName && i.cvName.toLowerCase().includes(q)) return true;
      if (i.kana && i.kana.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [allIdols, allowedProductions, query]);

  // 「modal 內可顯示的 brand」 — 只列實際有偶像歸屬的 brand,避免空 chip
  // 不管上層有沒有選都要算出來;上層選了就顯示為 locked,讓使用者看到當前在篩什麼
  const localBrandOptions = useMemo<readonly string[]>(() => {
    const presentProds = new Set(allIdols.map((i) => i.production).filter(Boolean));
    return BRAND_VALUES.filter((b) => {
      const prods = brandToProduction[b] || [];
      return prods.some((p) => presentProds.has(p));
    });
  }, [allIdols]);

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

  // Trigger 顯示文字
  const triggerLabel = useMemo(() => {
    if (value.length === 0) return null;
    if (value.length <= 2) {
      const map = new Map(allIdols.map((i) => [i.id, i.name]));
      return value.map((id) => map.get(id) ?? '(已移除)').join('、');
    }
    return `已選 ${value.length} 人`;
  }, [value, allIdols]);

  return (
    <>
      <div className={`multiselect ${className ?? ''}`}>
        <button
          type="button"
          className="multiselect-trigger form-input"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          data-testid="idol-picker-trigger"
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
            aria-labelledby="idol-picker-title"
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
              <h2 id="idol-picker-title" style={{ margin: 0, fontSize: '18px' }}>
                選擇偶像
              </h2>
              {draft.size > 0 && (
                <button
                  type="button"
                  onClick={() => setDraft(new Set())}
                  data-testid="idol-picker-clear"
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

            {/* brand chip row — always show,上層已選時 chip 預 active + disabled,讓使用者看見當前 filter */}
            {localBrandOptions.length > 0 && (
              <div
                className={`idol-picker-brand-row ${upstreamBrandActive ? 'is-locked' : ''}`}
                data-testid="idol-picker-brand-row"
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
                      data-testid={`idol-picker-brand-${b}`}
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

            {/* 搜尋框 — 故意不 autoFocus,避免手機跳鍵盤 */}
            <input
              type="text"
              className="form-input"
              placeholder="搜尋名 / CV / 假名 (空白列出全部)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-testid="idol-picker-search"
            />

            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                margin: '10px 2px',
              }}
            >
              共 {filtered.length} 人{value.length > 0 && ` · 已選 ${draft.size}`}
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
                  沒有符合的偶像。
                </div>
              ) : (
                filtered.map((i) => {
                  const checked = draft.has(i.id);
                  return (
                    <button
                      key={i.id}
                      type="button"
                      role="option"
                      aria-selected={checked}
                      className={`idol-picker-row ${checked ? 'is-selected' : ''}`}
                      data-testid={`idol-picker-${i.id}`}
                      onClick={() => toggle(i.id)}
                    >
                      <span className="idol-picker-avatar" aria-hidden="true">
                        {i.imagePath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={i.imagePath}
                            alt=""
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <span className="idol-picker-avatar-placeholder">
                            {i.name.charAt(0)}
                          </span>
                        )}
                      </span>
                      <span className="idol-picker-name">{i.name}</span>
                      {i.cvName && (
                        <span className="idol-picker-cv">({i.cvName})</span>
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
                data-testid="idol-picker-confirm"
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
