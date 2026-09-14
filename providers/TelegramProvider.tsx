'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import type { TelegramWebApp, TelegramUser } from '@/lib/telegram/types';

interface TelegramContextValue {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  initData: string;
  colorScheme: 'light' | 'dark';
  isReady: boolean;
  isExpanded: boolean;
  viewportHeight: number;
  hapticImpact: (style?: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  hapticNotification: (type: 'error' | 'success' | 'warning') => void;
  hapticSelection: () => void;
  showAlert: (message: string) => void;
  showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
  openLink: (url: string) => void;
}

const TelegramContext = createContext<TelegramContextValue | null>(null);

// Development mock user
const DEV_USER: TelegramUser = {
  id: 123456789,
  first_name: 'Test',
  last_name: 'Foydalanuvchi',
  username: 'testuser',
  language_code: 'uz',
};

interface TelegramProviderProps {
  children: React.ReactNode;
}

export function TelegramProvider({ children }: TelegramProviderProps) {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState('');
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark');
  const [isReady, setIsReady] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 812
  );

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      // WebApp tayyor ekanligini e'lon qilish
      tg.ready();
      tg.expand();

      setWebApp(tg);
      setUser(tg.initDataUnsafe?.user || null);
      setInitData(tg.initData || '');
      setColorScheme(tg.colorScheme || 'dark');
      setIsExpanded(tg.isExpanded);
      setViewportHeight(tg.viewportHeight || window.innerHeight);

      // Telegram theme o'zgarishlarini kuzatish
      const handleThemeChange = () => {
        setColorScheme(tg.colorScheme);
        applyThemeVars(tg);
      };

      const handleViewportChange = () => {
        setViewportHeight(tg.viewportHeight);
        setIsExpanded(tg.isExpanded);
      };

      tg.onEvent('themeChanged', handleThemeChange);
      tg.onEvent('viewportChanged', handleViewportChange);

      // CSS variables ni Telegram theme bilan sinxronlash
      applyThemeVars(tg);

      setIsReady(true);

      return () => {
        tg.offEvent('themeChanged', handleThemeChange);
        tg.offEvent('viewportChanged', handleViewportChange);
      };
    } else {
      // Development rejimi
      console.info('[TelegramProvider] Development mode — using mock data');
      setUser(DEV_USER);
      setColorScheme(
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      );
      setViewportHeight(window.innerHeight);
      setIsReady(true);

      // Development CSS vars
      document.documentElement.style.setProperty('--tg-bg-color', '#1c1c1e');
      document.documentElement.style.setProperty('--tg-text-color', '#ffffff');
      document.documentElement.style.setProperty('--tg-hint-color', '#8e8e93');
      document.documentElement.style.setProperty('--tg-link-color', '#0a84ff');
      document.documentElement.style.setProperty('--tg-button-color', '#0a84ff');
      document.documentElement.style.setProperty('--tg-button-text-color', '#ffffff');
      document.documentElement.style.setProperty('--tg-secondary-bg-color', '#2c2c2e');
    }
  }, []);

  // Haptic feedback
  const hapticImpact = useCallback(
    (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
      webApp?.HapticFeedback?.impactOccurred(style);
    },
    [webApp]
  );

  const hapticNotification = useCallback(
    (type: 'error' | 'success' | 'warning') => {
      webApp?.HapticFeedback?.notificationOccurred(type);
    },
    [webApp]
  );

  const hapticSelection = useCallback(() => {
    webApp?.HapticFeedback?.selectionChanged();
  }, [webApp]);

  const showAlert = useCallback(
    (message: string) => {
      if (webApp) {
        webApp.showAlert(message);
      } else {
        alert(message);
      }
    },
    [webApp]
  );

  const showConfirm = useCallback(
    (message: string, callback: (confirmed: boolean) => void) => {
      if (webApp) {
        webApp.showConfirm(message, callback);
      } else {
        const confirmed = confirm(message);
        callback(confirmed);
      }
    },
    [webApp]
  );

  const openLink = useCallback(
    (url: string) => {
      if (webApp) {
        webApp.openLink(url);
      } else {
        window.open(url, '_blank');
      }
    },
    [webApp]
  );

  return (
    <TelegramContext.Provider
      value={{
        webApp,
        user,
        initData,
        colorScheme,
        isReady,
        isExpanded,
        viewportHeight,
        hapticImpact,
        hapticNotification,
        hapticSelection,
        showAlert,
        showConfirm,
        openLink,
      }}
    >
      <div
        className={colorScheme === 'dark' ? 'dark' : ''}
        style={{ minHeight: '100dvh' }}
      >
        {children}
      </div>
    </TelegramContext.Provider>
  );
}

export function useTelegram(): TelegramContextValue {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within TelegramProvider');
  }
  return context;
}

// Telegram theme CSS variabellarini DOM ga qo'llash
function applyThemeVars(tg: TelegramWebApp) {
  const params = tg.themeParams;
  const root = document.documentElement;

  if (params.bg_color) root.style.setProperty('--tg-bg-color', params.bg_color);
  if (params.text_color) root.style.setProperty('--tg-text-color', params.text_color);
  if (params.hint_color) root.style.setProperty('--tg-hint-color', params.hint_color);
  if (params.link_color) root.style.setProperty('--tg-link-color', params.link_color);
  if (params.button_color) root.style.setProperty('--tg-button-color', params.button_color);
  if (params.button_text_color)
    root.style.setProperty('--tg-button-text-color', params.button_text_color);
  if (params.secondary_bg_color)
    root.style.setProperty('--tg-secondary-bg-color', params.secondary_bg_color);
}
