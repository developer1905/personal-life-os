# Personal Life OS — Telegram Mini App

Telegram ichida ishlaydigan to'liq funksiyali shaxsiy boshqaruv markazi.

## Texnologik Stek

- **Frontend/Backend**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4, Framer Motion
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL) + Prisma ORM
- **Auth**: Telegram initData HMAC-SHA256
- **Storage**: Supabase Storage
- **Charts**: Recharts
- **Deploy**: Vercel

## Xususiyatlar

- 🏠 **Dashboard** — Kunlik xulosa (qadamlar, moliya, vazifalar)
- 📓 **Kundalik** — Maqolalar, faktlar, kitob va kino sharhlari
- ✅ **Vazifalar** — Checklist va eslatmalar
- 💰 **Moliya** — Kirim/chiqim hisobi, grafiklar
- 👤 **Profil** — Sozlamalar, eksport

## Ishga tushirish

### 1. Loyihani klonlash
```bash
git clone <repo-url>
cd personal-life-os
npm install
```

### 2. Supabase sozlash

1. [supabase.com](https://supabase.com) ga o'ting va yangi loyiha yarating
2. **Settings > API** dan URL va kalitlarni oling
3. **Storage** bo'limida 3 ta bucket yarating:
   - `content-images` (Public)
   - `receipt-images` (Public)
   - `profile-photos` (Public)

### 3. Telegram Bot yaratish

1. [@BotFather](https://t.me/BotFather) ga murojaat qiling
2. `/newbot` buyrug'ini yuboring va botni yarating
3. Bot tokenini saqlang

### 4. Muhit o'zgaruvchilari

`.env.example` faylini `.env.local` ga nusxalang va to'ldiring:
```bash
cp .env.example .env.local
```

```env
TELEGRAM_BOT_TOKEN=your_bot_token
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

### 5. Ma'lumotlar bazasi migratsiyasi

```bash
# Prisma clientni generatsiya qilish
npm run db:generate

# Ma'lumotlar bazasi jadvallarini yaratish
npm run db:push
```

### 6. Development serverni ishga tushirish

```bash
npm run dev
```

Ilova `http://localhost:3000` da ochiladi.

---

## Vercel ga Deploy qilish

### 1. Vercel CLI orqali

```bash
npm install -g vercel
vercel login
vercel --prod
```

### 2. Vercel Dashboard orqali

1. [vercel.com](https://vercel.com) ga kiring
2. "New Project" > GitHub repo ni ulang
3. Environment Variables ni qo'shing:
   - `TELEGRAM_BOT_TOKEN`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `DIRECT_URL`
4. "Deploy" tugmasini bosing

### 3. Telegram Bot ga WebApp ulash

Deploy muvaffaqiyatli bo'lgandan so'ng:

```
@BotFather ga murojaat qiling:
/setmenubutton → botingizni tanlang
→ URL: https://your-app.vercel.app
→ Text: 🚀 Life OS ni ochish
```

Yoki inline klaviatura orqali:
```
/newmenubutton → botingizni tanlang
→ Web App URL: https://your-app.vercel.app
```

---

## Fayl tuzilmasi

```
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Dashboard
│   ├── feed/page.tsx       # Kundalik
│   ├── tasks/page.tsx      # Vazifalar
│   ├── finance/page.tsx    # Moliya
│   ├── profile/page.tsx    # Profil
│   └── api/
│       ├── auth/telegram/  # Auth endpoint
│       └── upload/         # Fayl yuklash
├── components/
│   ├── layout/BottomNav.tsx
│   └── dashboard/*.tsx
├── lib/
│   ├── prisma.ts
│   ├── supabase.ts
│   └── telegram/
│       ├── validate.ts     # HMAC-SHA256
│       └── types.ts
├── providers/
│   └── TelegramProvider.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useHaptic.ts
└── prisma/
    └── schema.prisma
```

---

## Muammolar va yechimlar

### "Telegram.WebApp is not defined" xatosi
Development rejimida normal holat. `SKIP_TELEGRAM_AUTH=true` o'rnatib, mock foydalanuvchi bilan test qiling.

### Prisma generatsiya xatosi
```bash
npm run db:generate
```

### Supabase Storage CORS xatosi
Supabase Dashboard > Storage > Policies da public read huquqini yoqing.
