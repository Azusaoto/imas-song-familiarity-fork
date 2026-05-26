'use client';

import React, { useEffect, useMemo, useState } from 'react';

export interface PickerUser {
  nickname: string;
  shareCode: string;
  themeColor: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** 已選中的 shareCode 集合 */
  selectedShareCodes: string[];
  /** 點「完成」時回傳完整的下一輪選取 */
  onConfirm: (next: PickerUser[]) => void;
  /** 排除自己的 shareCode（登入時傳入；未登入傳 undefined） */
  selfShareCode?: string;
}

/**
 * 公開使用者多選器 — 跳 modal、搜尋框 + checkbox list。
 * 排除自己的 shareCode（自己在外層獨立顯示，不放在列表裡讓人選自己）。
 */
export default function UserPickerModal({
  open,
  onClose,
  selectedShareCodes,
  onConfirm,
  selfShareCode,
}: Props) {
  const [allUsers, setAllUsers] = useState<PickerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  // Modal 內部選取：先複製外部當前狀態，按完成才回寫
  const [picked, setPicked] = useState<Set<string>>(new Set(selectedShareCodes));

  // 開啟時：拉一次全部公開使用者；同步外部已選狀態
  useEffect(() => {
    if (!open) return;
    setPicked(new Set(selectedShareCodes));
    setQuery('');
    setLoading(true);
    setError(null);
    fetch('/api/user/search?q=')
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setAllUsers(data);
        else throw new Error('回應格式錯誤');
      })
      .catch((e) => setError(`載入失敗：${e.message ?? e}`))
      .finally(() => setLoading(false));
    // selectedShareCodes 變動時也要 reset；用 join 當 key 比 array 引用穩
  }, [open, selectedShareCodes.join(',')]);

  // Esc 關掉
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // 排除自己 + 套搜尋
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allUsers
      .filter((u) => !selfShareCode || u.shareCode !== selfShareCode)
      .filter((u) => q.length === 0 || u.nickname.toLowerCase().includes(q));
  }, [allUsers, selfShareCode, query]);

  function toggle(u: PickerUser) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(u.shareCode)) next.delete(u.shareCode);
      else next.add(u.shareCode);
      return next;
    });
  }

  function handleConfirm() {
    const picks = allUsers.filter((u) => picked.has(u.shareCode));
    onConfirm(picks);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content user-picker-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="user-picker-title"
        style={{ maxWidth: '520px', width: '100%' }}
      >
        <h2 id="user-picker-title" style={{ margin: 0, fontSize: '18px' }}>
          選擇要比對的使用者
        </h2>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            margin: '6px 0 16px',
          }}
        >
          列出所有公開歌單的使用者。可多選；搜尋框輸入 P 名過濾。
        </p>

        <input
          type="text"
          className="form-input"
          placeholder="搜尋 P 名 (空白列出全部)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          data-testid="user-picker-search"
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            margin: '10px 2px',
          }}
        >
          <span>
            {loading ? '載入中…' : `共 ${filtered.length} 人 · 已選 ${picked.size} 人`}
          </span>
          {picked.size > 0 && (
            <button
              type="button"
              className="multiselect-link"
              onClick={() => setPicked(new Set())}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-color)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              清除已選
            </button>
          )}
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: '8px 12px',
              marginBottom: '12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              color: '#b91c1c',
              fontSize: '12px',
            }}
          >
            {error}
          </div>
        )}

        <div
          className="user-picker-list"
          style={{
            maxHeight: '360px',
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '4px 0',
          }}
        >
          {filtered.length === 0 && !loading ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px',
              }}
            >
              {query.trim() ? '沒有符合搜尋的使用者。' : '目前沒有任何公開使用者。'}
            </div>
          ) : (
            filtered.map((u) => {
              const checked = picked.has(u.shareCode);
              return (
                <button
                  key={u.shareCode}
                  type="button"
                  role="option"
                  aria-selected={checked}
                  className={`user-picker-row ${checked ? 'is-selected' : ''}`}
                  data-testid={`user-picker-${u.nickname}`}
                  onClick={() => toggle(u)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    border: 'none',
                    borderLeft: `3px solid ${u.themeColor}`,
                    background: checked ? 'var(--bg-base)' : 'transparent',
                    width: '100%',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    textAlign: 'left',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: u.themeColor,
                    }}
                  />
                  <span style={{ fontWeight: 500, flex: 1 }}>{u.nickname}</span>
                  {checked && (
                    <span
                      aria-hidden="true"
                      style={{ color: 'var(--accent-color)', fontWeight: 700 }}
                    >
                      ✓
                    </span>
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
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            data-testid="user-picker-confirm"
          >
            完成 ({picked.size})
          </button>
        </div>
      </div>
    </div>
  );
}
