'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { FinanceType } from '@prisma/client';

export type FinanceFormData = {
  userId: string;
  amount: number;
  type: FinanceType;
  category: string;
  receipt_image?: string;
  note?: string;
  date?: Date | string;
};

/**
 * Yangi moliyaviy operatsiya qo'shish
 */
export async function createFinance(data: FinanceFormData) {
  try {
    const finance = await prisma.finance.create({
      data: {
        user_id: BigInt(data.userId),
        amount: data.amount,
        type: data.type,
        category: data.category,
        receipt_image: data.receipt_image,
        note: data.note,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });

    revalidatePath('/finance');

    return {
      success: true,
      finance: {
        ...finance,
        user_id: finance.user_id.toString(),
        amount: finance.amount.toString(),
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create transaction',
    };
  }
}

/**
 * Moliyaviy operatsiyalarni olish
 */
export async function getFinances(
  userId: string,
  options?: {
    type?: FinanceType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
) {
  try {
    const where = {
      user_id: BigInt(userId),
      ...(options?.type && { type: options.type }),
      ...(options?.startDate || options?.endDate
        ? {
            date: {
              ...(options.startDate && { gte: options.startDate }),
              ...(options.endDate && { lte: options.endDate }),
            },
          }
        : {}),
    };

    const [finances, total] = await Promise.all([
      prisma.finance.findMany({
        where,
        orderBy: { date: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      prisma.finance.count({ where }),
    ]);

    return {
      success: true,
      finances: finances.map((f) => ({
        ...f,
        user_id: f.user_id.toString(),
        amount: f.amount.toString(),
      })),
      total,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch finances',
      finances: [],
      total: 0,
    };
  }
}

/**
 * Oylik balans statistikasi
 */
export async function getMonthlyStats(userId: string, year?: number, month?: number) {
  try {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month !== undefined ? month : now.getMonth();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const [incomes, expenses] = await Promise.all([
      prisma.finance.aggregate({
        where: {
          user_id: BigInt(userId),
          type: FinanceType.INCOME,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.finance.aggregate({
        where: {
          user_id: BigInt(userId),
          type: FinanceType.EXPENSE,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Kategoriya bo'yicha xarajatlar
    const expensesByCategory = await prisma.finance.groupBy({
      by: ['category'],
      where: {
        user_id: BigInt(userId),
        type: FinanceType.EXPENSE,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const totalIncome = Number(incomes._sum.amount || 0);
    const totalExpense = Number(expenses._sum.amount || 0);

    return {
      success: true,
      stats: {
        total_income: totalIncome,
        total_expense: totalExpense,
        balance: totalIncome - totalExpense,
        income_count: incomes._count,
        expense_count: expenses._count,
        expenses_by_category: expensesByCategory.map((e) => ({
          category: e.category,
          amount: Number(e._sum.amount || 0),
        })),
        month: targetMonth,
        year: targetYear,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to get stats',
    };
  }
}

/**
 * So'nggi 6 oylik grafik ma'lumotlari
 */
export async function getMonthlyChartData(userId: string) {
  try {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const [income, expense] = await Promise.all([
        prisma.finance.aggregate({
          where: {
            user_id: BigInt(userId),
            type: FinanceType.INCOME,
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        }),
        prisma.finance.aggregate({
          where: {
            user_id: BigInt(userId),
            type: FinanceType.EXPENSE,
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        }),
      ]);

      months.push({
        month: date.toLocaleDateString('uz-UZ', { month: 'short' }),
        income: Number(income._sum.amount || 0),
        expense: Number(expense._sum.amount || 0),
      });
    }

    return { success: true, data: months };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to get chart data',
      data: [],
    };
  }
}

/**
 * Moliyaviy operatsiyani o'chirish
 */
export async function deleteFinance(id: string, userId: string) {
  try {
    await prisma.finance.deleteMany({
      where: { id, user_id: BigInt(userId) },
    });

    revalidatePath('/finance');

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete transaction',
    };
  }
}
