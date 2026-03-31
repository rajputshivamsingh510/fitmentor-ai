# FitMentor AI

An AI-powered fitness coaching app built with Next.js, Supabase, and Claude AI.

---

## ⚡ Quick Start (localhost)

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Copy the example file and fill in your keys:
```bash
cp .env.local.example .env.local
```

Then open `.env.local` and add:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
ANTHROPIC_API_KEY=sk-ant-xxx...
```

### 3. Set up Supabase database
1. Go to [supabase.com](https://supabase.com) and create a free project
2. In your project, go to **SQL Editor**
3. Paste the entire contents of `supabase-schema.sql` and click **Run**
4. Copy your project URL and anon key from **Settings → API** into `.env.local`

### 4. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Getting your API keys

### Supabase (free)
1. Create account at [supabase.com](https://supabase.com)
2. New project → wait ~2 min for it to spin up
3. Go to **Settings → API**
4. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
5. Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Anthropic Claude (paid, ~$5 to start)
1. Create account at [console.anthropic.com](https://console.anthropic.com)
2. Go to **API Keys** → Create key
3. Copy it → `ANTHROPIC_API_KEY`

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx               ← Landing page
│   ├── coach/page.tsx         ← AI Chat coach
│   ├── profile/page.tsx       ← User profile + plans
│   ├── auth/
│   │   ├── login/page.tsx     ← Login
│   │   ├── signup/page.tsx    ← Signup
│   │   └── callback/route.ts  ← OAuth callback
│   └── api/chat/route.ts      ← Claude AI API route
├── components/
│   ├── layout/Navbar.tsx      ← Auth-aware navbar
│   ├── home/                  ← Landing page sections
│   └── animations/            ← Particle background
├── lib/supabase/
│   ├── client.ts              ← Browser Supabase client
│   └── server.ts              ← Server Supabase client
├── store/userStore.ts         ← Zustand state + Supabase sync
└── middleware.ts              ← Route protection
```

---

## 🗄️ Database Schema

Two tables in Supabase (created by `supabase-schema.sql`):

| Table | Columns |
|-------|---------|
| `workout_plans` | `id`, `user_id`, `workouts` (jsonb), `created_at`, `updated_at` |
| `diet_plans` | `id`, `user_id`, `meals` (jsonb), `created_at`, `updated_at` |

Row Level Security is enabled — users can only access their own data.

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + Framer Motion |
| Auth + DB | Supabase |
| AI | Anthropic Claude (claude-sonnet-4) |
| State | Zustand |

---

## ❓ Troubleshooting

**App loads but AI coach doesn't respond**
→ Check `ANTHROPIC_API_KEY` is set in `.env.local` and is valid

**Login/signup doesn't work**
→ Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct

**Profile shows no data after chatting**
→ Make sure you ran `supabase-schema.sql` in the Supabase SQL Editor

**Port already in use**
→ Run `npx kill-port 3000` then `npm run dev` again
→ Or run on a different port: `npm run dev -- -p 3001`

**Getting redirected to login on every page**
→ Your Supabase session cookie isn't being set — make sure your Supabase URL doesn't have a trailing slash
