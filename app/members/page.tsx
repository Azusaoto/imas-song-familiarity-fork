import React from 'react';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import MembersListClient from './MembersListClient';

// 防禦性上限: 使用者 scale 上去前用 take 擋住 findMany 全撈 → OOM。
// 需要真正翻頁時再改成 cursor pagination + client-side load-more。
const MEMBERS_PAGE_LIMIT = 100;

export default async function MembersPage() {
  const session = await getServerSession(authOptions);

  // 載入使用者與計數
  const [users, totalUserCount, publicUserCount] = await Promise.all([
    prisma.user.findMany({
      where: {
        isPublic: true,
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        themeColor: true,
        createdAt: true,
        producerIdols: {
          select: {
            member: {
              select: {
                id: true,
                name: true,
                color: true,
                imagePath: true,
                production: true,
              },
            },
          },
        },
        receivedWishes: {
          select: {
            isCompleted: true,
          },
        },
        _count: {
          select: {
            producerIdols: true,
            representativeSongs: true,
            collabSongs: true,
            receivedWishes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: MEMBERS_PAGE_LIMIT,
    }),
    prisma.user.count(),
    prisma.user.count({ where: { isPublic: true } }),
  ]);

  const truncated = publicUserCount > MEMBERS_PAGE_LIMIT;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header>
        <div className="container header-content">
          <h1>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              IMAS Song Familiarity Hub
            </Link>
          </h1>
          <div className="auth-nav">
            <Link href="/" className="btn btn-secondary">
              返回首頁
            </Link>
          </div>
        </div>
      </header>

      <main className="container" style={{ flex: 1, paddingTop: '32px', paddingBottom: '60px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600' }}>會員列表</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
            目前共有 {totalUserCount} 位製作人加入了本站{truncated ? `,以下顯示最新加入的 ${MEMBERS_PAGE_LIMIT} 位公開使用者` : ''}。
          </p>
        </div>

        <MembersListClient initialUsers={users} currentUsername={session?.user?.username || null} />
      </main>
    </div>
  );
}
