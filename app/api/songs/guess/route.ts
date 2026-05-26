import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 3600; // 快取一小時

export async function GET() {
  try {
    const songs = await prisma.song.findMany({
      select: {
        id: true,
        title: true,
        brand: true,
        youtubeIds: true,
      },
      orderBy: {
        title: 'asc',
      },
    });

    return NextResponse.json(songs);
  } catch (error: any) {
    return NextResponse.json(
      { error: '載入遊戲題庫失敗', details: error.message },
      { status: 500 }
    );
  }
}
