import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const themeColor = session?.user?.themeColor || '#92cfbb';
    
    let iconUrl = '/favicon.ico';
    
    const idols = await prisma.member.findMany({
      where: {
        color: { not: null },
        imagePath: { not: null }
      },
      select: {
        id: true,
        name: true,
        color: true,
        imagePath: true
      }
    });

    const targetColor = themeColor.toLowerCase();
    const matchedIdol = idols.find(idol => idol.color?.toLowerCase() === targetColor);

    if (matchedIdol && matchedIdol.imagePath) {
      iconUrl = matchedIdol.imagePath;
    }

    const manifest = {
      name: 'IMAS 歌曲熟悉度評估系統',
      short_name: 'IMAS',
      description: '快速整理與評估您的 IMAS 歌曲熟悉度',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: themeColor,
      icons: [
        {
          src: iconUrl,
          sizes: '192x192',
          type: iconUrl.endsWith('.webp') ? 'image/webp' : 'image/png'
        },
        {
          src: iconUrl,
          sizes: '512x512',
          type: iconUrl.endsWith('.webp') ? 'image/webp' : 'image/png'
        }
      ]
    };

    return new NextResponse(JSON.stringify(manifest), {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Failed to generate manifest:', error);
    return new NextResponse(JSON.stringify({
      name: 'IMAS',
      short_name: 'IMAS',
      start_url: '/',
      display: 'standalone',
      icons: [{ src: '/favicon.ico', sizes: 'any' }]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/manifest+json' }
    });
  }
}
