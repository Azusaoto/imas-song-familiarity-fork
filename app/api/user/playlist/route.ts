import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppError, handleError } from '@/lib/errors';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      throw new AppError('缺少使用者識別碼。', 400, 'BAD_REQUEST');
    }

    // 查詢目標使用者是否存在及其隱私設定
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isPublic: true },
    });

    if (!targetUser) {
      throw new AppError('找不到該使用者。', 444, 'NOT_FOUND');
    }

    // 檢查存取權限：如果是本人，或者目標使用者已公開
    const session = await getServerSession(authOptions);
    const isOwner = session?.user?.id === targetUser.id;

    if (!targetUser.isPublic && !isOwner) {
      throw new AppError('此使用者的歌單未公開。', 403, 'FORBIDDEN');
    }

    // 查詢公開歌單數據
    const selections = await prisma.userSelection.findMany({
      where: {
        userId: targetUser.id,
        familiarity: { in: [1, 2, 3, 4] },
      },
      select: {
        familiarity: true,
        song: {
          select: {
            id: true,
            title: true,
            brand: true,
            musicType: true,
            lyrics: true,
            composer: true,
            arranger: true,
            lowestPitch: true,
            highestPitch: true,
            youtubeIds: true,
            members: {
              select: {
                member: {
                  select: {
                    id: true,
                    name: true,
                    kana: true,
                    cvName: true,
                    production: true,
                  },
                },
              },
            },
            units: {
              select: {
                unit: {
                  select: {
                    id: true,
                    name: true,
                    kana: true,
                    production: true,
                    members: {
                      select: {
                        memberId: true,
                      },
                    },
                  },
                },
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
            memberCount: su.unit.members.length,
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

    return NextResponse.json({
      playlistSongs,
      playlistIdols,
      playlistUnits,
    });
  } catch (error: unknown) {
    return handleError(error);
  }
}
