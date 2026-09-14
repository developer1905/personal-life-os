'use client';

import { motion } from 'framer-motion';
import { CheckSquare, Clock, AlertCircle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  priority: string;
  due_date?: Date | string | null;
}

interface TasksWidgetProps {
  tasks: Task[];
}

const priorityColors: Record<string, string> = {
  LOW: 'var(--accent-green)',
  MEDIUM: 'var(--accent-yellow)',
  HIGH: 'var(--accent-orange)',
};

export function TasksWidget({ tasks }: TasksWidgetProps) {
  const pending = tasks.filter((t) => !t.is_completed);
  const completed = tasks.filter((t) => t.is_completed);
  const overdue = pending.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date()
  );

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckSquare size={18} color="var(--accent-primary)" />
          <span style={{ fontWeight: 700, fontSize: '15px' }}>
            Bugungi vazifalar
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {overdue.length > 0 && (
            <span
              style={{
                background: 'rgba(225,112,85,0.2)',
                color: 'var(--accent-orange)',
                fontSize: '12px',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <AlertCircle size={10} />
              {overdue.length} muddati o&apos;tgan
            </span>
          )}
          <span
            style={{
              background: 'rgba(108,92,231,0.15)',
              color: 'var(--accent-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: '999px',
            }}
          >
            {completed.length}/{tasks.length}
          </span>
        </div>
      </div>

      {/* Task list (max 4) */}
      {pending.length === 0 && completed.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '20px',
            color: 'var(--tg-hint-color)',
            fontSize: '14px',
          }}
        >
          Bugun uchun vazifalar yo&apos;q 🎉
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...pending.slice(0, 3), ...completed.slice(0, 1)].map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 0',
                borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                opacity: task.is_completed ? 0.5 : 1,
              }}
            >
              {/* Priority dot */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: priorityColors[task.priority] || 'var(--accent-primary)',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: '14px',
                  textDecoration: task.is_completed ? 'line-through' : 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {task.title}
              </span>
              {task.due_date && !task.is_completed && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '11px',
                    color:
                      new Date(task.due_date) < new Date()
                        ? 'var(--accent-orange)'
                        : 'var(--tg-hint-color)',
                  }}
                >
                  <Clock size={10} />
                  {new Date(task.due_date).toLocaleDateString('uz-UZ', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Completion bar */}
      {tasks.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              style={{ background: 'var(--gradient-primary)' }}
              initial={{ width: 0 }}
              animate={{
                width: `${(completed.length / tasks.length) * 100}%`,
              }}
              transition={{ duration: 0.6, delay: 0.5 }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
