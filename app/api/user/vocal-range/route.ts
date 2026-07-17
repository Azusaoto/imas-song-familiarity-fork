import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppError, handleError } from '@/lib/errors';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      throw new AppError('未授權的存取。', 401, 'UNAUTHORIZED');
    }

    const userId = session.user.id;
    const vocalRange = await prisma.userVocalRange.findUnique({
      where: { userId },
    });

    return NextResponse.json(vocalRange || {
      userId,
      comfortableHighest: null,
      singableHighest: null,
      limitHighest: null,
      comfortableLowest: null,
      singableLowest: null,
      limitLowest: null,
    });
  } catch (error: any) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      throw new AppError('未授權的存取。', 401, 'UNAUTHORIZED');
    }

    const userId = session.user.id;
    const body = await request.json();
    console.log("=== API INCOMING POST BODY ===", body);
    const { comfortableHighest, singableHighest, limitHighest, comfortableLowest, singableLowest, limitLowest } = body;

    // 驗證輸入（必須為 null 或 1~60 的整數）
    const validatePitch = (val: any) => {
      if (val === null || val === undefined) return null;
      const num = Number(val);
      if (Number.isInteger(num) && num >= 1 && num <= 60) return num;
      throw new AppError('無效的音順序數值（應介於 1 到 60 之間）', 400, 'INVALID_PITCH_VALUE');
    };

    let cHighest, sHighest, lHighest, cLowest, sLowest, lLowest;
    cHighest = validatePitch(comfortableHighest);
    sHighest = validatePitch(singableHighest);
    lHighest = validatePitch(limitHighest);
    cLowest = validatePitch(comfortableLowest);
    sLowest = validatePitch(singableLowest);
    lLowest = validatePitch(limitLowest);

    // 儲存至資料庫 (Upsert)
    const vocalRange = await prisma.userVocalRange.upsert({
      where: { userId },
      update: {
        comfortableHighest: cHighest,
        singableHighest: sHighest,
        limitHighest: lHighest,
        comfortableLowest: cLowest,
        singableLowest: sLowest,
        limitLowest: lLowest,
      },
      create: {
        userId,
        comfortableHighest: cHighest,
        singableHighest: sHighest,
        limitHighest: lHighest,
        comfortableLowest: cLowest,
        singableLowest: sLowest,
        limitLowest: lLowest,
      },
    });

    return NextResponse.json(vocalRange);
  } catch (error: any) {
    return handleError(error);
  }
}
