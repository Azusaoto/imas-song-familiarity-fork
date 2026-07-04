import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: '未授權的存取。' }, { status: 401 });
    }

    const { targetUserId, songId } = await request.json();

    if (!targetUserId || !songId) {
      return NextResponse.json({ error: '缺少必要欄位。' }, { status: 400 });
    }

    // 檢查目標使用者是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      return NextResponse.json({ error: '目標使用者不存在。' }, { status: 404 });
    }

    // 檢查歌曲是否存在
    const song = await prisma.song.findUnique({
      where: { id: songId },
    });
    if (!song) {
      return NextResponse.json({ error: '歌曲不存在。' }, { status: 404 });
    }

    // 建立許願
    const newWish = await prisma.songWish.create({
      data: {
        targetUserId,
        senderUserId: session.user.id,
        songId,
      },
    });

    return NextResponse.json({ success: true, wish: newWish });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: '建立許願失敗。', details: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: '未授權的存取。' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const wishId = searchParams.get('id');

    if (!wishId) {
      return NextResponse.json({ error: '缺少許願 ID。' }, { status: 400 });
    }

    // 尋找許願紀錄
    const wish = await prisma.songWish.findUnique({
      where: { id: wishId },
    });

    if (!wish) {
      return NextResponse.json({ error: '許願紀錄不存在。' }, { status: 404 });
    }

    // 只有許願接收者或發送者可以刪除此紀錄
    if (wish.targetUserId !== session.user.id && wish.senderUserId !== session.user.id) {
      return NextResponse.json({ error: '無權限刪除此許願。' }, { status: 403 });
    }

    await prisma.songWish.delete({
      where: { id: wishId },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: '刪除許願失敗。', details: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: '未授權的存取。' }, { status: 401 });
    }

    const { id, isCompleted } = await request.json();

    if (!id || typeof isCompleted !== 'boolean') {
      return NextResponse.json({ error: '缺少必要欄位或格式不正確。' }, { status: 400 });
    }

    // 尋找許願紀錄
    const wish = await prisma.songWish.findUnique({
      where: { id },
    });

    if (!wish) {
      return NextResponse.json({ error: '許願紀錄不存在。' }, { status: 404 });
    }

    // 只有許願接收者（即該個人頁面的擁有者）可以修改此紀錄
    if (wish.targetUserId !== session.user.id) {
      return NextResponse.json({ error: '無權限修改此許願狀態。' }, { status: 403 });
    }

    const updatedWish = await prisma.songWish.update({
      where: { id },
      data: { isCompleted },
    });

    return NextResponse.json({ success: true, wish: updatedWish });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: '更新許願狀態失敗。', details: err.message },
      { status: 500 }
    );
  }
}
