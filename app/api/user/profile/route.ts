import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppError, handleError } from '@/lib/errors';

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
      throw new AppError('未授權的存取。', 401, 'UNAUTHORIZED');
    }

    const userId = session.user.id;

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      throw new AppError('請求內容不是合法的 JSON。', 400, 'INVALID_JSON');
    }

    const parsed = ProfileUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const details = parsed.error.issues.map((i) => ({ path: i.path, message: i.message }));
      throw new AppError(first?.message || '請求格式不正確。', 400, 'VALIDATION_ERROR', details);
    }

    const { producerIdolIds, representativeSongIds, collabSongIds } = parsed.data;

    // 強制進行陣列去重，確保萬無一失
    const uniqueProducerIdolIds = Array.from(new Set(producerIdolIds));
    const uniqueRepresentativeSongIds = Array.from(new Set(representativeSongIds));
    const uniqueCollabSongIds = Array.from(new Set(collabSongIds));

    // 使用 Transaction 確保原子性
    await prisma.$transaction([
      prisma.userProducerIdol.deleteMany({ where: { userId } }),
      prisma.userRepresentativeSong.deleteMany({ where: { userId } }),
      prisma.userCollabSong.deleteMany({ where: { userId } }),

      prisma.userProducerIdol.createMany({
        data: uniqueProducerIdolIds.map((memberId) => ({
          userId,
          memberId,
        })),
        skipDuplicates: true,
      }),
      prisma.userRepresentativeSong.createMany({
        data: uniqueRepresentativeSongIds.map((songId) => ({
          userId,
          songId,
        })),
        skipDuplicates: true,
      }),
      prisma.userCollabSong.createMany({
        data: uniqueCollabSongIds.map((songId) => ({
          userId,
          songId,
        })),
        skipDuplicates: true,
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleError(error);
  }
}
