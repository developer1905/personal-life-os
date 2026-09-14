'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type HealthLogFormData = {
  userId: string;
  date?: Date | string;
  steps_count?: number;
  calories_burned?: number;
  water_intake_ml?: number;
  notes?: string;
};

/**
 * Kunlik sog'liq ma'lumotlarini yaratish yoki yangilash
 */
export async function upsertHealthLog(data: HealthLogFormData) {
  try {
    const date = data.date ? new Date(data.date) : new Date();
    // Faqat sanani olish (vaqtni olib tashlaymiz)
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const log = await prisma.healthLog.upsert({
      where: {
        user_id_date: {
          user_id: BigInt(data.userId),
          date: dateOnly,
        },
      },
      update: {
        ...(data.steps_count !== undefined && { steps_count: data.steps_count }),
        ...(data.calories_burned !== undefined && {
          calories_burned: data.calories_burned,
        }),
        ...(data.water_intake_ml !== undefined && {
          water_intake_ml: data.water_intake_ml,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        updated_at: new Date(),
      },
      create: {
        user_id: BigInt(data.userId),
        date: dateOnly,
        steps_count: data.steps_count || 0,
        calories_burned: data.calories_burned,
        water_intake_ml: data.water_intake_ml || 0,
        notes: data.notes,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      log: { ...log, user_id: log.user_id.toString() },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update health log',
    };
  }
}

/**
 * Bugungi sog'liq ma'lumotlarini olish
 */
export async function getTodayHealthLog(userId: string) {
  try {
    const today = new Date();
    const dateOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const log = await prisma.healthLog.findUnique({
      where: {
        user_id_date: {
          user_id: BigInt(userId),
          date: dateOnly,
        },
      },
    });

    return {
      success: true,
      log: log ? { ...log, user_id: log.user_id.toString() } : null,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch health log',
      log: null,
    };
  }
}

/**
 * So'nggi 7 kunlik sog'liq tarixi
 */
export async function getWeeklyHealthHistory(userId: string) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);

    const logs = await prisma.healthLog.findMany({
      where: {
        user_id: BigInt(userId),
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    return {
      success: true,
      logs: logs.map((l) => ({ ...l, user_id: l.user_id.toString() })),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch history',
      logs: [],
    };
  }
}

/**
 * Qadamlarni yangilash (quick action)
 */
export async function updateSteps(userId: string, steps: number) {
  return upsertHealthLog({ userId, steps_count: steps });
}

/**
 * Suv iste'molini yangilash (ml qo'shish)
 */
export async function addWaterIntake(userId: string, amountMl: number) {
  try {
    const today = new Date();
    const dateOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    // Mavjud ma'lumotni olish
    const existing = await prisma.healthLog.findUnique({
      where: {
        user_id_date: {
          user_id: BigInt(userId),
          date: dateOnly,
        },
      },
    });

    const currentWater = existing?.water_intake_ml || 0;

    return upsertHealthLog({
      userId,
      water_intake_ml: currentWater + amountMl,
    });
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update water intake',
    };
  }
}
