'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Star, ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getContents, createContent, deleteContent } from '@/app/actions/content';
import { useHaptic } from '@/hooks/useHaptic';
import Image from 'next/image';

type ContentType = 'ARTICLE' | 'FACT' | 'BOOK_REVIEW' | 'MOVIE_REVIEW' | 'HOBBY';

type ContentItem = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  cover_image?: string | null;
  type: ContentType;
  rating?: number | null;
  tags: string[];
  created_at: Date | string;
};

const TYPE_LABELS: Record<ContentType, { label: string; emoji: string; color: string }> = {
  ARTICLE: { label: 'Maqola', emoji: '📰', color: 'var(--accent-primary)' },
  FACT: { label: 'Fakt', emoji: '💡', color: 'var(--accent-cyan)' },
  BOOK_REVIEW: { label: 'Kitob', emoji: '📚', color: 'var(--accent-secondary)' },
  MOVIE_REVIEW: { label: 'Kino', emoji: '🎬', color: 'var(--accent-pink)' },
  HOBBY: { label: 'Qiziqish', emoji: '🎯', color: 'var(--accent-green)' },
};

const FILTERS: Array<{ value: ContentType | 'ALL'; label: string; emoji: string }> = [
  { value: 'ALL', label: 'Hammasi', emoji: '✨' },
  { value: 'ARTICLE', label: 'Maqola', emoji: '📰' },
  { value: 'FACT', label: 'Fakt', emoji: '💡' },
  { value: 'BOOK_REVIEW', label: 'Kitob', emoji: '📚' },
  { value: 'MOVIE_REVIEW', label: 'Kino', emoji: '🎬' },
  { value: 'HOBBY', label: 'Qiziqish', emoji: '🎯' },
];

