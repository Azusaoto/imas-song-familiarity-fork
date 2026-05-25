import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const members = await prisma.member.findMany({
      where: { color: { not: null } },
      select: { name: true, color: true }
    });
    
    const units = await prisma.unit.findMany({
      where: { color: { not: null } },
      select: { name: true, color: true }
    });
    
    // 合併並去重（萬一有同名的情況，雖然機率很小）
    const colorMap = new Map<string, string>();
    for (const m of members) if (m.color) colorMap.set(m.name, m.color);
    for (const u of units) if (u.color) colorMap.set(u.name, u.color);
    
    const allColors = Array.from(colorMap.entries()).map(([name, color]) => ({ name, color }));
    
    return NextResponse.json(allColors);
  } catch (error) {
    console.error('Failed to fetch colors from DB:', error);
    return NextResponse.json([]);
  }
}
