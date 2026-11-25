# Shulife

**Every fee. Every parent. On time.** School fees collection and parent communication for Kenyan private schools.

The full product brief is in [`docs/MASTERPLAN.md`](docs/MASTERPLAN.md).

## What's here

| Path | What it is |
|---|---|
| `apps/mobile` | Expo app for directors and bursars (dashboard, review queue, offline cash receipts) — see its README |
| `apps/web` | Next.js: marketing site, school app (`/app`), parent portal (`/p/…`), receipt check (`/r/…`), admin (`/admin`), webhooks (`/api/…`) |
| `packages/core` | Pure TypeScript domain logic: money, billing, matching, sibling allocation, reminders, clearance, projection, messaging (EN/SW), WhatsApp commands, import, ingestion, subscriptions |
| `packages/db` | Postgres migrations with Row Level Security on every table, integrity triggers and RLS tests |
| `packages/demo` | Mlima Academy, a fictional demo school run through the real engines, plus read models for the app |
| `packages/integrations` | Daraja, Africa's Talking, WhatsApp Cloud API, Paystack and Resend adapters |
| `docs/` | Masterplan, runbook, data protection notes, launch checklist |

```bash
npm install
npm run dev        # http://localhost:3000 — try /login → "Explore the demo school"
npm test           # 89 unit tests
npm run test:db    # 51 RLS tests + 4 Postgres persistence tests (needs PostgreSQL)
```

See `docs/RUNBOOK.md` for going live and `docs/LAUNCH-CHECKLIST.md` for what remains.
