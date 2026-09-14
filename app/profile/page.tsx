'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Download,
  ChevronRight,
  Target,
  Globe,
  Trash2,
  User,
  Info,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { updateUserSettings, exportUserData } from '@/app/actions/user';
import { useHaptic } from '@/hooks/useHaptic';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import Image from 'next/image';

const CURRENCIES = [
  { code: 'UZS', name: "O'zbek so'mi", symbol: "so'm" },
  { code: 'USD', name: 'AQSh dollari', symbol: '$' },
  { code: 'EUR', name: 'Yevro', symbol: '€' },
  { code: 'RUB', name: 'Rossiya rubli', symbol: '₽' },
];

export default function ProfilePage() {
  const { user, tgUser, refetch } = useAuth();
  const { tap, success, error: hapticError } = useHaptic();
  const [editing, setEditing] = useState(false);
  const [stepGoal, setStepGoal] = useState(user?.step_goal?.toString() || '10000');
  const [currency, setCurrency] = useState(user?.currency || 'UZS');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  async function handleSaveSettings() {
    if (!user) return;
    setSaving(true);
    tap();

    const result = await updateUserSettings(user.id, {
      step_goal: parseInt(stepGoal, 10),
      currency,
    });

    if (result.success) {
      success();
      setEditing(false);
      await refetch();
    } else {
      hapticError();
    }
    setSaving(false);
  }

  async function handleExport() {
    if (!user) return;
    setExporting(true);
    tap();

    const result = await exportUserData(user.id);

    if (result.success && result.data) {
      // JSON faylini yuklab olish
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personal-life-os-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }
    setExporting(false);
  }

  function handleClearCache() {
    tap();
    // LocalStorage va cache tozalash
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    success();
  }

  const avatarText = user?.first_name?.[0]?.toUpperCase() || '?';

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="section-title" style={{ margin: 0 }}>👤 Profil &amp; Sozlamalar</h1>
        <ThemeToggle />
      </div>

      {/* Profile card */}
      <motion.div
        className="gradient-card-primary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
          {/* Avatar */}
          {tgUser?.photo_url ? (
            <Image
              src={tgUser.photo_url}
              alt="Profile"
              width={64}
              height={64}
              className="avatar"
              style={{ width: '64px', height: '64px' }}
            />
          ) : (
            <div
              className="avatar"
              style={{
                width: '64px',
                height: '64px',
                fontSize: '26px',
                background: 'rgba(255,255,255,0.2)',
              }}
            >
              {avatarText}
            </div>
          )}

          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
              {user?.first_name} {user?.last_name || ''}
            </h2>
            {user?.username && (
              <p style={{ fontSize: '14px', opacity: 0.8, margin: '2px 0' }}>
                @{user.username}
              </p>
            )}
            <p style={{ fontSize: '12px', opacity: 0.7, margin: 0 }}>
              A&apos;zo bo&apos;lgan:{' '}
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('uz-UZ', {
                    year: 'numeric',
                    month: 'long',
                  })
                : ''}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Settings sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Goals & Preferences */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={18} color="var(--accent-primary)" />
              <span style={{ fontWeight: 700, fontSize: '15px' }}>Sozlamalar</span>
            </div>
            {!editing ? (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { tap(); setEditing(true); }}
              >
                Tahrirlash
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { tap(); setEditing(false); }}
                >
                  Bekor
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveSettings}
                  disabled={saving}
                >
                  {saving ? '...' : 'Saqlash'}
                </button>
              </div>
            )}
          </div>

          {/* Step goal */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Target size={16} color="var(--tg-hint-color)" />
              <span style={{ fontSize: '14px', color: 'var(--tg-hint-color)' }}>
                Kunlik qadam maqsadi
              </span>
            </div>
            {editing ? (
              <input
                type="number"
                className="input"
                value={stepGoal}
                onChange={(e) => setStepGoal(e.target.value)}
                min="1000"
                max="50000"
                step="500"
              />
            ) : (
              <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-primary)' }}>
                {parseInt(stepGoal).toLocaleString()} qadam
              </p>
            )}
          </div>

          {/* Currency */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Globe size={16} color="var(--tg-hint-color)" />
              <span style={{ fontSize: '14px', color: 'var(--tg-hint-color)' }}>Valyuta</span>
            </div>
            {editing ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '999px',
                      border: '1.5px solid',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      background: currency === c.code ? 'var(--accent-primary)' : 'transparent',
                      borderColor: currency === c.code ? 'var(--accent-primary)' : 'rgba(255,255,255,0.15)',
                      color: currency === c.code ? 'white' : 'var(--tg-hint-color)',
                    }}
                  >
                    {c.symbol} {c.code}
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '18px', fontWeight: 700 }}>
                {CURRENCIES.find((c) => c.code === currency)?.symbol}{' '}
                {currency} — {CURRENCIES.find((c) => c.code === currency)?.name}
              </p>
            )}
          </div>
        </motion.div>

        {/* Data management */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ padding: 0 }}
        >
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Info size={16} color="var(--tg-hint-color)" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tg-hint-color)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Ma&apos;lumotlarni boshqarish
              </span>
            </div>
          </div>

          {/* Export JSON */}
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                background: 'rgba(0,184,148,0.12)',
                borderRadius: '10px',
                padding: '8px',
              }}
            >
              <Download size={16} color="var(--accent-green)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--tg-text-color)' }}>
                {exportSuccess ? '✅ Yuklab olindi!' : "Ma'lumotlarni eksport qilish"}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--tg-hint-color)' }}>JSON formatida</p>
            </div>
            <ChevronRight size={16} color="var(--tg-hint-color)" />
          </button>

          {/* Clear cache */}
          <button
            onClick={handleClearCache}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                background: 'rgba(225,112,85,0.12)',
                borderRadius: '10px',
                padding: '8px',
              }}
            >
              <Trash2 size={16} color="var(--accent-orange)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--tg-text-color)' }}>
                Keshni tozalash
              </p>
              <p style={{ fontSize: '12px', color: 'var(--tg-hint-color)' }}>
                Local saqlash va keshni o&apos;chirish
              </p>
            </div>
            <ChevronRight size={16} color="var(--tg-hint-color)" />
          </button>
        </motion.div>

        {/* Telegram info */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <User size={16} color="var(--tg-hint-color)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tg-hint-color)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Telegram ma&apos;lumotlari
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <InfoRow label="ID" value={user?.id?.toString() || '-'} />
            <InfoRow label="Ism" value={`${user?.first_name || ''} ${user?.last_name || ''}`.trim()} />
            <InfoRow label="Username" value={user?.username ? `@${user.username}` : 'Yo\'q'} />
          </div>
        </motion.div>

        {/* App info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ textAlign: 'center', padding: '16px', color: 'var(--tg-hint-color)' }}
        >
          <p style={{ fontSize: '13px', marginBottom: '4px' }}>Personal Life OS</p>
          <p style={{ fontSize: '12px', opacity: 0.7 }}>v1.0.0 • Telegram Mini App</p>
          <p style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px' }}>
            Powered by Next.js + Supabase
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '14px', color: 'var(--tg-hint-color)' }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: 500 }}>{value}</span>
    </div>
  );
}
