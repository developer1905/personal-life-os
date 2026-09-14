'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface FinanceWidgetProps {
  income: number;
  expense: number;
  currency: string;
}

export function FinanceWidget({ income, expense, currency }: FinanceWidgetProps) {
  const balance = income - expense;
  const isPositive = balance >= 0;

  function formatAmount(amount: number): string {
    if (Math.abs(amount) >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1_000) {
      return `${(amount / 1_000).toFixed(0)}K`;
    }
    return amount.toLocaleString();
  }

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <p style={{ fontSize: '12px', color: 'var(--tg-hint-color)', marginBottom: '4px' }}>
            Bu oylik balans
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 800,
                color: isPositive ? 'var(--accent-green)' : 'var(--accent-orange)',
              }}
            >
              {isPositive ? '+' : ''}{formatAmount(balance)}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--tg-hint-color)' }}>{currency}</span>
          </div>
        </div>
        <div
          style={{
            background: isPositive
              ? 'rgba(0,184,148,0.15)'
              : 'rgba(225,112,85,0.15)',
            borderRadius: '12px',
            padding: '10px',
            color: isPositive ? 'var(--accent-green)' : 'var(--accent-orange)',
          }}
        >
          <Wallet size={24} />
        </div>
      </div>

      {/* Income / Expense row */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div
          style={{
            flex: 1,
            background: 'rgba(0,184,148,0.08)',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              background: 'rgba(0,184,148,0.2)',
              borderRadius: '8px',
              padding: '6px',
            }}
          >
            <TrendingUp size={14} color="var(--accent-green)" />
          </div>
          <div>
            <p style={{ fontSize: '11px', color: 'var(--tg-hint-color)', marginBottom: '2px' }}>
              Kirim
            </p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-green)' }}>
              {formatAmount(income)}
            </p>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            background: 'rgba(225,112,85,0.08)',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              background: 'rgba(225,112,85,0.2)',
              borderRadius: '8px',
              padding: '6px',
            }}
          >
            <TrendingDown size={14} color="var(--accent-orange)" />
          </div>
          <div>
            <p style={{ fontSize: '11px', color: 'var(--tg-hint-color)', marginBottom: '2px' }}>
              Chiqim
            </p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-orange)' }}>
              {formatAmount(expense)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
