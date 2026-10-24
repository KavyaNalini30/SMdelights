# SMdelights

E-commerce website for **SMdelights**, a home-grown brownie and pastry business in Kolathur, Chennai — *where every bite delights*.

**Stack:** Next.js (App Router, TypeScript, Tailwind CSS) · Supabase (Postgres, Auth, Row Level Security, Storage) · Razorpay · Vercel · Motion

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

Leave `RAZORPAY_KEY_ID` empty to run checkout in **demo mode** (no real payments).

Full setup — Supabase, Razorpay, Vercel, custom domain, admin access — is in [SETUP.md](SETUP.md).
