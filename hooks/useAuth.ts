'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTelegram } from '@/providers/TelegramProvider';
import { upsertUser } from '@/app/actions/user';

export interface AuthenticatedUser {
  id: string;
  first_name: string;
  last_name?: string | null;
  username?: string | null;
  photo_url?: string | null;
  currency: string;
  step_goal: number;
  created_at: Date | string;
}

export function useAuth() {
  const { user: tgUser, initData, isReady } = useTelegram();
  const [dbUser, setDbUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authenticate = useCallback(async () => {
    if (!isReady) return;

    // Development rejimida mock foydalanuvchi
    if (!initData && process.env.NODE_ENV === 'development') {
      setDbUser({
        id: '123456789',
        first_name: tgUser?.first_name || 'Test',
        last_name: tgUser?.last_name,
        username: tgUser?.username,
        photo_url: tgUser?.photo_url,
        currency: 'UZS',
        step_goal: 10000,
        created_at: new Date(),
      });
      setIsLoading(false);
      return;
    }

    if (!initData) {
      setError('Telegram initData not available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await upsertUser(initData);

      if (result.success && result.user) {
        setDbUser(result.user as AuthenticatedUser);
        setError(null);
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [isReady, initData, tgUser]);

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  return {
    user: dbUser,
    tgUser,
    isLoading,
    error,
    refetch: authenticate,
  };
}
