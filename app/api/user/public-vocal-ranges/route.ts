import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const publicUsers = await prisma.user.findMany({
      where: {
        isPublicPitchRange: true,
        ...(currentUserId ? { id: { not: currentUserId } } : {})
      },
      select: { id: true, nickname: true, username: true }
    });

    const userIds = publicUsers.map(u => u.id);

    const vocalRanges = await prisma.userVocalRange.findMany({
      where: { userId: { in: userIds } }
    });

    // Combine users and their ranges
    const result = publicUsers.map(user => {
      const range = vocalRanges.find(r => r.userId === user.id);
      return {
        userId: user.id,
        nickname: user.nickname || user.username,
        comfortableLowest: range?.comfortableLowest ?? null,
        comfortableHighest: range?.comfortableHighest ?? null,
        singableLowest: range?.singableLowest ?? null,
        singableHighest: range?.singableHighest ?? null,
        limitLowest: range?.limitLowest ?? null,
        limitHighest: range?.limitHighest ?? null,
      };
    }).filter(item => {
      // Only keep users who have mapped at least one vocal pitch boundary
      return item.comfortableLowest !== null || item.comfortableHighest !== null ||
        item.singableLowest !== null || item.singableHighest !== null ||
        item.limitLowest !== null || item.limitHighest !== null;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: '無法獲取公開音域資料。', details: error.message },
      { status: 500 }
    );
  }
}
