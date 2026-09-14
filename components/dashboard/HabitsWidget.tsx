'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Flame, Plus, X, Sparkles } from 'lucide-react';
import { getHabits, toggleHabit, createHabit } from '@/app/actions/habits';
import { useHaptic } from '@/hooks/useHaptic';

interface HabitItem {
  id: string;
  title: string;
  icon: string;
  category: string;
  target_days: number;
  current_streak: number;
  best_streak: number;
  is_completed_today: boolean;
}

export function HabitsWidget({ userId }: { userId: string }) {
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newIcon, setNewIcon] = useState('⚡');
  const [newCategory, setNewCategory] = useState('Salomatlik');
  const { tap, success } = useHaptic();

  useEffect(() => {
    if (!userId) return;
    loadHabits();
  }, [userId]);

  async function loadHabits() {
    setLoading(true);
    const res = await getHabits(userId);
    if (res.success && res.habits) {
      setHabits(res.habits);
    }
    setLoading(false);
  }

  async function handleToggle(id: string) {
    tap();
    // Optimistic update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const nextCompleted = !h.is_completed_today;
          return {
            ...h,
            is_completed_today: nextCompleted,
            current_streak: nextCompleted ? h.current_streak + 1 : Math.max(0, h.current_streak - 1),
          };
        }
        return h;
      })
    );

    const res = await toggleHabit(id, userId);
    if (res.success && res.completed) {
      success();
    }
  }

  async function handleAddHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    tap();

    const res = await createHabit(userId, {
      title: newTitle.trim(),
      icon: newIcon,
      category: newCategory,
      target_days: 7,
    });

    if (res.success) {
      success();
      setNewTitle('');
      setShowAddModal(false);
      loadHabits();
    }
  }

  const completedCount = habits.filter((h) => h.is_completed_today).length;
  const progressPercent = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Kunlik Odatlar</h3>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{habits.length} bajarildi ({progressPercent}%)
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            tap();
            setShowAddModal(true);
          }}
          className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all text-xs flex items-center gap-1 font-medium"
        >
          <Plus size={14} />
          <span>Yangi</span>
        </button>
      </div>

      {/* Progress Bar */}
      {habits.length > 0 && (
        <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-2 mb-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-10 rounded-lg"></div>
          <div className="skeleton h-10 rounded-lg"></div>
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-4 text-xs text-muted-foreground">
          <p>Hozircha odatlar qo&apos;shilmagan.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 text-primary font-medium underline"
          >
            Birinchi odatingizni qo&apos;shing
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {habits.map((habit) => (
            <div
              key={habit.id}
              onClick={() => handleToggle(habit.id)}
              className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                habit.is_completed_today
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{habit.icon}</span>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      habit.is_completed_today ? 'line-through opacity-80' : ''
                    }`}
                  >
                    {habit.title}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span>{habit.category}</span>
                    {habit.current_streak > 0 && (
                      <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                        <Flame size={11} /> {habit.current_streak} kun streak
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                {habit.is_completed_today ? (
                  <CheckCircle2 size={20} className="text-emerald-500 fill-emerald-500/20" />
                ) : (
                  <Circle size={20} className="text-muted-foreground hover:text-primary" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Habit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-2xl p-5 border-t border-slate-200 dark:border-slate-800 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base">Yangi Odat Qo&apos;shish</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddHabit} className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Odat nomi</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Masalan: 30 daqiqa kitob o'qish"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-primary"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Emoji / Belgi</label>
                    <select
                      value={newIcon}
                      onChange={(e) => setNewIcon(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    >
                      <option value="⚡">⚡ Energiya</option>
                      <option value="📚">📚 Kitob</option>
                      <option value="🏃">🏃 Sport</option>
                      <option value="💧">💧 Suv</option>
                      <option value="💻">💻 Dasturlash</option>
                      <option value="🧘">🧘 Meditatsiya</option>
                      <option value="🌅">🌅 Erta uyg&apos;onish</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Toifa</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    >
                      <option value="Salomatlik">Salomatlik</option>
                      <option value="Ta'lim">Ta&apos;lim</option>
                      <option value="Sport">Sport</option>
                      <option value="Ish">Ish</option>
                      <option value="Ruhoniy">Ruhoniy</option>
                      <option value="Umumiy">Umumiy</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="w-full py-2.5 mt-2 rounded-xl bg-primary text-white font-medium text-sm transition-opacity disabled:opacity-50"
                >
                  Saqlash
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
