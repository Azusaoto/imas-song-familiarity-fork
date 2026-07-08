import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { shareCodes } = await request.json();

    if (!shareCodes || !Array.isArray(shareCodes) || shareCodes.length === 0) {
      return NextResponse.json(
        { error: '請提供有效的分享碼清單。' },
        { status: 400 }
      );
    }

    // 清理與去重分享碼
    const cleanShareCodes = Array.from(new Set(shareCodes.map((s) => s.trim()).filter(Boolean)));

    if (cleanShareCodes.length < 2) {
      return NextResponse.json(
        { error: '請至少選擇兩個使用者才能進行比對。' },
        { status: 400 }
      );
    }

    // 1. 獲取所有目標使用者（依 shareCode 查詢，保護原始帳號）
    //    UI 文案標「需對方設定為公開歌單」— 這裡實際擋掉 isPublic=false
    //    使用者。例外：登入者本人的 shareCode 就算沒公開也能加進去比對
    //    (功能就是「把我自己跟朋友比」)。
    const session = await getServerSession(authOptions);
    const dbUsers = await prisma.user.findMany({
      where: {
        shareCode: { in: cleanShareCodes },
        OR: [
          { isPublic: true },
          ...(session?.user?.id ? [{ id: session.user.id }] : []),
        ],
      },
    });

    if (dbUsers.length !== cleanShareCodes.length) {
      const foundCodes = dbUsers.map((u) => u.shareCode);
      const missingCodes = cleanShareCodes.filter((c) => !foundCodes.includes(c));
      return NextResponse.json(
        { error: `找不到以下分享碼的用戶,或該使用者未開放公開歌單: ${missingCodes.join(', ')}` },
        { status: 404 }
      );
    }

    const userIds = dbUsers.map((u) => u.id);

    // 2a. 利用 PostgreSQL 原生聚合（jsonb_object_agg），將負載從 Node.js 轉移至資料庫
    // 捨棄 findMany 與 Node.js 的 for 迴圈，避免 O(N) 記憶體與網路 I/O 爆炸
    const aggregatedRatings = await prisma.$queryRaw<{ songId: string; ratings: Record<string, number> }[]>`
      SELECT 
        "songId", 
        jsonb_object_agg(U.nickname, S.familiarity) as ratings
      FROM "UserSelection" S
      JOIN "User" U ON S."userId" = U.id
      WHERE U.id::text IN (${Prisma.join(userIds)})
        AND S.familiarity IN (1, 2, 3, 4)
      GROUP BY "songId"
    `;

    // 3. 以 songId 為 key 聚合每個使用者的熟悉度（聯集）
    const ratingsBySong = new Map<string, Record<string, number>>();
    for (const row of aggregatedRatings) {
      ratingsBySong.set(row.songId, row.ratings);
    }

    // 2b. 直接回傳輕量的 { id, ratings }，捨棄完整的歌曲靜態資料
    //     由前端負責拉取全站歌曲目錄並在客戶端進行 Join，大幅縮減傳輸封包。
    const unionSongs = Array.from(ratingsBySong.entries()).map(([id, ratings]) => ({
      id,
      ratings,
    }));

    return NextResponse.json({
      users: dbUsers.map((u) => u.nickname),
      songs: unionSongs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: '比對共同歌單失敗。', details: error.message },
      { status: 500 }
    );
  }
}
