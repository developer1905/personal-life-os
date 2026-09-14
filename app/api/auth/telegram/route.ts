import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateTelegramInitData } from '@/lib/telegram/validate';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initData } = body;

    if (!initData) {
      return NextResponse.json(
        { success: false, error: 'initData is required' },
        { status: 400 }
      );
    }

    const validation = validateTelegramInitData(initData);

    if (!validation.valid || !validation.data?.user) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Invalid initData',
        },
        { status: 401 }
      );
    }

    const tgUser = validation.data.user;

    // Foydalanuvchini ma'lumotlar bazasida yaratish yoki yangilash
    const user = await prisma.user.upsert({
      where: { id: BigInt(tgUser.id) },
      update: {
        username: tgUser.username,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        photo_url: tgUser.photo_url,
        updated_at: new Date(),
      },
      create: {
        id: BigInt(tgUser.id),
        username: tgUser.username,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        photo_url: tgUser.photo_url,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id.toString(),
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        photo_url: user.photo_url,
        currency: user.currency,
        step_goal: user.step_goal,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST /api/auth/telegram' });
}
