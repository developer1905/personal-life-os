'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getGoals(userId: string) {
  try {
    const goals = await prisma.goal.findMany({
      where: { user_id: BigInt(userId) },
      orderBy: { created_at: 'desc' },
    });

    return {
      success: true,
      goals: goals.map((g) => ({
        id: g.id,
        title: g.title,
        target_amount: Number(g.target_amount),
        current_amount: Number(g.current_amount),
        category: g.category,
        icon: g.icon,
        deadline: g.deadline,
        is_completed: g.is_completed,
        progress_percentage: Math.min(
          100,
          Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100) || 0
        ),
      })),
    };
  } catch (error) {
    console.error('getGoals error:', error);
    return { success: false, error: 'Maqsadlarni yuklashda xatolik', goals: [] };
  }
}

export async function createGoal(
  userId: string,
  data: {
    title: string;
    target_amount: number;
    current_amount?: number;
    category?: string;
    icon?: string;
    deadline?: string;
  }
) {
  try {
    const goal = await prisma.goal.create({
      data: {
        user_id: BigInt(userId),
        title: data.title,
        target_amount: data.target_amount,
        current_amount: data.current_amount || 0,
        category: data.category || "Jamg'arma",
        icon: data.icon || '🎯',
        deadline: data.deadline ? new Date(data.deadline) : null,
        is_completed: (data.current_amount || 0) >= data.target_amount,
      },
    });

    revalidatePath('/');
    revalidatePath('/finance');
    return { success: true, goal };
  } catch (error) {
    console.error('createGoal error:', error);
    return { success: false, error: 'Maqsad yaratishda xatolik' };
  }
}

export async function addMoneyToGoal(goalId: string, amount: number) {
  try {
    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) return { success: false, error: 'Maqsad topilmadi' };

    const newAmount = Number(goal.current_amount) + amount;
    const is_completed = newAmount >= Number(goal.target_amount);

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: {
        current_amount: newAmount,
        is_completed,
      },
    });

    revalidatePath('/');
    revalidatePath('/finance');
    return { success: true, goal: updated };
  } catch (error) {
    console.error('addMoneyToGoal error:', error);
    return { success: false, error: 'Pul qo\'shishda xatolik' };
  }
}

export async function deleteGoal(goalId: string) {
  try {
    await prisma.goal.delete({ where: { id: goalId } });
    revalidatePath('/');
    revalidatePath('/finance');
    return { success: true };
  } catch (error) {
    console.error('deleteGoal error:', error);
    return { success: false, error: 'Maqsadni o\'chirishda xatolik' };
  }
}