export default function FeedPage() {
  const { user } = useAuth();
  const { tap, success } = useHaptic();
  const [filter, setFilter] = useState<ContentType | 'ALL'>('ALL');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'ARTICLE' as ContentType,
    rating: 0,
    imageUrl: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadContent = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const result = await getContents(user.id, {
      type: filter === 'ALL' ? undefined : filter,
      limit: 30,
    });
    setItems((result.entries || []) as ContentItem[]);
    setLoading(false);
  }, [user, filter]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  async function handleSubmit() {
    if (!user || !formData.title || !formData.content) return;
    setSubmitting(true);

    let imageUrl = formData.imageUrl;

    // Rasm yuklash
    if (imageFile) {
      const fd = new FormData();
      fd.append('file', imageFile);
      fd.append('bucket', 'content-images');

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) imageUrl = data.url;
      } catch (e) {
        console.error('Image upload failed:', e);
      }
    }

    const result = await createContent({
      userId: user.id,
      title: formData.title,
      content: formData.content,
      type: formData.type,
      cover_image: imageUrl || undefined,
      rating: formData.rating > 0 ? formData.rating : undefined,
    });

    if (result.success) {
      success();
      setFormData({ title: '', content: '', type: 'ARTICLE', rating: 0, imageUrl: '' });
      setImageFile(null);
      setShowForm(false);
      loadContent();
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!user) return;
    tap();
    await deleteContent(id, user.id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h1 className="section-title">📓 Kundaligim</h1>
        <p className="section-subtitle">Bilim, fikr va qiziqishlarim</p>
      </div>

      {/* Filter tabs */}
      <div className="tabs" style={{ marginBottom: '16px' }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`tab-btn ${filter === f.value ? 'active' : ''}`}
            onClick={() => { tap(); setFilter(f.value); }}
          >
            {f.emoji} {f.label}
          </button>
        ))}
      </div>

      {/* Content list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <span style={{ fontSize: '28px' }}>📝</span>
          </div>
          <p className="empty-state-title">Hali yozuvlar yo&apos;q</p>
          <p className="empty-state-desc">
            Birinchi yozuvingizni qo&apos;shing!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <AnimatePresence>
            {items.map((item, i) => (
              <ContentCard
                key={item.id}
                item={item}
                index={i}
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* FAB */}
      <button className="fab" onClick={() => { tap(); setShowForm(true); }}>
        <Plus size={24} />
      </button>

      {/* Add Content Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              className="modal-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            >
              <div className="modal-handle" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                  Yangi yozuv
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tg-hint-color)', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Type selector */}
              <div className="form-group">
                <label className="input-label">Tur</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {Object.entries(TYPE_LABELS).map(([type, meta]) => (
                    <button
                      key={type}
                      onClick={() => setFormData((p) => ({ ...p, type: type as ContentType }))}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '999px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: '1.5px solid',
                        cursor: 'pointer',
                        transition: 'all 150ms',
                        background: formData.type === type ? meta.color : 'transparent',
                        borderColor: formData.type === type ? meta.color : 'rgba(255,255,255,0.15)',
                        color: formData.type === type ? 'white' : 'var(--tg-hint-color)',
                      }}
                    >
                      {meta.emoji} {meta.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="form-group">
                <label className="input-label">Sarlavha</label>
                <input
                  className="input"
                  placeholder="Sarlavhani kiriting..."
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                />
              </div>

              {/* Content */}
              <div className="form-group">
                <label className="input-label">Mazmun</label>
                <textarea
                  className="input"
                  placeholder="Fikrlaringizni yozing..."
                  value={formData.content}
                  onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* Rating (for reviews) */}
              {(formData.type === 'BOOK_REVIEW' || formData.type === 'MOVIE_REVIEW') && (
                <div className="form-group">
                  <label className="input-label">Baho (1-10)</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => setFormData((p) => ({ ...p, rating: n }))}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: n <= formData.rating ? 'var(--accent-yellow)' : 'rgba(255,255,255,0.1)',
                          color: n <= formData.rating ? '#000' : 'var(--tg-hint-color)',
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Image upload */}
              <div className="form-group">
                <label className="input-label">Muqova rasm (ixtiyoriy)</label>
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
                  <ImageIcon size={18} color="var(--tg-hint-color)" />
                  <span style={{ fontSize: '14px', color: 'var(--tg-hint-color)' }}>
                    {imageFile ? imageFile.name : 'Rasm tanlash...'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={handleSubmit}
                disabled={submitting || !formData.title || !formData.content}
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

function ContentCard({
  item,
  index,
  onDelete,
}: {
  item: ContentItem;
  index: number;
  onDelete: () => void;
}) {
  const { tap } = useHaptic();
  const meta = TYPE_LABELS[item.type];

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Cover image */}
      {item.cover_image && (
        <div style={{ marginBottom: '12px', borderRadius: '12px', overflow: 'hidden' }}>
          <Image
            src={item.cover_image}
            alt={item.title}
            width={400}
            height={200}
            style={{ width: '100%', height: '160px', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Type badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span
          className="badge"
          style={{ background: `${meta.color}20`, color: meta.color }}
        >
          {meta.emoji} {meta.label}
        </span>
        <button
          onClick={() => { tap(); onDelete(); }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--tg-hint-color)',
            padding: '4px',
          }}
        >
          <X size={14} />
        </button>
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
        {item.title}
      </h3>

      <p
        style={{
          fontSize: '14px',
          color: 'var(--tg-hint-color)',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {item.content}
      </p>

      {/* Rating */}
      {item.rating && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
          {Array.from({ length: Math.round(item.rating / 2) }).map((_, i) => (
            <Star key={i} size={12} fill="var(--accent-yellow)" color="var(--accent-yellow)" />
          ))}
          <span style={{ fontSize: '12px', color: 'var(--tg-hint-color)', marginLeft: '4px' }}>
            {item.rating}/10
          </span>
        </div>
      )}

      <p style={{ fontSize: '12px', color: 'var(--tg-hint-color)', marginTop: '8px' }}>
        {new Date(item.created_at).toLocaleDateString('uz-UZ', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </p>
    </motion.div>
  );
}
