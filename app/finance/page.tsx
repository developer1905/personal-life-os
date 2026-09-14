'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, TrendingUp, TrendingDown, Trash2, Receipt } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  getFinances,
  createFinance,
  deleteFinance,
  getMonthlyStats,
  getMonthlyChartData,
} from '@/app/actions/finance';
import { useHaptic } from '@/hooks/useHaptic';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,

} from 'recharts';

type FinanceType = 'INCOME' | 'EXPENSE';

type FinanceItem = {
  id: string;

  amount: string;
  type: FinanceType;
  category: string;
  receipt_image?: string | null;
  note?: string | null;
  date: Date | string;
  user_id: string;
};

type MonthlyStats = {
  total_income: number;
  total_expense: number;
  balance: number;
  expenses_by_category: Array<{ category: string; amount: number }>;
};

type ChartData = Array<{ month: string; income: number; expense: number }>;

const EXPENSE_CATEGORIES = [
  'Oziq-ovqat', 'Transport', 'Kommunal', 'Kiyim-kechak',
  'Salomatlik', 'Ta\'lim', "Ko'ngilochar", 'Uy-joy',
  'Texnologiya', 'Boshqa',
];

const INCOME_CATEGORIES = [
  'Ish haqi', 'Freelance', 'Biznes', 'Investitsiya',
  'Sovg\'a', 'Boshqa',
];

