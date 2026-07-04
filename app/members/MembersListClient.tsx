'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

interface MemberUser {
  id: string;
  username: string;
  nickname: string;
  themeColor: string;
  createdAt: string | Date | number;
  producerIdols: {
    member: {
      id: string;
      name: string;
      color: string | null;
      imagePath: string | null;
      production: string | null;
    };
  }[];
  receivedWishes: {
    isCompleted: boolean;
  }[];
  _count: {
    producerIdols: number;
    representativeSongs: number;
    collabSongs: number;
    receivedWishes: number;
  };
}

interface Props {
  initialUsers: MemberUser[];
  currentUsername: string | null;
}

const getFirstThreeIdols = (user: MemberUser) => {
  if (!user.producerIdols || user.producerIdols.length === 0) return [];
  return user.producerIdols.slice(0, 3).map((pi) => pi.member);
};

const getIdolColor = (member: { color: string | null; production: string | null }) => {
  if (member.color) return member.color;
  switch (member.production) {
    case 'cg': return '#2681C8';
    case '765': return '#F34F6D';
    case 'sc':
    case '283': return '#8DBBFF';
    case '315': return '#0FBE94';
    case 'gakuen':
    case 'hatsuboshi': return '#F39800';
    case '876': return '#656A75';
    default: return '#94a3b8';
  }
};

export default function MembersListClient({ initialUsers, currentUsername }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return initialUsers;
    return initialUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.nickname.toLowerCase().includes(q)
    );
  }, [initialUsers, searchQuery]);

  return (
    <div>
      <div style={{ marginBottom: '24px', maxWidth: '480px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="搜尋會員帳號或暱稱..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
        }}>
          沒有找到符合的製作人。
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}>
          {filteredUsers.map((user) => {
            const isSelf = user.username === currentUsername;
            const cardThemeColor = user.themeColor || '#92cfbb';
            const chosenIdols = getFirstThreeIdols(user);
            return (
              <div
                key={user.id}
                className="card-el"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `4px solid ${cardThemeColor}`,
                  position: 'relative',
                  padding: '20px',
                }}
              >
                {chosenIdols.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    {chosenIdols.map((idol) => {
                      const idolColor = getIdolColor(idol);
                      return (
                        <div
                          key={idol.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none',
                          }}
                          title={`擔當偶像: ${idol.name}`}
                        >
                          {idol.imagePath ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={idol.imagePath}
                              alt={idol.name}
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: `2px solid ${idolColor || 'var(--border-color)'}`,
                                boxShadow: 'var(--shadow-sm)',
                                backgroundColor: 'var(--bg-surface)',
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: idolColor ? `${idolColor}20` : 'var(--bg-base)',
                                borderColor: idolColor || 'var(--border-color)',
                                border: '2px solid',
                                fontSize: '12px',
                                fontWeight: '600',
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                color: idolColor || 'var(--text-primary)',
                                boxShadow: 'var(--shadow-sm)',
                              }}
                            >
                              {idol.name.charAt(0)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', paddingRight: chosenIdols.length > 0 ? '100px' : '0px' }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      margin: 0,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {user.nickname}
                    </h3>
                    {isSelf && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        backgroundColor: cardThemeColor,
                        color: '#1e293b',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-full)',
                        whiteSpace: 'nowrap',
                      }}>
                        我自己
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    marginBottom: '16px',
                    paddingRight: chosenIdols.length > 0 ? '100px' : '0px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    @{user.username}
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    marginBottom: '20px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>擔當偶像</span>
                      <strong>{user._count.producerIdols} 位</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>收到許願</span>
                      <strong>{user.receivedWishes.filter((w) => !w.isCompleted).length} 首</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>完成許願</span>
                      <strong>{user.receivedWishes.filter((w) => w.isCompleted).length} 首</strong>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/user/${user.username}`}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    fontSize: '13px',
                    textDecoration: 'none',
                    textAlign: 'center',
                    border: `1px solid ${cardThemeColor}`,
                    color: cardThemeColor,
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    const target = e.currentTarget;
                    target.style.backgroundColor = `${cardThemeColor}15`;
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget;
                    target.style.backgroundColor = 'transparent';
                  }}
                >
                  查看檔案
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
