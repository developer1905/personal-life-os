'use client';

import { motion } from 'framer-motion';
import { Activity, Footprints, Droplets, Flame } from 'lucide-react';
import { useHaptic } from '@/hooks/useHaptic';

interface StepsWidgetProps {
  steps: number;
  goal: number;
  calories?: number;
  waterMl?: number;
  userId: string;
}

export function StepsWidget({
  steps,
  goal,
  calories = 0,
  waterMl = 0,
}: StepsWidgetProps) {
  const { tap } = useHaptic();
  const percentage = Math.min((steps / goal) * 100, 100);
  const isGoalReached = steps >= goal;

  return (
    <motion.div
      className="gradient-card-primary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      onClick={tap}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: 'absolute',
          bottom: '-20px',
          left: '-20px',
          width: '120px',
          height: '120px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px',
          position: 'relative',
        }}
      >
        <div>
          <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
            Bugungi qadamlar
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '36px', fontWeight: 800 }}>
              {steps.toLocaleString()}
            </span>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>/ {goal.toLocaleString()}</span>
          </div>
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '12px',
            padding: '10px',
          }}
        >
          <Footprints size={24} />
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '999px',
          height: '8px',
          marginBottom: '16px',
          overflow: 'hidden',
        }}
      >
        <motion.div
          style={{
            height: '100%',
            background: isGoalReached
              ? 'rgba(255,255,255,1)'
              : 'rgba(255,255,255,0.9)',
            borderRadius: '999px',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        />
      </div>

      {/* Sub stats */}
      <div style={{ display: 'flex', gap: '16px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Flame size={14} style={{ opacity: 0.8 }} />
          <span style={{ fontSize: '13px', opacity: 0.9 }}>
            {calories} kcal
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Droplets size={14} style={{ opacity: 0.8 }} />
          <span style={{ fontSize: '13px', opacity: 0.9 }}>
            {(waterMl / 1000).toFixed(1)}L suv
          </span>
        </div>
        {isGoalReached && (
          <div
            style={{
              marginLeft: 'auto',
              fontSize: '12px',
              background: 'rgba(255,255,255,0.25)',
              padding: '3px 10px',
              borderRadius: '999px',
            }}
          >
            🎯 Maqsad!
          </div>
        )}
      </div>

      {/* Activity indicator */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '60px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          opacity: 0.7,
        }}
      >
        <Activity size={12} />
        <span style={{ fontSize: '11px' }}>{percentage.toFixed(0)}%</span>
      </div>
    </motion.div>
  );
}
