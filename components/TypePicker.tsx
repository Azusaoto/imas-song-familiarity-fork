'use client';

import React, { useEffect, useState } from 'react';

export interface TypeOption {
  id: string;
  label: string;
  hint?: string;
}

interface Props {
  options: TypeOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  className?: string;
}

/**
 * 歌曲類型選擇器 — 跟 BrandPicker 同個 modal 模式但更精簡:
 * - 沒有搜尋框(2 個選項根本不需要)
 * - 沒有 brand chip row
 * - 大卡片直接點
 */
export default function TypePicker({
  options,
  value,
  onChange,
  placeholder,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Set<string>>(new Set(value));

  useEffect(() => {
    if (open) setDraft(new Set(value));
  }, [open, value.join(',')]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const triggerLabel = (() => {
    if (value.length === 0) return null;
    const map = new Map(options.map((o) => [o.id, o.label]));
    return value.map((id) => map.get(id) ?? id).join('、');
  })();

  function toggle(id: string) {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    onChange(Array.from(draft));
    setOpen(false);
  }

  function clearAllSelected(e?: React.MouseEvent) {
    e?.stopPropagation();
    onChange([]);
  }

  return (
    <>
      <div className={`multiselect ${className ?? ''}`}>
        <button
          type="button"
          className="multiselect-trigger form-input"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          data-testid="type-picker-trigger"
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
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="type-picker-title"
            style={{ maxWidth: '440px', width: '100%' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <h2 id="type-picker-title" style={{ margin: 0, fontSize: '18px' }}>
                選擇歌曲類型
              </h2>
              {draft.size > 0 && (
                <button
                  type="button"
                  onClick={() => setDraft(new Set())}
                  data-testid="type-picker-clear"
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
                  清除已選
                </button>
              )}
            </div>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                margin: '6px 0 16px',
              }}
            >
              可多選；按完成套用篩選。
            </p>

            <div className="type-picker-grid">
              {options.map((o) => {
                const checked = draft.has(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => toggle(o.id)}
                    aria-pressed={checked}
                    data-testid={`type-picker-${o.id}`}
                    className={`type-card ${checked ? 'is-checked' : ''}`}
                  >
                    <span className="type-card-label">{o.label}</span>
                    {o.hint && <span className="type-card-hint">{o.hint}</span>}
                    {checked && (
                      <span className="type-card-check" aria-hidden="true">✓</span>
                    )}
                  </button>
                );
              })}
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
                data-testid="type-picker-confirm"
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
