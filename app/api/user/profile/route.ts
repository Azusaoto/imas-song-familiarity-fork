import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: '未授權的存取。' }, { status: 401 });
    }

    const userId = session.user.id;
    const { producerIdolIds, representativeSongIds, collabSongIds } = await request.json();

    if (
      !Array.isArray(producerIdolIds) ||
      !Array.isArray(representativeSongIds) ||
      !Array.isArray(collabSongIds)
    ) {
      return NextResponse.json({ error: '請求格式不正確。' }, { status: 400 });
    }

    if (producerIdolIds.length > 50) {
      return NextResponse.json({ error: '擔當偶像最多只能選擇 50 位。' }, { status: 400 });
    }
    if (representativeSongIds.length > 5) {
      return NextResponse.json({ error: '代表曲最多只能選擇 5 首。' }, { status: 400 });
    }
    if (collabSongIds.length > 50) {
      return NextResponse.json({ error: '歡迎合唱曲最多只能選擇 50 首。' }, { status: 400 });
    }

    // 使用 Transaction 確保原子性
    await prisma.$transaction([
      prisma.userProducerIdol.deleteMany({ where: { userId } }),
      prisma.userRepresentativeSong.deleteMany({ where: { userId } }),
      prisma.userCollabSong.deleteMany({ where: { userId } }),

      prisma.userProducerIdol.createMany({
        data: producerIdolIds.map((memberId: string) => ({
          userId,
          memberId,
        })),
      }),
      prisma.userRepresentativeSong.createMany({
        data: representativeSongIds.map((songId: string) => ({
          userId,
          songId,
        })),
      }),
      prisma.userCollabSong.createMany({
        data: collabSongIds.map((songId: string) => ({
          userId,
          songId,
        })),
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: '更新個人檔案設定失敗。', details: err.message },
      { status: 500 }
    );
  }
}
