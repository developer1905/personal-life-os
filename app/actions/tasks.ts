'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Priority } from '@prisma/client';

export type TaskFormData = {
  userId: string;
  title: string;
  description?: string;
  due_date?: Date | string;
  priority?: Priority;
};

/**
 * Yangi vazifa qo'shish
 */
export async function createTask(data: TaskFormData) {
  try {
    const task = await prisma.task.create({
      data: {
        user_id: BigInt(data.userId),
        title: data.title,
        description: data.description,
        due_date: data.due_date ? new Date(data.due_date) : undefined,
        priority: data.priority || Priority.MEDIUM,
      },
    });

    revalidatePath('/tasks');

    return {
      success: true,
      task: { ...task, user_id: task.user_id.toString() },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create task',
    };
  }
}

/**
 * Vazifalarni olish
 */
export async function getTasks(
  userId: string,
  options?: {
    completed?: boolean;
    priority?: Priority;
    limit?: number;
  }
) {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        user_id: BigInt(userId),
        ...(options?.completed !== undefined && {
          is_completed: options.completed,
        }),
        ...(options?.priority && { priority: options.priority }),
      },
      orderBy: [{ is_completed: 'asc' }, { due_date: 'asc' }, { created_at: 'desc' }],
      take: options?.limit || 50,
    });

    return {
      success: true,
      tasks: tasks.map((t) => ({ ...t, user_id: t.user_id.toString() })),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch tasks',
      tasks: [],
    };
  }
}

/**
 * Vazifani bajarilgan/bajarilmagan qilish (toggle)
 */
export async function toggleTask(id: string, userId: string) {
  try {
    const task = await prisma.task.findFirst({
      where: { id, user_id: BigInt(userId) },
    });

    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { is_completed: !task.is_completed },
    });

    revalidatePath('/tasks');

    return {
      success: true,
      task: { ...updated, user_id: updated.user_id.toString() },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to toggle task',
    };
  }
}

/**
 * Vazifani yangilash
 */
export async function updateTask(
  id: string,
  userId: string,
  data: Partial<TaskFormData>
) {
  try {
    const updated = await prisma.task.updateMany({
      where: { id, user_id: BigInt(userId) },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.due_date !== undefined && {
          due_date: data.due_date ? new Date(data.due_date) : null,
        }),
        ...(data.priority && { priority: data.priority }),
      },
    });

    revalidatePath('/tasks');

    return { success: true, updated: updated.count > 0 };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update task',
    };
  }
}

/**
 * Vazifani o'chirish
 */
export async function deleteTask(id: string, userId: string) {
  try {
    await prisma.task.deleteMany({
      where: { id, user_id: BigInt(userId) },
    });

    revalidatePath('/tasks');

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete task',
    };
  }
}

// ==================== REMINDERS ====================

export type ReminderFormData = {
  userId: string;
  title: string;
  description?: string;
  remind_at: Date | string;
};

/**
 * Yangi eslatma qo'shish
 */
export async function createReminder(data: ReminderFormData) {
  try {
    const reminder = await prisma.reminder.create({
      data: {
        user_id: BigInt(data.userId),
        title: data.title,
        description: data.description,
        remind_at: new Date(data.remind_at),
      },
    });

    revalidatePath('/tasks');

    return {
      success: true,
      reminder: { ...reminder, user_id: reminder.user_id.toString() },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create reminder',
    };
  }
}

/**
 * Eslatmalarni olish
 */
export async function getReminders(userId: string) {
  try {
    const reminders = await prisma.reminder.findMany({
      where: { user_id: BigInt(userId) },
      orderBy: { remind_at: 'asc' },
    });

    return {
      success: true,
      reminders: reminders.map((r) => ({
        ...r,
        user_id: r.user_id.toString(),
      })),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch reminders',
      reminders: [],
    };
  }
}

/**
 * Eslatmani o'chirish
 */
export async function deleteReminder(id: string, userId: string) {
  try {
    await prisma.reminder.deleteMany({
      where: { id, user_id: BigInt(userId) },
    });

    revalidatePath('/tasks');

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete reminder',
    };
  }
}
