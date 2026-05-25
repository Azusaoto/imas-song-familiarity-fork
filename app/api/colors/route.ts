import { NextResponse } from 'next/server';
import idolColors from '@/data/idol-colors.json';

export async function GET() {
  return NextResponse.json(idolColors || []);
}
