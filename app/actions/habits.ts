'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getHabits(userId: string) {
  try {
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const habits = await prisma.habit.findMany({
      where: { user_id: BigInt(userId) },
      include: {
        logs: {
          where: { date: todayDate },
          take: 1,
        },
      },
      orderBy: { created_at: 'asc' },
    });

    return {
      success: true,
      habits: habits.map((h) => ({
        id: h.id,
        title: h.title,
        icon: h.icon,
        category: h.category,
        target_days: h.target_days,
        current_streak: h.current_streak,
        best_streak: h.best_streak,
        is_completed_today: h.logs.length > 0 && h.logs[0].completed,
      })),
    };
  } catch (error) {
    console.error('getHabits error:', error);
    return { success: false, error: 'Odatlarni yuklashda xatolik yuz berdi', habits: [] };
  }
}

export async function toggleHabit(habitId: string, userId: string) {
  try {
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const bUserId = BigInt(userId);

    const existingLog = await prisma.habitLog.findUnique({
      where: {
        habit_id_date: {
          habit_id: habitId,
          date: todayDate,
        },
      },
    });

    let completed = true;
    if (existingLog) {
      completed = !existingLog.completed;
      await prisma.habitLog.update({
        where: { id: existingLog.id },
        data: { completed },
      });
    } else {
      await prisma.habitLog.create({
        data: {
          habit_id: habitId,
          user_id: bUserId,
          date: todayDate,
          completed: true,
        },
      });
    }

    // Streak hisoblash
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (habit) {
      let current_streak = habit.current_streak;
      if (completed) {
        current_streak += 1;
      } else {
        current_streak = Math.max(0, current_streak - 1);
      }
      const best_streak = Math.max(habit.best_streak, current_streak);

      await prisma.habit.update({
        where: { id: habitId },
        data: {
          current_streak,
          best_streak,
          last_completed: completed ? todayDate : habit.last_completed,
        },
      });
    }

    revalidatePath('/');
    return { success: true, completed };
  } catch (error) {
    console.error('toggleHabit error:', error);
    return { success: false, error: 'Odatni yangilashda xatolik' };
  }
}

export async function createHabit(
  userId: string,
  data: { title: string; icon?: string; category?: string; target_days?: number }
) {
  try {
    const habit = await prisma.habit.create({
      data: {
        user_id: BigInt(userId),
        title: data.title,
        icon: data.icon || '⭐',
        category: data.category || 'Umumiy',
        target_days: data.target_days || 7,
      },
    });

    revalidatePath('/');
    return { success: true, habit };
  } catch (error) {
    console.error('createHabit error:', error);
    return { success: false, error: 'Odat yaratishda xatolik' };
  }
}

export async function deleteHabit(habitId: string) {
  try {
    await prisma.habit.delete({ where: { id: habitId } });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('deleteHabit error:', error);
    return { success: false, error: 'Odatni o\'chirishda xatolik' };
  }
}
