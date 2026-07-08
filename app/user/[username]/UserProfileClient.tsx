'use client';

import React, { useState, useEffect } from 'react';
import PlaylistList, { PlaylistSong, PlaylistIdol, PlaylistUnit } from '@/app/playlist/[shareCode]/PlaylistList';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { BrandIcon } from '@/components/BrandIcon';
import { getBrandColor } from '@/lib/themeUtils';
import IdolPickerModalForProfile from './IdolPickerModalForProfile';
import SongPickerModal from './SongPickerModal';
import SongDetailModal from '@/components/SongDetailModal';

interface Idol {
  id: string;
  name: string;
  cvName: string | null;
  production: string | null;
  imagePath: string | null;
}

interface Song {
  id: string;
  title: string;
  brand: string;
  musicType: string;
  lyrics: string | null;
  composer: string | null;
  arranger: string | null;
  lowestPitch: string | null;
  highestPitch: string | null;
  youtubeIds: string | null;
  members: Array<{ id?: string; name: string; cvName: string | null }>;
  units?: Array<{ id: string; name: string }>;
}

interface Wish {
  id: string;
  createdAt: string;
  isCompleted: boolean;
  song: {
    id: string;
    title: string;
    brand: string;
    musicType: string;
  };
  sender: {
    id: string;
    username: string;
    nickname: string;
  };
}

interface Props {
  profileUser: {
    id: string;
    username: string;
    nickname: string;
    themeColor: string;
    isPublic: boolean;
    shareCode: string;
  };
  currentUser: {
    id: string;
    username: string;
    nickname: string;
  } | null;
  initialProducerIdols: Idol[];
  initialRepresentativeSongs: Song[];
  initialCollabSongs: Song[];
  initialWishes: Wish[];
  playlistSongs: PlaylistSong[];
  playlistIdols: PlaylistIdol[];
  playlistUnits: PlaylistUnit[];
}

