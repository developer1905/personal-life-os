'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type MoodType = 'GREAT' | 'GOOD' | 'OKAY' | 'TIRED' | 'STRESSED';

export async function logTodayMood(
  userId: string,
  data: { mood: MoodType; energy_level?: number; note?: string }
) {
  try {
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const bUserId = BigInt(userId);

    const moodLog = await prisma.moodLog.upsert({
      where: {
        user_id_date: {
          user_id: bUserId,
          date: todayDate,
        },
      },
      update: {
        mood: data.mood,
        energy_level: data.energy_level || 3,
        note: data.note,
      },
      create: {
        user_id: bUserId,
        date: todayDate,
        mood: data.mood,
        energy_level: data.energy_level || 3,
        note: data.note,
      },
    });

    revalidatePath('/');
    return { success: true, moodLog };
  } catch (error) {
    console.error('logTodayMood error:', error);
    return { success: false, error: 'Kayfiyatni saqlashda xatolik' };
  }
}

export async function getTodayMood(userId: string) {
  try {
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const moodLog = await prisma.moodLog.findUnique({
      where: {
        user_id_date: {
          user_id: BigInt(userId),
          date: todayDate,
        },
      },
    });

    return {
      success: true,
      mood: moodLog ? moodLog.mood : null,
      energy_level: moodLog ? moodLog.energy_level : 3,
      note: moodLog ? moodLog.note : null,
    };
  } catch (error) {
    console.error('getTodayMood error:', error);
    return { success: false, mood: null, energy_level: 3, note: null };
  }
}
