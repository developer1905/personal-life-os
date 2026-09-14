'use client';

import { useTelegram } from '@/providers/TelegramProvider';

export function useHaptic() {
  const { hapticImpact, hapticNotification, hapticSelection } = useTelegram();

  return {
    // Bosish effekti
    tap: () => hapticImpact('light'),
    // Muhim amal
    click: () => hapticImpact('medium'),
    // Kuchli bosish
    press: () => hapticImpact('heavy'),
    // Muvaffaqiyatli
    success: () => hapticNotification('success'),
    // Xatolik
    error: () => hapticNotification('error'),
    // Ogohlantirish
    warning: () => hapticNotification('warning'),
    // Tanlash
    select: () => hapticSelection(),
    // To'liq nazorat
    impact: hapticImpact,
    notification: hapticNotification,
  };
}
