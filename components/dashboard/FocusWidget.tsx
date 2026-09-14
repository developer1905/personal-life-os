'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer, Award } from 'lucide-react';
import { logFocusSession, getTodayFocusStats } from '@/app/actions/focus';
import { useHaptic } from '@/hooks/useHaptic';

export function FocusWidget({ userId }: { userId: string }) {
  const [mode, setMode] = useState<'WORK' | 'BREAK'>('WORK');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const { tap, success } = useHaptic();

  useEffect(() => {
    if (!userId) return;
    loadStats();
  }, [userId]);

  async function loadStats() {
    const res = await getTodayFocusStats(userId);
    if (res.success) {
      setTotalMinutes(res.total_minutes);
      setSessionCount(res.sessions_count);
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      success();
      handleSessionComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  async function handleSessionComplete() {
    const duration = mode === 'WORK' ? 25 : 5;
    await logFocusSession(userId, {
      duration_minutes: duration,
      type: mode,
      note: mode === 'WORK' ? '25 daqiqa fokus' : '5 daqiqa tanaffus',
    });

    loadStats();

    // Switch mode
    if (mode === 'WORK') {
      setMode('BREAK');
      setTimeLeft(5 * 60);
    } else {
      setMode('WORK');
      setTimeLeft(25 * 60);
    }
  }

  function toggleTimer() {
    tap();
    setIsActive(!isActive);
  }

  function resetTimer() {
    tap();
    setIsActive(false);
    setTimeLeft(mode === 'WORK' ? 25 * 60 : 5 * 60);
  }

  function switchMode(newMode: 'WORK' | 'BREAK') {
    tap();
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(newMode === 'WORK' ? 25 * 60 : 5 * 60);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalDuration = mode === 'WORK' ? 25 * 60 : 5 * 60;
  const progressPercent = Math.round(((totalDuration - timeLeft) / totalDuration) * 100);

  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
            <Timer size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Fokus Taymeri (Pomodoro)</h3>
            <p className="text-xs text-muted-foreground">
              Bugun: {totalMinutes} daqiqa ({sessionCount} sessiya)
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
          <button
            onClick={() => switchMode('WORK')}
            className={`px-2 py-1 rounded-md transition-all ${
              mode === 'WORK'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Fokus (25m)
          </button>
          <button
            onClick={() => switchMode('BREAK')}
            className={`px-2 py-1 rounded-md transition-all ${
              mode === 'BREAK'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Tanaffus (5m)
          </button>
        </div>
      </div>

      {/* Timer Display & Controls */}
      <div className="flex flex-col items-center py-2">
        <div className="relative flex items-center justify-center mb-3">
          <div className="text-3xl font-extrabold tracking-wider font-mono text-foreground">
            {timeFormatted}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-1.5 mb-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              mode === 'WORK' ? 'bg-primary' : 'bg-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTimer}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-white font-semibold text-xs shadow-md transition-transform active:scale-95 ${
              isActive
                ? 'bg-amber-500 hover:bg-amber-600'
                : mode === 'WORK'
                ? 'bg-primary hover:bg-primary/90'
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {isActive ? (
              <>
                <Pause size={14} /> To&apos;xtatish
              </>
            ) : (
              <>
                <Play size={14} /> Boshlash
              </>
            )}
          </button>

          <button
            onClick={resetTimer}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground transition-all"
            title="Qayta o'rnatish"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