export default function FinancePage() {
  const { user } = useAuth();
  const { tap, success } = useHaptic();
  const [transactions, setTransactions] = useState<FinanceItem[]>([]);
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [chartData, setChartData] = useState<ChartData>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeType, setActiveType] = useState<FinanceType>('EXPENSE');

  const [form, setForm] = useState({
    amount: '',
    type: 'EXPENSE' as FinanceType,
    category: '',
    note: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [finResult, statsResult, chartResult] = await Promise.all([
      getFinances(user.id, { limit: 30 }),
      getMonthlyStats(user.id),
      getMonthlyChartData(user.id),
    ]);
    setTransactions((finResult.finances || []) as FinanceItem[]);
    setStats(statsResult.stats || null);
    setChartData(chartResult.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function formatAmount(amount: number | string) {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('uz-UZ');
  }

  async function handleSubmit() {
    if (!user || !form.amount || !form.category) return;
    setSubmitting(true);

    let receiptUrl: string | undefined;
    if (receiptFile) {
      const fd = new FormData();
      fd.append('file', receiptFile);
      fd.append('bucket', 'receipt-images');
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) receiptUrl = data.url;
      } catch (e) {
        console.error('Receipt upload failed:', e);
      }
    }

    const result = await createFinance({
      userId: user.id,
      amount: parseFloat(form.amount),
      type: form.type,
      category: form.category,
      note: form.note || undefined,
      date: form.date,
      receipt_image: receiptUrl,
    });

    if (result.success) {
      success();
      setForm({
        amount: '',
        type: 'EXPENSE',
        category: '',
        note: '',
        date: new Date().toISOString().split('T')[0],
      });
      setReceiptFile(null);
      setShowModal(false);
      loadData();
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!user) return;
    tap();
    await deleteFinance(id, user.id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    loadData();
  }

  const filteredTransactions = transactions.filter((t) => t.type === activeType);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h1 className="section-title">💰 Moliya</h1>
      </div>

      {/* Balance card */}
      {stats && (
        <motion.div
          style={{
            background: stats.balance >= 0 ? 'var(--gradient-success)' : 'var(--gradient-danger)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '120px',
              height: '120px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
            }}
          />
          <p style={{ fontSize: '12px', opacity: 0.85, marginBottom: '4px' }}>
            Bu oylik balans
          </p>
          <p style={{ fontSize: '34px', fontWeight: 800, marginBottom: '16px' }}>
            {stats.balance >= 0 ? '+' : ''}{formatAmount(stats.balance)}{' '}
            <span style={{ fontSize: '16px', opacity: 0.8 }}>{user?.currency}</span>
          </p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div>
              <p style={{ fontSize: '11px', opacity: 0.8 }}>Kirim</p>
              <p style={{ fontSize: '17px', fontWeight: 700 }}>
                {formatAmount(stats.total_income)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '11px', opacity: 0.8 }}>Chiqim</p>
              <p style={{ fontSize: '17px', fontWeight: 700 }}>
                {formatAmount(stats.total_expense)}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--tg-hint-color)' }}>
            So&apos;nggi 6 oy
          </p>
          <div style={{ height: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-green)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent-green)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-orange)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent-orange)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--tg-hint-color)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--tg-hint-color)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--tg-secondary-bg-color)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Kirim"
                  stroke="var(--accent-green)"
                  fill="url(#incomeGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Chiqim"
                  stroke="var(--accent-orange)"
                  fill="url(#expenseGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className={`tab-btn ${activeType === 'EXPENSE' ? 'active' : ''}`}
          style={{ flex: 1 }}
          onClick={() => { tap(); setActiveType(FinanceType.EXPENSE); }}
        >
          📉 Chiqimlar
        </button>
        <button
          className={`tab-btn ${activeType === 'INCOME' ? 'active' : ''}`}
          style={{ flex: 1 }}
          onClick={() => { tap(); setActiveType(FinanceType.INCOME); }}
        >
          📈 Kirimlar
        </button>
      </div>

      {/* Transactions */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '68px', borderRadius: '14px' }} />
          ))}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <span style={{ fontSize: '28px' }}>💳</span>
          </div>
          <p className="empty-state-title">Operatsiyalar yo&apos;q</p>
          <p className="empty-state-desc">Birinchi operatsiyani qo&apos;shing</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <AnimatePresence>
            {filteredTransactions.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderBottom:
                    i === filteredTransactions.length - 1
                      ? 'none'
                      : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    background:
                      tx.type === 'INCOME'
                        ? 'rgba(0,184,148,0.15)'
                        : 'rgba(225,112,85,0.15)',
                    borderRadius: '10px',
                    padding: '8px',
                    flexShrink: 0,
                  }}
                >
                  {tx.type === 'INCOME' ? (
                    <TrendingUp size={16} color="var(--accent-green)" />
                  ) : (
                    <TrendingDown size={16} color="var(--accent-orange)" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '15px', fontWeight: 600 }}>{tx.category}</p>
                  {tx.note && (
                    <p style={{ fontSize: '12px', color: 'var(--tg-hint-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.note}
                    </p>
                  )}
                  <p style={{ fontSize: '11px', color: 'var(--tg-hint-color)', marginTop: '2px' }}>
                    {new Date(tx.date).toLocaleDateString('uz-UZ', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p
                      style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: tx.type === 'INCOME' ? 'var(--accent-green)' : 'var(--accent-orange)',
                      }}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}
                      {formatAmount(tx.amount)}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--tg-hint-color)' }}>
                      {user?.currency}
                    </p>
                  </div>
                  {tx.receipt_image && (
                    <Receipt size={12} color="var(--tg-hint-color)" />
                  )}
                  <button
                    onClick={() => handleDelete(tx.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tg-hint-color)', padding: '2px' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* FAB */}
      <button className="fab" onClick={() => { tap(); setShowModal(true); }}>
        <Plus size={24} />
      </button>

      {/* Add Transaction Modal */}
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
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>💳 Yangi operatsiya</h2>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tg-hint-color)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Type toggle */}
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  padding: '4px',
                  marginBottom: '16px',
                }}
              >
                {(['EXPENSE', 'INCOME'] as FinanceType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setForm((p) => ({ ...p, type, category: '' }))}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '14px',
                      transition: 'all 150ms',
                      background:
                        form.type === type
                          ? type === 'EXPENSE'
                            ? 'var(--gradient-danger)'
                            : 'var(--gradient-success)'
                          : 'transparent',
                      color: form.type === type ? 'white' : 'var(--tg-hint-color)',
                    }}
                  >
                    {type === 'EXPENSE' ? '📉 Chiqim' : '📈 Kirim'}
                  </button>
                ))}
              </div>

              {/* Amount */}
              <div className="form-group">
                <label className="input-label">Miqdor ({user?.currency})</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  style={{ fontSize: '24px', fontWeight: 700 }}
                  autoFocus
                />
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="input-label">Kategoriya</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(form.type === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setForm((p) => ({ ...p, category: cat }))}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '999px',
                        border: '1.5px solid',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                        transition: 'all 150ms',
                        background: form.category === cat ? 'var(--accent-primary)' : 'transparent',
                        borderColor: form.category === cat ? 'var(--accent-primary)' : 'rgba(255,255,255,0.15)',
                        color: form.category === cat ? 'white' : 'var(--tg-hint-color)',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Sana</label>
                  <input
                    type="date"
                    className="input"
                    value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Izoh (ixtiyoriy)</label>
                <input
                  className="input"
                  placeholder="Izoh..."
                  value={form.note}
                  onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                />
              </div>

              {/* Receipt upload */}
              <div className="form-group">
                <label className="input-label">Chek rasmi (ixtiyoriy)</label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    background: 'var(--tg-secondary-bg-color)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: '1.5px dashed rgba(255,255,255,0.15)',
                  }}
                >
                  <Receipt size={16} color="var(--tg-hint-color)" />
                  <span style={{ fontSize: '14px', color: 'var(--tg-hint-color)' }}>
                    {receiptFile ? receiptFile.name : 'Chek rasmini yuklash...'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={handleSubmit}
                disabled={submitting || !form.amount || !form.category}
              >
                {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
