import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/units?production=cg
// production=all 或不傳 → 全部
// 指定 production → 該 production + 'mixed' (跨 IP 組合都顯示)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const production = searchParams.get('production');

    const where: any =
      !production || production === 'all'
        ? {}
        : { production: { in: [production, 'mixed'] } };

    const units = await prisma.unit.findMany({
      where,
      select: {
        id: true,
        taxId: true,
        name: true,
        kana: true,
        production: true,
        members: { select: { memberId: true } },
      },
      orderBy: [{ kana: 'asc' }, { name: 'asc' }],
    });

    const formatted = units.map((u) => ({
      id: u.id,
      taxId: u.taxId,
      name: u.name,
      kana: u.kana,
      production: u.production,
      memberIds: u.members.map((m) => m.memberId),
      memberCount: u.members.length,
    }));

    return new NextResponse(JSON.stringify(formatted), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=600',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: '載入組合列表失敗。', details: error.message },
      { status: 500 },
    );
  }
}
