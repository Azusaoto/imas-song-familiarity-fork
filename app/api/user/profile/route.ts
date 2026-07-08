import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Fail-fast schema: 進 Prisma 前擋掉畸形 payload,避免無謂消耗 pool
const UuidArray = (max: number, label: string) =>
  z
    .array(z.string().uuid({ message: `${label} 內含非法識別碼。` }))
    .max(max, { message: `${label}最多只能選擇 ${max} 筆。` })
    .refine((arr) => new Set(arr).size === arr.length, {
      message: `${label}內含重複項目。`,
    });

const ProfileUpdateSchema = z.object({
  producerIdolIds: UuidArray(50, '擔當偶像'),
  representativeSongIds: UuidArray(5, '代表曲'),
  collabSongIds: UuidArray(50, '歡迎合唱曲'),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: '未授權的存取。' }, { status: 401 });
    }

    const userId = session.user.id;

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: '請求內容不是合法的 JSON。' }, { status: 400 });
    }

    const parsed = ProfileUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: first?.message || '請求格式不正確。',
          details: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
        },
        { status: 400 }
      );
    }

    const { producerIdolIds, representativeSongIds, collabSongIds } = parsed.data;

    // 使用 Transaction 確保原子性
    await prisma.$transaction([
      prisma.userProducerIdol.deleteMany({ where: { userId } }),
      prisma.userRepresentativeSong.deleteMany({ where: { userId } }),
      prisma.userCollabSong.deleteMany({ where: { userId } }),

      prisma.userProducerIdol.createMany({
        data: producerIdolIds.map((memberId) => ({
          userId,
          memberId,
        })),
      }),
      prisma.userRepresentativeSong.createMany({
        data: representativeSongIds.map((songId) => ({
          userId,
          songId,
        })),
      }),
      prisma.userCollabSong.createMany({
        data: collabSongIds.map((songId) => ({
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
