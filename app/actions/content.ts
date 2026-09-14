'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ContentType } from '@prisma/client';

export type ContentFormData = {
  userId: string;
  title: string;
  content: string;
  type: ContentType;
  cover_image?: string;
  rating?: number;
  tags?: string[];
};

/**
 * Yangi kontent yozuvi qo'shish
 */
export async function createContent(data: ContentFormData) {
  try {
    const entry = await prisma.contentEntry.create({
      data: {
        user_id: BigInt(data.userId),
        title: data.title,
        content: data.content,
        type: data.type,
        cover_image: data.cover_image,
        rating: data.rating,
        tags: data.tags || [],
      },
    });

    revalidatePath('/feed');

    return {
      success: true,
      entry: { ...entry, user_id: entry.user_id.toString() },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create content',
    };
  }
}

/**
 * Kontent yozuvlarini olish (filtr bilan)
 */
export async function getContents(
  userId: string,
  options?: {
    type?: ContentType;
    limit?: number;
    offset?: number;
  }
) {
  try {
    const entries = await prisma.contentEntry.findMany({
      where: {
        user_id: BigInt(userId),
        ...(options?.type && { type: options.type }),
      },
      orderBy: { created_at: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    });

    const total = await prisma.contentEntry.count({
      where: {
        user_id: BigInt(userId),
        ...(options?.type && { type: options.type }),
      },
    });

    return {
      success: true,
      entries: entries.map((e) => ({
        ...e,
        user_id: e.user_id.toString(),
      })),
      total,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch content',
      entries: [],
      total: 0,
    };
  }
}

/**
 * Bitta kontent yozuvini olish
 */
export async function getContentById(id: string, userId: string) {
  try {
    const entry = await prisma.contentEntry.findFirst({
      where: { id, user_id: BigInt(userId) },
    });

    if (!entry) {
      return { success: false, error: 'Content not found' };
    }

    return {
      success: true,
      entry: { ...entry, user_id: entry.user_id.toString() },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Database error',
    };
  }
}

/**
 * Kontent yozuvini yangilash
 */
export async function updateContent(
  id: string,
  userId: string,
  data: Partial<ContentFormData>
) {
  try {
    const entry = await prisma.contentEntry.updateMany({
      where: { id, user_id: BigInt(userId) },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.cover_image !== undefined && { cover_image: data.cover_image }),
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.tags && { tags: data.tags }),
      },
    });

    revalidatePath('/feed');

    return { success: true, updated: entry.count > 0 };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update content',
    };
  }
}

/**
 * Kontent yozuvini o'chirish
 */
export async function deleteContent(id: string, userId: string) {
  try {
    await prisma.contentEntry.deleteMany({
      where: { id, user_id: BigInt(userId) },
    });

    revalidatePath('/feed');

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete content',
    };
  }
}
