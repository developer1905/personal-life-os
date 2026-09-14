'use client';

import { useState, useEffect } from 'react';
import { Smile, Zap, Check } from 'lucide-react';
import { logTodayMood, getTodayMood, MoodType } from '@/app/actions/mood';
import { useHaptic } from '@/hooks/useHaptic';

const MOODS: Array<{ type: MoodType; emoji: string; label: string }> = [
  { type: 'GREAT', emoji: '🤩', label: "A'lo" },
  { type: 'GOOD', emoji: '😊', label: 'Yaxshi' },
  { type: 'OKAY', emoji: '😐', label: 'Normal' },
  { type: 'TIRED', emoji: '🥱', label: 'Charchagan' },
  { type: 'STRESSED', emoji: '😣', label: 'Qiyin' },
];

export function MoodWidget({ userId }: { userId: string }) {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [energy, setEnergy] = useState<number>(3);
  const [saved, setSaved] = useState(false);
  const { tap, success } = useHaptic();

  useEffect(() => {
    if (!userId) return;
    loadMood();
  }, [userId]);

  async function loadMood() {
    const res = await getTodayMood(userId);
    if (res.success && res.mood) {
      setSelectedMood(res.mood as MoodType);
      setEnergy(res.energy_level);
      setSaved(true);
    }
  }

  async function handleSelectMood(mood: MoodType) {
    tap();
    setSelectedMood(mood);
    const res = await logTodayMood(userId, { mood, energy_level: energy });
    if (res.success) {
      success();
      setSaved(true);
    }
  }

  async function handleEnergyChange(val: number) {
    tap();
    setEnergy(val);
    if (selectedMood) {
      await logTodayMood(userId, { mood: selectedMood, energy_level: val });
    }
  }

  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold">
            <Smile size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Kayfiyat &amp; Energiya</h3>
            <p className="text-xs text-muted-foreground">
              {saved ? "Bugungi holatingiz qayd etildi" : "Bugun o'zingizni qanday his qilyapsiz?"}
            </p>
          </div>
        </div>

        {saved && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold">
            <Check size={12} /> Saqlandi
          </span>
        )}
      </div>

      {/* Mood Emoji Buttons */}
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        {MOODS.map((m) => {
          const isSelected = selectedMood === m.type;
          return (
            <button
              key={m.type}
              onClick={() => handleSelectMood(m.type)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all border ${
                isSelected
                  ? 'bg-pink-500/15 border-pink-500/40 scale-105 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 hover:border-pink-300'
              }`}
            >
              <span className="text-2xl mb-1">{m.emoji}</span>
              <span className="text-[10px] font-medium text-foreground">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Energy Level Slider */}
      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Zap size={14} className="text-amber-500" />
          <span>Energiya darajasi:</span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => handleEnergyChange(num)}
              className={`w-6 h-6 rounded-md text-[11px] font-bold transition-all ${
                energy >= num
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-700 text-muted-foreground'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