export default function UserProfileClient({
  profileUser,
  currentUser,
  initialProducerIdols,
  initialRepresentativeSongs,
  initialCollabSongs,
  initialWishes,
  playlistSongs,
  playlistIdols,
  playlistUnits,
}: Props) {
  const router = useRouter();
  const isOwner = currentUser?.id === profileUser.id;

  // 彈窗狀態
  const [showIdolModal, setShowIdolModal] = useState(false);
  const [showRepSongsModal, setShowRepSongsModal] = useState(false);
  const [showCollabSongsModal, setShowCollabSongsModal] = useState(false);
  const [showWishModal, setShowWishModal] = useState(false);
  const [selectedDetailSong, setSelectedDetailSong] = useState<Song | null>(null);

  // 儲存狀態
  const [saving, setSaving] = useState(false);

  // 個人設定彈窗與表單狀態
  const { data: session, update } = useSession();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [themeColorInput, setThemeColorInput] = useState('#92cfbb');
  const [isPublicInput, setIsPublicInput] = useState(false);
  const [isPublicPitchRangeInput, setIsPublicPitchRangeInput] = useState(false);
  const [idolColors, setIdolColors] = useState<Array<{ name: string, color: string }>>([]);
  const [colorSearchQuery, setColorSearchQuery] = useState('');
  const [showColorSuggestions, setShowColorSuggestions] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  useEffect(() => {
    if (isOwner) {
      fetch('/api/colors')
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setIdolColors(data); })
        .catch(() => { });
    }
  }, [isOwner]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');

    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nicknameInput,
          themeColor: themeColorInput,
          isPublic: isPublicInput,
          isPublicPitchRange: isPublicPitchRangeInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSettingsError(data.error || '儲存設定失敗。');
      } else {
        setSettingsSuccess('個人設定儲存成功！');
        if (update) {
          await update({
            nickname: nicknameInput,
            themeColor: themeColorInput,
            isPublic: isPublicInput,
            isPublicPitchRange: isPublicPitchRangeInput,
          });
        }
        setTimeout(() => {
          setShowSettingsModal(false);
          setSettingsSuccess('');
          router.refresh();
        }, 1000);
      }
    } catch (err) {
      setSettingsError('更新個人設定時發生錯誤。');
    }
  }

  function openSettings() {
    if (session?.user) {
      setNicknameInput(session.user.nickname || session.user.username);
      setThemeColorInput(session.user.themeColor || '#92cfbb');
      setIsPublicInput(session.user.isPublic || false);
      setIsPublicPitchRangeInput(session.user.isPublicPitchRange || false);
      setColorSearchQuery('');
      setSettingsError('');
      setSettingsSuccess('');
      setShowSettingsModal(true);
    }
  }

  // 拖曳排序與本機狀態管理
  const [producerIdols, setProducerIdols] = useState<Idol[]>(initialProducerIdols);
  const [representativeSongs, setRepresentativeSongs] = useState<Song[]>(initialRepresentativeSongs);
  const [collabSongs, setCollabSongs] = useState<Song[]>(initialCollabSongs);

  const [draggedItem, setDraggedItem] = useState<{ index: number; type: 'idol' | 'repSong' | 'collabSong' } | null>(null);

  useEffect(() => {
    setProducerIdols(initialProducerIdols);
  }, [initialProducerIdols]);

  useEffect(() => {
    setRepresentativeSongs(initialRepresentativeSongs);
  }, [initialRepresentativeSongs]);

  useEffect(() => {
    setCollabSongs(initialCollabSongs);
  }, [initialCollabSongs]);

  const handleDragStart = (e: React.DragEvent, index: number, type: 'idol' | 'repSong' | 'collabSong') => {
    if (!isOwner) return;
    setDraggedItem({ index, type });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (index: number, type: 'idol' | 'repSong' | 'collabSong') => {
    if (!draggedItem || draggedItem.type !== type || draggedItem.index === index) return;

    const sourceIndex = draggedItem.index;
    if (type === 'idol') {
      const newList = [...producerIdols];
      const [removed] = newList.splice(sourceIndex, 1);
      newList.splice(index, 0, removed);
      setProducerIdols(newList);
    } else if (type === 'repSong') {
      const newList = [...representativeSongs];
      const [removed] = newList.splice(sourceIndex, 1);
      newList.splice(index, 0, removed);
      setRepresentativeSongs(newList);
    } else if (type === 'collabSong') {
      const newList = [...collabSongs];
      const [removed] = newList.splice(sourceIndex, 1);
      newList.splice(index, 0, removed);
      setCollabSongs(newList);
    }

    setDraggedItem({ index, type });
  };

  const handleDragEnd = async () => {
    if (!draggedItem) return;
    const { type } = draggedItem;
    setDraggedItem(null);

    // 儲存重排後的順序
    if (type === 'idol') {
      await handleSaveProfile(
        producerIdols.map((i) => i.id),
        representativeSongs.map((s) => s.id),
        collabSongs.map((s) => s.id)
      );
    } else if (type === 'repSong') {
      await handleSaveProfile(
        producerIdols.map((i) => i.id),
        representativeSongs.map((s) => s.id),
        collabSongs.map((s) => s.id)
      );
    } else if (type === 'collabSong') {
      await handleSaveProfile(
        producerIdols.map((i) => i.id),
        representativeSongs.map((s) => s.id),
        collabSongs.map((s) => s.id)
      );
    }
  };

  // 儲存設定 (POST 到 API)
  async function handleSaveProfile(
    producerIdolIds: string[],
    representativeSongIds: string[],
    collabSongIds: string[]
  ) {
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producerIdolIds,
          representativeSongIds,
          collabSongIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '儲存失敗');
      }

      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      alert(`儲存失敗: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  // 發起許願
  async function handleMakeWish(songIds: string[]) {
    if (songIds.length === 0) return;
    const songId = songIds[0];
    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: profileUser.id,
          songId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '發送許願失敗');
      }

      alert('許願成功！');
      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      alert(`許願失敗: ${error.message}`);
    }
  }

  // 刪除許願
  async function handleDeleteWish(wishId: string) {
    if (!confirm('確定要刪除這筆許願訂單嗎？')) return;
    try {
      const res = await fetch(`/api/wishes?id=${wishId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '刪除許願失敗');
      }

      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      alert(`刪除失敗: ${error.message}`);
    }
  }

  // 完成或重設許願狀態
  async function handleSetWishCompletion(wishId: string, isCompleted: boolean) {
    try {
      const res = await fetch('/api/wishes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wishId, isCompleted }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '更新許願狀態失敗');
      }

      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      alert(`更新狀態失敗: ${error.message}`);
    }
  }

  const themeColor = profileUser.themeColor || '#92cfbb';

  return (
    <>
      <header>
        <div className="container header-content">
          <h1>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              IMAS Song Familiarity Hub
            </Link>
          </h1>
          <div className="auth-nav">
            <Link href="/" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              返回首頁
            </Link>
            <Link href="/members" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              會員列表
            </Link>
            {isOwner && (
              <>
                <button onClick={openSettings} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  個人設定
                </button>
                <a href={`/playlist/${profileUser.shareCode}`} target="_blank" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  公開歌單
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container" style={{ flex: 1, paddingTop: '32px', paddingBottom: '60px', width: '100%' }}>
        <style>{`
        .profile-banner {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-top: 6px solid ${themeColor};
          border-radius: var(--radius-md);
          padding: 28px;
          margin-bottom: 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          box-shadow: var(--shadow-sm);
        }
        .profile-title-col h2 {
          font-size: 26px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .profile-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
          gap: 24px;
          margin-bottom: 32px;
          align-items: stretch;
        }
        .profile-section-card {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 20px;
          min-height: 400px;
          min-width: 0;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
        }
        .section-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 10px;
          min-width: 0;
        }
        .section-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          min-width: 0;
        }
        .section-header-actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
          margin-left: auto;
        }
        .idol-list-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
          gap: 12px;
          overflow-y: auto;
          max-height: 450px;
          padding-right: 4px;
        }
        .idol-avatar-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
        }
        .idol-avatar-img {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--border-color);
          transition: border-color var(--transition-fast);
        }
        .idol-avatar-card:hover .idol-avatar-img {
          border-color: ${themeColor};
        }
        .idol-avatar-name {
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }
        .profile-song-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
          max-height: 450px;
          padding-right: 4px;
          flex: 1;
        }
        .profile-song-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          background-color: var(--bg-surface-hover);
        }
        .profile-song-item.is-clickable {
          cursor: pointer;
          transition: background-color var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast);
        }
        .profile-song-item.is-clickable:hover {
          background-color: var(--bg-base);
          border-color: var(--border-color-hover);
          transform: translateY(-1px);
        }
        .wish-section {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 24px;
          box-shadow: var(--shadow-sm);
        }
        .wish-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }
        .wish-card {
          background-color: var(--bg-base);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          transition: border-color var(--transition-fast);
        }
        .wish-card:hover {
          border-color: var(--border-color-hover);
        }
        @media (max-width: 960px) {
          .profile-banner {
            flex-direction: column;
            align-items: flex-start;
          }
          .profile-grid {
            grid-template-columns: 1fr;
          }
          .wish-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

        {/* Profile Header Banner */}
        <div className="profile-banner">
          <div className="profile-title-col">
            <h2>{profileUser.nickname} 的製作人檔案</h2>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              帳號: @{profileUser.username}
            </span>
            {isOwner && (
              <div style={{ fontSize: '12px', color: themeColor, fontWeight: '500', marginTop: '6px' }}>
                ✨ 這是您的個人首頁，您可以自由編輯您的擔當偶像、代表曲和歡迎合唱曲。
              </div>
            )}
          </div>

          <div>
            {isOwner ? (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {saving ? '正在儲存變更...' : ''}
              </div>
            ) : currentUser ? (
              <button
                onClick={() => setShowWishModal(true)}
                className="btn btn-primary"
                style={{ fontWeight: 'bold', minWidth: '150px' }}
              >
                🎁 我想要許願曲子
              </button>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                登入後即可在此頁面發送許願曲子。
              </div>
            )}
          </div>
        </div>

        {/* Selection Grids */}
        <div className="profile-grid">
          {/* Producer Idols */}
          <div className="profile-section-card">
            <div className="section-header" style={{ marginBottom: isOwner ? '8px' : '16px' }}>
              <h3>擔當偶像 ({producerIdols.length} / 50)</h3>
              {isOwner && (
                <div className="section-header-actions">
                  <button
                    type="button"
                    onClick={() => setShowIdolModal(true)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    編輯
                  </button>
                  {producerIdols.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('確定要清空所有的擔當偶像設定嗎？')) {
                          handleSaveProfile(
                            [],
                            representativeSongs.map((s) => s.id),
                            collabSongs.map((s) => s.id)
                          );
                        }
                      }}
                      className="btn btn-danger"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      重設
                    </button>
                  )}
                </div>
              )}
            </div>
            {isOwner && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '-4px' }}>
                💡 前三個勾選的擔當偶像將會出現在公開會員列表中 (按住拖拉即可調整排列順序)
              </div>
            )}
            {producerIdols.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                尚未設定擔當偶像。
              </div>
            ) : (
              <div className="idol-list-grid">
                {producerIdols.map((idol, index) => {
                  const color = getBrandColor(idol.production || '');
                  return (
                    <div
                      key={idol.id}
                      className="idol-avatar-card"
                      title={`${idol.name} (${idol.cvName || 'CV 無'})`}
                      draggable={isOwner}
                      onDragStart={(e) => handleDragStart(e, index, 'idol')}
                      onDragEnter={() => handleDragEnter(index, 'idol')}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      style={{
                        cursor: isOwner ? 'grab' : 'default',
                        opacity: draggedItem?.type === 'idol' && draggedItem.index === index ? 0.4 : 1,
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                      }}
                    >
                      {idol.imagePath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={idol.imagePath}
                          alt={idol.name}
                          className="idol-avatar-img"
                          style={{ borderColor: color || 'var(--border-color)' }}
                        />
                      ) : (
                        <span
                          className="idol-avatar-img"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: `${color}15` || 'var(--bg-base)',
                            borderColor: color || 'var(--border-color)',
                            fontSize: '18px',
                            fontWeight: '600',
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                          }}
                        >
                          {idol.name.charAt(0)}
                        </span>
                      )}
                      <span className="idol-avatar-name">{idol.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Representative Songs */}
          <div className="profile-section-card">
            <div className="section-header">
              <h3>代表曲 ({representativeSongs.length} / 5)</h3>
              {isOwner && (
                <div className="section-header-actions">
                  <button
                    type="button"
                    onClick={() => setShowRepSongsModal(true)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    編輯
                  </button>
                  {representativeSongs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('確定要清空所有的代表曲設定嗎？')) {
                          handleSaveProfile(
                            producerIdols.map((i) => i.id),
                            [],
                            collabSongs.map((s) => s.id)
                          );
                        }
                      }}
                      className="btn btn-danger"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      重設
                    </button>
                  )}
                </div>
              )}
            </div>
            {isOwner && representativeSongs.length > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '-4px' }}>
                💡 按住拖拉即可調整歌曲排列順序
              </div>
            )}
            {representativeSongs.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                尚未設定代表曲。
              </div>
            ) : (
              <div className="profile-song-list">
                {representativeSongs.map((song, index) => {
                  const brandColor = getBrandColor(song.brand);
                  return (
                    <div
                      key={song.id}
                      className="profile-song-item is-clickable"
                      draggable={isOwner}
                      onDragStart={(e) => handleDragStart(e, index, 'repSong')}
                      onDragEnter={() => handleDragEnter(index, 'repSong')}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => setSelectedDetailSong(song)}
                      style={{
                        cursor: 'pointer',
                        opacity: draggedItem?.type === 'repSong' && draggedItem.index === index ? 0.4 : 1,
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                      }}
                      title="點擊查看歌曲詳細資料與試聽"
                    >
                      <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>
                        <BrandIcon brand={song.brand} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: '600', fontSize: '13px', color: brandColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={song.title}>
                          {song.title}
                        </span>
                      </div>
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)', flexShrink: 0 }} aria-hidden="true">
                        ▶
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Welcome Collab Songs */}
          <div className="profile-section-card">
            <div className="section-header">
              <h3>歡迎合唱 ({collabSongs.length} / 50)</h3>
              {isOwner && (
                <div className="section-header-actions">
                  <button
                    type="button"
                    onClick={() => setShowCollabSongsModal(true)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    編輯
                  </button>
                  {collabSongs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('確定要清空所有的歡迎合唱曲設定嗎？')) {
                          handleSaveProfile(
                            producerIdols.map((i) => i.id),
                            representativeSongs.map((s) => s.id),
                            []
                          );
                        }
                      }}
                      className="btn btn-danger"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      重設
                    </button>
                  )}
                </div>
              )}
            </div>
            {isOwner && collabSongs.length > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '-4px' }}>
                💡 按住拖拉即可調整歌曲排列順序
              </div>
            )}
            {collabSongs.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                尚未設定歡迎合唱歌曲。
              </div>
            ) : (
              <div className="profile-song-list">
                {collabSongs.map((song, index) => {
                  const brandColor = getBrandColor(song.brand);
                  return (
                    <div
                      key={song.id}
                      className="profile-song-item is-clickable"
                      draggable={isOwner}
                      onDragStart={(e) => handleDragStart(e, index, 'collabSong')}
                      onDragEnter={() => handleDragEnter(index, 'collabSong')}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => setSelectedDetailSong(song)}
                      style={{
                        cursor: 'pointer',
                        opacity: draggedItem?.type === 'collabSong' && draggedItem.index === index ? 0.4 : 1,
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                      }}
                      title="點擊查看歌曲詳細資料與試聽"
                    >
                      <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>
                        <BrandIcon brand={song.brand} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: '600', fontSize: '13px', color: brandColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={song.title}>
                          {song.title}
                        </span>
                      </div>
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)', flexShrink: 0 }} aria-hidden="true">
                        ▶
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Wishes Section */}
        {(() => {
          const activeWishes = initialWishes.filter((w) => !w.isCompleted);
          const completedWishes = initialWishes.filter((w) => w.isCompleted);
          return (
            <>
              {/* Active Wishes Section */}
              <div className="wish-section" style={{ marginBottom: '28px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🎁 目前收到的許願訂單 ({activeWishes.length})
                </h3>
                {activeWishes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '14px' }}>
                    目前沒有收到任何許願曲子。
                  </div>
                ) : (
                  <div className="wish-list">
                    {activeWishes.map((wish) => {
                      const canDelete = isOwner || currentUser?.id === wish.sender.id;
                      return (
                        <div key={wish.id} className="wish-card">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <strong style={{ fontSize: '14px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={wish.song.title}>
                                {wish.song.title}
                              </strong>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              來自: <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{wish.sender.nickname}</span> (@{wish.sender.username})
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              許願時間: {new Date(wish.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            {isOwner && (
                              <button
                                type="button"
                                onClick={() => handleSetWishCompletion(wish.id, true)}
                                className="btn btn-primary"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  whiteSpace: 'nowrap',
                                  backgroundColor: '#10b981',
                                  borderColor: '#10b981',
                                  color: 'white',
                                }}
                              >
                                完成
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteWish(wish.id)}
                                className="btn btn-danger"
                                style={{ padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
                              >
                                刪除
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Completed Wishes Section */}
              <div className="wish-section">
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ✅ 已實現的曲子列表 ({completedWishes.length})
                </h3>
                {completedWishes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '14px' }}>
                    目前尚無已實現的曲子。
                  </div>
                ) : (
                  <div className="wish-list">
                    {completedWishes.map((wish) => {
                      const canDelete = isOwner || currentUser?.id === wish.sender.id;
                      return (
                        <div key={wish.id} className="wish-card" style={{ opacity: 0.85, borderLeft: '3px solid #10b981' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <strong
                                style={{
                                  fontSize: '14px',
                                  color: 'var(--text-secondary)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  textDecoration: 'line-through',
                                }}
                                title={wish.song.title}
                              >
                                {wish.song.title}
                              </strong>
                              <span style={{ fontSize: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#047857', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                已完成
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              來自: <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{wish.sender.nickname}</span> (@{wish.sender.username})
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              許願時間: {new Date(wish.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            {isOwner && (
                              <button
                                type="button"
                                onClick={() => handleSetWishCompletion(wish.id, false)}
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
                              >
                                重設
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteWish(wish.id)}
                                className="btn btn-danger"
                                style={{ padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
                              >
                                刪除
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          );
        })()}

        {/* Public Playlist Section */}
        <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '40px 0' }} />

        <div className="wish-section" style={{ marginTop: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎶 公開歌單 ({playlistSongs.length})
            </h3>
            {!profileUser.isPublic && isOwner && (
              <span style={{ fontSize: '11px', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px' }}>
                🔒 目前設定為非公開 (僅您自己可見)
              </span>
            )}
          </div>

          {isOwner || profileUser.isPublic ? (
            <PlaylistList songs={playlistSongs} idols={playlistIdols} units={playlistUnits} />
          ) : (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: '14px' }}>
              🔒 該使用者的歌單目前為非公開狀態。
            </div>
          )}
        </div>

        {/* IDOL PICKER MODAL (Owner) */}
        {showIdolModal && (
          <IdolPickerModalForProfile
            open={showIdolModal}
            onClose={() => setShowIdolModal(false)}
            initialIdolIds={initialProducerIdols.map((i) => i.id)}
            onConfirm={(ids) =>
              handleSaveProfile(
                ids,
                initialRepresentativeSongs.map((s) => s.id),
                initialCollabSongs.map((s) => s.id)
              )
            }
            maxSelections={50}
          />
        )}

        {/* REPRESENTATIVE SONGS PICKER MODAL (Owner) */}
        {showRepSongsModal && (
          <SongPickerModal
            open={showRepSongsModal}
            onClose={() => setShowRepSongsModal(false)}
            title="選擇代表曲 (最多 5 首)"
            initialSongIds={initialRepresentativeSongs.map((s) => s.id)}
            onConfirm={(ids) =>
              handleSaveProfile(
                initialProducerIdols.map((i) => i.id),
                ids,
                initialCollabSongs.map((s) => s.id)
              )
            }
            maxSelections={5}
          />
        )}

        {/* COLLAB SONGS PICKER MODAL (Owner) */}
        {showCollabSongsModal && (
          <SongPickerModal
            open={showCollabSongsModal}
            onClose={() => setShowCollabSongsModal(false)}
            title="選擇歡迎合唱曲 (最多 50 首)"
            initialSongIds={initialCollabSongs.map((s) => s.id)}
            onConfirm={(ids) =>
              handleSaveProfile(
                initialProducerIdols.map((i) => i.id),
                initialRepresentativeSongs.map((s) => s.id),
                ids
              )
            }
            maxSelections={50}
          />
        )}

        {/* MAKE WISH SONG PICKER MODAL (Visitor) */}
        {showWishModal && (
          <SongPickerModal
            open={showWishModal}
            onClose={() => setShowWishModal(false)}
            title={`向 ${profileUser.nickname} 許願曲子`}
            initialSongIds={[]}
            onConfirm={handleMakeWish}
            maxSelections={1}
            singleSelect={true}
          />
        )}

        {/* SONG DETAIL MODAL */}
        {selectedDetailSong && (
          <SongDetailModal
            song={selectedDetailSong}
            onClose={() => setSelectedDetailSong(null)}
          />
        )}
      </main>

      {/* 個人設定彈出視窗 */}
      {showSettingsModal && session?.user && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>個人設定</h2>
            <form onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label>使用者 P名</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>自訂主題顏色</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="color"
                    className="form-input"
                    style={{ width: '60px', height: '40px', padding: '2px', cursor: 'pointer', flexShrink: 0 }}
                    value={themeColorInput}
                    onChange={(e) => setThemeColorInput(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={themeColorInput}
                    onChange={(e) => setThemeColorInput(e.target.value)}
                    placeholder="#92cfbb"
                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    required
                    style={{ width: '100px', flexShrink: 0 }}
                  />
                  <div style={{ position: 'relative', flexGrow: 1 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="或搜尋擔當偶像 (如: 天海春香)..."
                      value={colorSearchQuery}
                      onChange={(e) => {
                        setColorSearchQuery(e.target.value);
                        setShowColorSuggestions(true);
                      }}
                      onFocus={() => setShowColorSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowColorSuggestions(false), 200)}
                    />
                    {showColorSuggestions && colorSearchQuery && (
                      <div className="autocomplete-dropdown">
                        {idolColors
                          .filter(c => c.name.toLowerCase().includes(colorSearchQuery.toLowerCase()))
                          .slice(0, 8)
                          .map(c => (
                            <div
                              key={c.name}
                              className="autocomplete-item"
                              onClick={() => {
                                setThemeColorInput(c.color);
                                setColorSearchQuery(c.name);
                                setShowColorSuggestions(false);
                              }}
                            >
                              <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: c.color, marginRight: '8px', borderRadius: '50%' }}></span>
                              {c.name} ({c.color})
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={isPublicInput}
                    onChange={(e) => setIsPublicInput(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>公開我的歌單（允許其他人在歌曲統計中看到我）</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={isPublicPitchRangeInput}
                    onChange={(e) => setIsPublicPitchRangeInput(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>公開我的音域（允許其他人在音高對照表中參考我）</span>
                </label>
              </div>
              <div className="form-group">
                <label>個人公開歌單連結 (識別碼已雜湊保護)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/playlist/${profileUser.shareCode}`}
                    style={{ background: 'var(--bg-base)', color: 'var(--text-muted)' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => {
                      const url = `${window.location.origin}/playlist/${profileUser.shareCode}`;
                      navigator.clipboard.writeText(url);
                      alert('已複製歌單網址至剪貼簿！');
                    }}
                  >
                    複製
                  </button>
                </div>
              </div>
              {settingsError && (
                <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>
                  {settingsError}
                </div>
              )}
              {settingsSuccess && (
                <div style={{ color: '#10b981', fontSize: '13px', marginTop: '8px' }}>
                  {settingsSuccess}
                </div>
              )}
              <div className="modal-actions">
                <button type="button" onClick={() => setShowSettingsModal(false)} className="btn btn-secondary">
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  儲存設定
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
