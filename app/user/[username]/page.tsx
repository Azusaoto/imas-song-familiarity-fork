import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { buildThemeVars } from '@/lib/themeUtils';
import UserProfileClient from './UserProfileClient';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  const session = await getServerSession(authOptions);

  // 查詢該製作人的基本資料與選取內容
  const dbUser = await prisma.user.findUnique({
    where: { username },
    include: {
      producerIdols: {
        include: {
          member: true,
        },
      },
      representativeSongs: {
        include: {
          song: {
            include: {
              members: { include: { member: true } },
              units: { include: { unit: true } },
            },
          },
        },
      },
      collabSongs: {
        include: {
          song: {
            include: {
              members: { include: { member: true } },
              units: { include: { unit: true } },
            },
          },
        },
      },
      receivedWishes: {
        include: {
          song: true,
          senderUser: {
            select: {
              id: true,
              username: true,
              nickname: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!dbUser) {
    return notFound();
  }

  // 取得目前登入者
  const currentUser = session?.user
    ? {
      id: session.user.id,
      username: session.user.username,
      nickname: session.user.nickname,
    }
    : null;

  // 扁平化關聯欄位以傳給 Client Component
  const initialProducerIdols = dbUser.producerIdols.map((pi) => ({
    id: pi.member.id,
    name: pi.member.name,
    cvName: pi.member.cvName,
    production: pi.member.production,
    imagePath: pi.member.imagePath,
  }));

  const initialRepresentativeSongs = dbUser.representativeSongs.map((rs) => ({
    id: rs.song.id,
    title: rs.song.title,
    brand: rs.song.brand,
    musicType: rs.song.musicType,
    lyrics: rs.song.lyrics,
    composer: rs.song.composer,
    arranger: rs.song.arranger,
    lowestPitch: rs.song.lowestPitch,
    highestPitch: rs.song.highestPitch,
    youtubeIds: rs.song.youtubeIds,
    members: rs.song.members.map((m) => ({
      id: m.member.id,
      name: m.member.name,
      cvName: m.member.cvName,
    })),
    units: rs.song.units.map((su) => ({
      id: su.unit.id,
      name: su.unit.name,
    })),
  }));

  const initialCollabSongs = dbUser.collabSongs.map((cs) => ({
    id: cs.song.id,
    title: cs.song.title,
    brand: cs.song.brand,
    musicType: cs.song.musicType,
    lyrics: cs.song.lyrics,
    composer: cs.song.composer,
    arranger: cs.song.arranger,
    lowestPitch: cs.song.lowestPitch,
    highestPitch: cs.song.highestPitch,
    youtubeIds: cs.song.youtubeIds,
    members: cs.song.members.map((m) => ({
      id: m.member.id,
      name: m.member.name,
      cvName: m.member.cvName,
    })),
    units: cs.song.units.map((su) => ({
      id: su.unit.id,
      name: su.unit.name,
    })),
  }));

  const initialWishes = dbUser.receivedWishes.map((w) => ({
    id: w.id,
    createdAt: w.createdAt.toISOString(),
    isCompleted: w.isCompleted,
    song: {
      id: w.song.id,
      title: w.song.title,
      brand: w.song.brand,
      musicType: w.song.musicType,
    },
    sender: {
      id: w.senderUser.id,
      username: w.senderUser.username,
      nickname: w.senderUser.nickname,
    },
  }));

  // 查詢公開歌單數據
  const selections = await prisma.userSelection.findMany({
    where: {
      userId: dbUser.id,
      familiarity: { in: [1, 2, 3, 4] },
    },
    include: {
      song: {
        include: {
          members: { include: { member: true } },
          units: {
            include: {
              unit: { include: { _count: { select: { members: true } } } },
            },
          },
        },
      },
    },
    orderBy: { familiarity: 'asc' },
  });

  const playlistSongs = selections.map((sel) => ({
    id: sel.song.id,
    title: sel.song.title,
    brand: sel.song.brand,
    musicType: sel.song.musicType,
    lyrics: sel.song.lyrics,
    composer: sel.song.composer,
    arranger: sel.song.arranger,
    lowestPitch: sel.song.lowestPitch,
    highestPitch: sel.song.highestPitch,
    youtubeIds: sel.song.youtubeIds,
    members: sel.song.members.map((m) => ({
      id: m.member.id,
      name: m.member.name,
      cvName: m.member.cvName,
    })),
    units: sel.song.units.map((su) => ({
      id: su.unit.id,
      name: su.unit.name,
    })),
    familiarity: sel.familiarity,
  }));

  const idolMap = new Map();
  const unitMap = new Map();
  for (const sel of selections) {
    for (const m of sel.song.members) {
      if (!m.member.production) continue;
      if (!idolMap.has(m.member.id)) {
        idolMap.set(m.member.id, {
          id: m.member.id,
          name: m.member.name,
          kana: m.member.kana,
          cvName: m.member.cvName,
          production: m.member.production,
        });
      }
    }
    for (const su of sel.song.units) {
      if (!unitMap.has(su.unit.id)) {
        unitMap.set(su.unit.id, {
          id: su.unit.id,
          name: su.unit.name,
          kana: su.unit.kana,
          production: su.unit.production,
          memberCount: su.unit._count.members,
        });
      }
    }
  }

  const playlistIdols = Array.from(idolMap.values()).sort((a, b) =>
    (a.kana ?? a.name).localeCompare(b.kana ?? b.name, 'ja')
  );
  const playlistUnits = Array.from(unitMap.values()).sort((a, b) =>
    (a.kana ?? a.name).localeCompare(b.kana ?? b.name, 'ja')
  );

  return (
    <div
      style={{
        ...(buildThemeVars(dbUser.themeColor || '#92cfbb') as React.CSSProperties),
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <UserProfileClient
        profileUser={{
          id: dbUser.id,
          username: dbUser.username,
          nickname: dbUser.nickname,
          themeColor: dbUser.themeColor,
          isPublic: dbUser.isPublic,
          shareCode: dbUser.shareCode,
        }}
        currentUser={currentUser}
        initialProducerIdols={initialProducerIdols}
        initialRepresentativeSongs={initialRepresentativeSongs}
        initialCollabSongs={initialCollabSongs}
        initialWishes={initialWishes}
        playlistSongs={playlistSongs}
        playlistIdols={playlistIdols}
        playlistUnits={playlistUnits}
      />
    </div>
  );
}
