'use server';

import { prisma } from '@/lib/prisma';
import { validateAndGetUser } from '@/lib/telegram/validate';
import { revalidatePath } from 'next/cache';

/**
 * Telegram foydalanuvchisini ma'lumotlar bazasida yaratish yoki yangilash (upsert)
 */
export async function upsertUser(initData: string) {
  const { success, user, error } = await validateAndGetUser(initData);

  if (!success || !user) {
    return { success: false, error: error || 'Authentication failed' };
  }

  try {
    const dbUser = await prisma.user.upsert({
      where: { id: BigInt(user.id) },
      update: {
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        photo_url: user.photo_url,
        updated_at: new Date(),
      },
      create: {
        id: BigInt(user.id),
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        photo_url: user.photo_url,
      },
    });

    return {
      success: true,
      user: {
        ...dbUser,
        id: dbUser.id.toString(), // BigInt ni string ga aylantirish (JSON serializable)
      },
    };
  } catch (err) {
    console.error('upsertUser error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Database error',
    };
  }
}

/**
 * Foydalanuvchi ma'lumotlarini olish
 */
export async function getUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return {
      success: true,
      user: { ...user, id: user.id.toString() },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Database error',
    };
  }
}

/**
 * Foydalanuvchi sozlamalarini yangilash
 */
export async function updateUserSettings(
  userId: string,
  settings: {
    currency?: string;
    step_goal?: number;
  }
) {
  try {
    const user = await prisma.user.update({
      where: { id: BigInt(userId) },
      data: {
        ...(settings.currency && { currency: settings.currency }),
        ...(settings.step_goal !== undefined && { step_goal: settings.step_goal }),
      },
    });

    revalidatePath('/profile');

    return {
      success: true,
      user: { ...user, id: user.id.toString() },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Database error',
    };
  }
}

/**
 * Ma'lumotlarni JSON formatida eksport qilish
 */
export async function exportUserData(userId: string) {
  try {
    const [user, contents, tasks, finances, healthLogs, reminders] =
      await Promise.all([
        prisma.user.findUnique({ where: { id: BigInt(userId) } }),
        prisma.contentEntry.findMany({ where: { user_id: BigInt(userId) } }),
        prisma.task.findMany({ where: { user_id: BigInt(userId) } }),
        prisma.finance.findMany({ where: { user_id: BigInt(userId) } }),
        prisma.healthLog.findMany({ where: { user_id: BigInt(userId) } }),
        prisma.reminder.findMany({ where: { user_id: BigInt(userId) } }),
      ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user: user ? { ...user, id: user.id.toString() } : null,
      contents: contents.map((c) => ({ ...c, user_id: c.user_id.toString() })),
      tasks: tasks.map((t) => ({ ...t, user_id: t.user_id.toString() })),
      finances: finances.map((f) => ({
        ...f,
        user_id: f.user_id.toString(),
        amount: f.amount.toString(),
      })),
      health_logs: healthLogs.map((h) => ({
        ...h,
        user_id: h.user_id.toString(),
      })),
      reminders: reminders.map((r) => ({
        ...r,
        user_id: r.user_id.toString(),
      })),
    };

    return { success: true, data: exportData };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Export failed',
    };
  }
}
