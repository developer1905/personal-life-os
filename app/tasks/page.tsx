'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, CheckCircle2, Circle, Bell, Trash2, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  getTasks,
  createTask,
  toggleTask,
  deleteTask,
  getReminders,
  createReminder,
  deleteReminder,
} from '@/app/actions/tasks';
import { useHaptic } from '@/hooks/useHaptic';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH';


type TaskItem = {
  id: string;
  title: string;
  description?: string | null;
  due_date?: Date | string | null;
  is_completed: boolean;
  priority: Priority;
  created_at: Date | string;
  user_id: string;
};

type ReminderItem = {
  id: string;
  title: string;
  description?: string | null;
  remind_at: Date | string;
  is_notified: boolean;
  user_id: string;
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Past', color: 'var(--accent-green)', bg: 'rgba(0,184,148,0.12)' },
  MEDIUM: { label: "O'rta", color: 'var(--accent-yellow)', bg: 'rgba(253,203,110,0.12)' },
  HIGH: { label: 'Yuqori', color: 'var(--accent-orange)', bg: 'rgba(225,112,85,0.12)' },
};

type ActiveTab = 'tasks' | 'reminders';

export default function TasksPage() {
  const { user } = useAuth();
  const { tap, success } = useHaptic();
  const [activeTab, setActiveTab] = useState<ActiveTab>('tasks');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Task form
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'MEDIUM' as Priority,
  });

  // Reminder form
  const [reminderForm, setReminderForm] = useState({
    title: '',
    description: '',
    remind_at: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [tasksResult, remindersResult] = await Promise.all([
      getTasks(user.id),
      getReminders(user.id),
    ]);
    setTasks((tasksResult.tasks || []) as TaskItem[]);
    setReminders((remindersResult.reminders || []) as ReminderItem[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleToggleTask(id: string) {
    if (!user) return;
    tap();
    const result = await toggleTask(id, user.id);
    if (result.success) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, is_completed: !t.is_completed } : t
        )
      );
    }
  }

  async function handleDeleteTask(id: string) {
    if (!user) return;
    tap();
    await deleteTask(id, user.id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleDeleteReminder(id: string) {
    if (!user) return;
    tap();
    await deleteReminder(id, user.id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleSubmitTask() {
    if (!user || !taskForm.title) return;
    setSubmitting(true);
    const result = await createTask({
      userId: user.id,
      title: taskForm.title,
      description: taskForm.description || undefined,
      due_date: taskForm.due_date || undefined,
      priority: taskForm.priority,
    });
    if (result.success && result.task) {
      success();
      setTasks((prev) => [result.task as TaskItem, ...prev]);
      setTaskForm({ title: '', description: '', due_date: '', priority: 'MEDIUM' });
      setShowModal(false);
    }
    setSubmitting(false);
  }

  async function handleSubmitReminder() {
    if (!user || !reminderForm.title || !reminderForm.remind_at) return;
    setSubmitting(true);
    const result = await createReminder({
      userId: user.id,
      title: reminderForm.title,
      description: reminderForm.description || undefined,
      remind_at: reminderForm.remind_at,
    });
    if (result.success && result.reminder) {
      success();
      setReminders((prev) => [...prev, result.reminder as ReminderItem]);
      setReminderForm({ title: '', description: '', remind_at: '' });
      setShowModal(false);
    }
    setSubmitting(false);
  }

  const pendingTasks = tasks.filter((t) => !t.is_completed);
  const completedTasks = tasks.filter((t) => t.is_completed);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h1 className="section-title">✅ Rejalar & Eslatmalar</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => { tap(); setActiveTab('tasks'); }}
          style={{ flex: 1 }}
        >
          📋 Vazifalar ({pendingTasks.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'reminders' ? 'active' : ''}`}
          onClick={() => { tap(); setActiveTab('reminders'); }}
          style={{ flex: 1 }}
        >
          🔔 Eslatmalar ({reminders.length})
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '14px' }} />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'tasks' ? (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {pendingTasks.length === 0 && completedTasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <CheckCircle2 size={28} />
                  </div>
                  <p className="empty-state-title">Vazifalar yo&apos;q</p>
                  <p className="empty-state-desc">Yangi vazifa qo&apos;shing</p>
                </div>
              ) : (
                <div>
                  {pendingTasks.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tg-hint-color)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        Bajarilmagan ({pendingTasks.length})
                      </p>
                      <div className="card" style={{ padding: 0 }}>
                        {pendingTasks.map((task, i) => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            isLast={i === pendingTasks.length - 1}
                            onToggle={() => handleToggleTask(task.id)}
                            onDelete={() => handleDeleteTask(task.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {completedTasks.length > 0 && (
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tg-hint-color)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        Bajarilgan ({completedTasks.length})
                      </p>
                      <div className="card" style={{ padding: 0, opacity: 0.7 }}>
                        {completedTasks.map((task, i) => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            isLast={i === completedTasks.length - 1}
                            onToggle={() => handleToggleTask(task.id)}
                            onDelete={() => handleDeleteTask(task.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="reminders"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {reminders.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Bell size={28} />
                  </div>
                  <p className="empty-state-title">Eslatmalar yo&apos;q</p>
                  <p className="empty-state-desc">Muhim narsalarni eslatma sifatida saqlang</p>
                </div>
              ) : (
                <div className="card" style={{ padding: 0 }}>
                  {reminders.map((reminder, i) => (
                    <ReminderRow
                      key={reminder.id}
                      reminder={reminder}
                      isLast={i === reminders.length - 1}
                      onDelete={() => handleDeleteReminder(reminder.id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* FAB */}
      <button className="fab" onClick={() => { tap(); setShowModal(true); }}>
        <Plus size={24} />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              className="modal-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            >
              <div className="modal-handle" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                  {activeTab === 'tasks' ? '📋 Yangi vazifa' : '🔔 Yangi eslatma'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tg-hint-color)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {activeTab === 'tasks' ? (
                <>
                  <div className="form-group">
                    <label className="input-label">Sarlavha</label>
                    <input
                      className="input"
                      placeholder="Vazifa nomi..."
                      value={taskForm.title}
                      onChange={(e) => setTaskForm((p) => ({ ...p, title: e.target.value }))}
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="input-label">Tavsif (ixtiyoriy)</label>
                    <textarea
                      className="input"
                      placeholder="Qo'shimcha ma'lumot..."
                      value={taskForm.description}
                      onChange={(e) => setTaskForm((p) => ({ ...p, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label className="input-label">Muddat</label>
                      <input
                        type="date"
                        className="input"
                        value={taskForm.due_date}
                        onChange={(e) => setTaskForm((p) => ({ ...p, due_date: e.target.value }))}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="input-label">Muhimlik</label>
                      <select
                        className="input"
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm((p) => ({ ...p, priority: e.target.value as Priority }))}
                      >
                        <option value="LOW">Past</option>
                        <option value="MEDIUM">O&apos;rta</option>
                        <option value="HIGH">Yuqori</option>
                      </select>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={handleSubmitTask}
                    disabled={submitting || !taskForm.title}
                  >
                    {submitting ? 'Qo\'shilmoqda...' : 'Qo\'shish'}
                  </button>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="input-label">Eslatma sarlavhasi</label>
                    <input
                      className="input"
                      placeholder="Nima eslatish kerak?"
                      value={reminderForm.title}
                      onChange={(e) => setReminderForm((p) => ({ ...p, title: e.target.value }))}
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="input-label">Eslatma vaqti</label>
                    <input
                      type="datetime-local"
                      className="input"
                      value={reminderForm.remind_at}
                      onChange={(e) => setReminderForm((p) => ({ ...p, remind_at: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="input-label">Izoh (ixtiyoriy)</label>
                    <textarea
                      className="input"
                      placeholder="Qo'shimcha ma'lumot..."
                      value={reminderForm.description}
                      onChange={(e) => setReminderForm((p) => ({ ...p, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={handleSubmitReminder}
                    disabled={submitting || !reminderForm.title || !reminderForm.remind_at}
                  >
                    {submitting ? 'Qo\'shilmoqda...' : 'Saqlash'}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskRow({
  task,
  isLast,
  onToggle,
  onDelete,
}: {
  task: TaskItem;
  isLast: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const pConfig = PRIORITY_CONFIG[task.priority];
  const isOverdue = task.due_date && !task.is_completed && new Date(task.due_date) < new Date();

  return (
    <motion.div
      layout
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <button
        onClick={onToggle}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
      >
        {task.is_completed ? (
          <CheckCircle2 size={22} color="var(--accent-green)" fill="rgba(0,184,148,0.2)" />
        ) : (
          <Circle size={22} color={pConfig.color} />
        )}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: '15px',
            fontWeight: 500,
            textDecoration: task.is_completed ? 'line-through' : 'none',
            opacity: task.is_completed ? 0.6 : 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {task.title}
        </p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '3px', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '999px',
              background: pConfig.bg,
              color: pConfig.color,
              fontWeight: 600,
            }}
          >
            {pConfig.label}
          </span>
          {task.due_date && (
            <span
              style={{
                fontSize: '11px',
                color: isOverdue ? 'var(--accent-orange)' : 'var(--tg-hint-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <Calendar size={10} />
              {new Date(task.due_date).toLocaleDateString('uz-UZ', {
                month: 'short',
                day: 'numeric',
              })}
              {isOverdue && ' (muddati o\'tgan)'}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onDelete}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--tg-hint-color)',
          padding: '4px',
          flexShrink: 0,
        }}
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
}

function ReminderRow({
  reminder,
  isLast,
  onDelete,
}: {
  reminder: ReminderItem;
  isLast: boolean;
  onDelete: () => void;
}) {
  const isPast = new Date(reminder.remind_at) < new Date();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.06)',
        opacity: isPast ? 0.6 : 1,
      }}
    >
      <div
        style={{
          background: isPast ? 'rgba(255,255,255,0.08)' : 'rgba(108,92,231,0.15)',
          borderRadius: '10px',
          padding: '8px',
          flexShrink: 0,
        }}
      >
        <Bell size={16} color={isPast ? 'var(--tg-hint-color)' : 'var(--accent-primary)'} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '15px', fontWeight: 500 }}>{reminder.title}</p>
        <p
          style={{
            fontSize: '12px',
            color: isPast ? 'var(--tg-hint-color)' : 'var(--accent-primary)',
            marginTop: '2px',
          }}
        >
          {new Date(reminder.remind_at).toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
          {isPast && ' — o\'tib ketgan'}
        </p>
      </div>

      <button
        onClick={onDelete}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--tg-hint-color)',
          padding: '4px',
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
