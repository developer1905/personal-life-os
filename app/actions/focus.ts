'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function logFocusSession(
  userId: string,
  data: { duration_minutes: number; type?: 'WORK' | 'BREAK'; note?: string }
) {
  try {
    const session = await prisma.focusSession.create({
      data: {
        user_id: BigInt(userId),
        duration_minutes: data.duration_minutes,
        type: data.type || 'WORK',
        note: data.note,
      },
    });

    revalidatePath('/');
    return { success: true, session };
  } catch (error) {
    console.error('logFocusSession error:', error);
    return { success: false, error: 'Fokus sessiyasini saqlashda xatolik' };
  }
}

export async function getTodayFocusStats(userId: string) {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const sessions = await prisma.focusSession.findMany({
      where: {
        user_id: BigInt(userId),
        completed_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
        type: 'WORK',
      },
    });

    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);

    return {
      success: true,
      total_minutes: totalMinutes,
      sessions_count: sessions.length,
    };
  } catch (error) {
    console.error('getTodayFocusStats error:', error);
    return { success: false, total_minutes: 0, sessions_count: 0 };
  }
}
