import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const songs = await prisma.song.findMany({
      include: {
        members: {
          include: {
            member: true,
          },
        },
        units: {
          include: {
            unit: true,
          },
        },
      },
      orderBy: {
        title: 'asc',
      },
    });

    // 將資料格式簡化以減少傳輸體積
    const formattedSongs = songs.map((song) => ({
      id: song.id,
      slug: song.slug,
      title: song.title,
      brand: song.brand,
      musicType: song.musicType,
      lyrics: song.lyrics,
      composer: song.composer,
      arranger: song.arranger,
      lowestPitch: song.lowestPitch,
      highestPitch: song.highestPitch,
      members: song.members.map((m) => ({
        id: m.member.id,
        name: m.member.name,
        cvName: m.member.cvName,
      })),
      units: song.units.map((su) => ({
        id: su.unit.id,
        name: su.unit.name,
      })),
    }));

    // 設定快取控制 — 縮短為 60s 以免 schema 變動時客戶端拿到過期 shape
    // 加上 v2 標籤幫助舊客戶端跳過已 cache 的舊版回應
    return new NextResponse(JSON.stringify(formattedSongs), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
        'X-Songs-Schema': 'v2-with-units',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: '載入歌曲列表失敗。', details: error.message },
      { status: 500 }
    );
  }
}
