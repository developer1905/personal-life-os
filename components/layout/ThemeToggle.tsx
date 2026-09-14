'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useHaptic } from '@/hooks/useHaptic';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'white-blue'>('dark');
  const { tap } = useHaptic();

  useEffect(() => {
    const saved = localStorage.getItem('lifeos-theme') as 'dark' | 'white-blue' | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  function applyTheme(newTheme: 'dark' | 'white-blue') {
    const root = document.documentElement;
    const body = document.body;

    if (newTheme === 'white-blue') {
      root.setAttribute('data-theme', 'white-blue');
      body.classList.remove('dark');
      body.classList.add('theme-white-blue');
    } else {
      root.removeAttribute('data-theme');
      body.classList.remove('theme-white-blue');
      body.classList.add('dark');
    }
  }

  function toggleTheme() {
    tap();
    const nextTheme = theme === 'dark' ? 'white-blue' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('lifeos-theme', nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      onClick={toggleTheme}
      id="theme-toggle-btn"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm"
      style={{
        background: theme === 'white-blue' ? '#ffffff' : 'rgba(255,255,255,0.08)',
        color: theme === 'white-blue' ? '#2563eb' : '#a29bfe',
        border: theme === 'white-blue' ? '1px solid #bfdbfe' : '1px solid rgba(255,255,255,0.12)',
      }}
      title="Mavzuni o'zgartirish (Oq-Ko'k / Qorong'u)"
    >
      {theme === 'white-blue' ? (
        <>
          <Moon size={14} className="text-blue-600" />
          <span>Oq-Ko&apos;k</span>
        </>
      ) : (
        <>
          <Sun size={14} className="text-amber-400" />
          <span>Qorong&apos;u</span>
        </>
      )}
    </button>
  );
}
