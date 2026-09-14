'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { StepsWidget } from '@/components/dashboard/StepsWidget';
import { FinanceWidget } from '@/components/dashboard/FinanceWidget';
import { TasksWidget } from '@/components/dashboard/TasksWidget';
import { HabitsWidget } from '@/components/dashboard/HabitsWidget';
import { FocusWidget } from '@/components/dashboard/FocusWidget';
import { GoalsWidget } from '@/components/dashboard/GoalsWidget';
import { MoodWidget } from '@/components/dashboard/MoodWidget';
import { AiAdvisorWidget } from '@/components/dashboard/AiAdvisorWidget';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { getTodayHealthLog, upsertHealthLog } from '@/app/actions/health';
import { getMonthlyStats } from '@/app/actions/finance';
import { getTasks } from '@/app/actions/tasks';
import { Droplets, Plus, Footprints } from 'lucide-react';
import { useHaptic } from '@/hooks/useHaptic';

interface DashboardData {
  steps: number;
  calories: number;
  waterMl: number;
  income: number;
  expense: number;
  tasks: Array<{
    id: string;
    title: string;
    is_completed: boolean;
    priority: string;
    due_date?: Date | string | null;
  }>;
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { tap, success } = useHaptic();
  const [data, setData] = useState<DashboardData>({
    steps: 0,
    calories: 0,
    waterMl: 0,
    income: 0,
    expense: 0,
    tasks: [],
  });
  const [loading, setLoading] = useState(true);
  const [stepsInput, setStepsInput] = useState('');
  const [showStepsInput, setShowStepsInput] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    setLoading(true);

    const [healthResult, financeResult, tasksResult] = await Promise.all([
      getTodayHealthLog(user.id),
      getMonthlyStats(user.id),
      getTasks(user.id, { limit: 10 }),
    ]);

    setData({
      steps: healthResult.log?.steps_count || 0,
      calories: healthResult.log?.calories_burned || 0,
      waterMl: healthResult.log?.water_intake_ml || 0,
      income: financeResult.stats?.total_income || 0,
      expense: financeResult.stats?.total_expense || 0,
      tasks: (tasksResult.tasks || []) as DashboardData['tasks'],
    });

    setLoading(false);
  }

  async function handleAddWater() {
    if (!user) return;
    tap();
    await upsertHealthLog({ userId: user.id, water_intake_ml: data.waterMl + 250 });
    setData((prev) => ({ ...prev, waterMl: prev.waterMl + 250 }));
    success();
  }

  async function handleUpdateSteps() {
    if (!user || !stepsInput) return;
    const steps = parseInt(stepsInput, 10);
    if (isNaN(steps) || steps < 0) return;
    await upsertHealthLog({ userId: user.id, steps_count: steps });
    setData((prev) => ({ ...prev, steps }));
    setStepsInput('');
    setShowStepsInput(false);
    success();
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Xayrli tong';
    if (hour < 17) return '☀️ Xayrli kun';
    if (hour < 21) return '🌆 Xayrli kech';
    return '🌙 Yaxshi kechalar';
  };

  const tasksLeft = data.tasks.filter((t) => !t.is_completed).length;

  return (
    <div className="page-wrapper">
      {/* Top Header with Theme Switcher */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-4"
      >
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">{greeting()}</p>
          <h1 className="text-2xl font-black tracking-tight">
            {user?.first_name || 'Foydalanuvchi'} 👋
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('uz-UZ', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="pt-1">
          <ThemeToggle />
        </div>
      </motion.div>

      {/* Main Dynamic Sections */}
      <div className="flex flex-col gap-4">
        {/* AI Smart Advisor */}
        <AiAdvisorWidget
          steps={data.steps}
          waterMl={data.waterMl}
          income={data.income}
          expense={data.expense}
          tasksLeft={tasksLeft}
        />

        {/* Health & Steps Tracker */}
        <StepsWidget
          steps={data.steps}
          goal={user?.step_goal || 10000}
          calories={data.calories}
          waterMl={data.waterMl}
          userId={user?.id || ''}
        />

        {/* Quick Health Actions */}
        <div className="flex gap-2.5">
          <motion.button
            className="btn btn-secondary flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold shadow-xs"
            onClick={handleAddWater}
            whileTap={{ scale: 0.96 }}
          >
            <Droplets size={16} className="text-cyan-500" />
            <span>+250ml suv</span>
          </motion.button>

          <motion.button
            className="btn btn-secondary flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold shadow-xs"
            onClick={() => {
              tap();
              setShowStepsInput(!showStepsInput);
            }}
            whileTap={{ scale: 0.96 }}
          >
            <Footprints size={16} className="text-primary" />
            <span>Qadam kiritish</span>
          </motion.button>
        </div>

        {/* Steps input */}
        {showStepsInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex gap-2"
          >
            <input
              type="number"
              className="input flex-1 text-sm"
              placeholder="Qadamlar sonini kiriting"
              value={stepsInput}
              onChange={(e) => setStepsInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateSteps()}
              autoFocus
            />
            <button
              className="btn btn-primary px-4 rounded-xl flex items-center justify-center"
              onClick={handleUpdateSteps}
            >
              <Plus size={18} />
            </button>
          </motion.div>
        )}

        {/* Habits & Streaks Widget */}
        <HabitsWidget userId={user?.id || '123456789'} />

        {/* Pomodoro Focus Timer */}
        <FocusWidget userId={user?.id || '123456789'} />

        {/* Daily Mood & Energy Tracker */}
        <MoodWidget userId={user?.id || '123456789'} />

        {/* Financial Overview Widget */}
        <FinanceWidget
          income={data.income}
          expense={data.expense}
          currency={user?.currency || 'UZS'}
        />

        {/* Financial Goals & Savings Widget */}
        <GoalsWidget
          userId={user?.id || '123456789'}
          currency={user?.currency || 'UZS'}
        />

        {/* Tasks Widget */}
        <TasksWidget tasks={data.tasks} />
      </div>
    </div>
  );
}
