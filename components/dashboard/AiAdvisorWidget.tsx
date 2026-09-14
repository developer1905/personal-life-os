'use client';

import { useMemo } from 'react';
import { Bot, Lightbulb, TrendingUp, Sparkles } from 'lucide-react';

interface AdvisorProps {
  steps: number;
  waterMl: number;
  income: number;
  expense: number;
  tasksLeft: number;
}

export function AiAdvisorWidget({ steps, waterMl, income, expense, tasksLeft }: AdvisorProps) {
  const tips = useMemo(() => {
    const list: Array<{ text: string; tag: string; icon: string }> = [];

    // Health advice
    if (steps < 5000) {
      list.push({
        text: "Bugun harakatingiz 5 000 qadamdan kam. Kechki 20 daqiqalik piyoda sayr kardiologik salomatlikni yaxshilaydi.",
        tag: 'Salomatlik',
        icon: '🚶',
      });
    } else {
      list.push({
        text: `Ajoyib faollik! ${steps.toLocaleString()} qadam bosib, kunlik me'yorni a'lo darajada bajaryapsiz.`,
        tag: 'Faollik',
        icon: '🔥',
      });
    }

    if (waterMl < 1500) {
      list.push({
        text: "Suv ichish me'yori yetarli emas. Miya faoliyati va tetiklik uchun kamida 2 litr toza suv iching.",
        tag: 'Gidratatsiya',
        icon: '💧',
      });
    }

    // Finance advice
    if (expense > 0 && income > 0 && expense > income * 0.7) {
      list.push({
        text: "Oylik xarajatlar daromadning 70% dan oshdi. Ixtiyoriy xarajatlarni qayta ko'rib chiqish tavsiya etiladi.",
        tag: 'Moliya',
        icon: '⚠️',
      });
    } else {
      list.push({
        text: "Moliyaviy intizom joyida. Ortiqcha mablag'ni 'Jamg'arma Maqsadlari'ga yo'naltirish ayni vaqti.",
        tag: 'Investitsiya',
        icon: '💡',
      });
    }

    // Tasks advice
    if (tasksLeft > 0) {
      list.push({
        text: `Bugun yana ${tasksLeft} ta muhim rejangiz bor. Pomodoro taymerida 25 daqiqa fokuslanib bajaring!`,
        tag: 'Unumdorlik',
        icon: '🎯',
      });
    }

    return list;
  }, [steps, waterMl, income, expense, tasksLeft]);

  return (
    <div className="card p-4 mb-4 border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Bot size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm">AI Shaxsiy Maslahatchi</h3>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                Smart 2.0
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Bugungi holatingiz bo&apos;yicha tavsiyalar</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {tips.slice(0, 2).map((tip, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs flex items-start gap-2.5"
          >
            <span className="text-base shrink-0 mt-0.5">{tip.icon}</span>
            <div>
              <span className="font-semibold text-[10px] text-blue-600 dark:text-blue-400 block mb-0.5">
                {tip.tag}
              </span>
              <p className="text-foreground leading-relaxed">{tip.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
