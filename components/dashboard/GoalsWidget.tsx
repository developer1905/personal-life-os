'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, X, ArrowUpRight } from 'lucide-react';
import { getGoals, createGoal, addMoneyToGoal } from '@/app/actions/goals';
import { useHaptic } from '@/hooks/useHaptic';

interface GoalItem {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  category: string;
  icon: string;
  is_completed: boolean;
  progress_percentage: number;
}

export function GoalsWidget({ userId, currency = 'UZS' }: { userId: string; currency?: string }) {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newIcon, setNewIcon] = useState('🎯');
  const { tap, success } = useHaptic();

  useEffect(() => {
    if (!userId) return;
    loadGoals();
  }, [userId]);

  async function loadGoals() {
    setLoading(true);
    const res = await getGoals(userId);
    if (res.success && res.goals) {
      setGoals(res.goals);
    }
    setLoading(false);
  }

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newTarget) return;
    tap();

    const res = await createGoal(userId, {
      title: newTitle.trim(),
      target_amount: parseFloat(newTarget),
      icon: newIcon,
    });

    if (res.success) {
      success();
      setNewTitle('');
      setNewTarget('');
      setShowAddModal(false);
      loadGoals();
    }
  }

  async function handleAddDeposit(e: React.FormEvent) {
    e.preventDefault();
    if (!showDepositModal || !depositAmount) return;
    tap();

    const res = await addMoneyToGoal(showDepositModal, parseFloat(depositAmount));
    if (res.success) {
      success();
      setDepositAmount('');
      setShowDepositModal(null);
      loadGoals();
    }
  }

  function formatMoney(amount: number) {
    return amount.toLocaleString('uz-UZ');
  }

  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <Target size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Moliyaviy Maqsadlar</h3>
            <p className="text-xs text-muted-foreground">{goals.length} ta jamg&apos;arma</p>
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

      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-12 rounded-xl"></div>
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-4 text-xs text-muted-foreground">
          <p>Hozircha jamg&apos;arma maqsadlari yo&apos;q.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 text-primary font-medium underline"
          >
            Yangi maqsad belgilang
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{goal.icon}</span>
                  <div>
                    <span className="font-medium text-xs">{goal.title}</span>
                    {goal.is_completed && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">
                        Bajarildi! 🎉
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    tap();
                    setShowDepositModal(goal.id);
                  }}
                  className="px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-medium flex items-center gap-0.5"
                >
                  <ArrowUpRight size={12} /> Pul qo&apos;shish
                </button>
              </div>

              {/* Progress and numbers */}
              <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                <span>
                  {formatMoney(goal.current_amount)} {currency}
                </span>
                <span className="font-semibold text-foreground">{goal.progress_percentage}%</span>
                <span>
                  {formatMoney(goal.target_amount)} {currency}
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${goal.progress_percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-2xl p-5 border-t border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">Yangi Jamg&apos;arma Maqsadi</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-muted-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Maqsad nomi</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Masalan: Yangi MacBook yoki Sayr"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Maqsad summasi ({currency})
                </label>
                <input
                  type="number"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="Masalan: 15000000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Emoji</label>
                <select
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                >
                  <option value="🎯">🎯 Maqsad</option>
                  <option value="💻">💻 Noutbuk / Texnika</option>
                  <option value="🚗">🚗 Avtomobil</option>
                  <option value="✈️">✈️ Sayohat</option>
                  <option value="🏠">🏠 Uy-joy</option>
                  <option value="🎓">🎓 Ta&apos;lim</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!newTitle.trim() || !newTarget}
                className="w-full py-2.5 mt-2 rounded-xl bg-primary text-white font-medium text-sm disabled:opacity-50"
              >
                Saqlash
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-2xl p-5 border-t border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">Maqsadga Pul Qo&apos;shish</h3>
              <button
                onClick={() => setShowDepositModal(null)}
                className="p-1 text-muted-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddDeposit} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Qo&apos;shiladigan summa ({currency})
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Masalan: 500000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={!depositAmount}
                className="w-full py-2.5 mt-2 rounded-xl bg-emerald-600 text-white font-medium text-sm disabled:opacity-50"
              >
                Qo&apos;shish
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
