# Shulife

**Every fee. Every parent. On time.** School fees collection and parent communication for Kenyan private schools.

The full product brief is in [`docs/MASTERPLAN.md`](docs/MASTERPLAN.md).

## Marketing website (`apps/web`)

Next.js (App Router, static export) + Tailwind CSS v4, Fraunces and Plus Jakarta Sans.

```bash
cd apps/web
npm install
npm run dev      # http://localhost:3000
npm run build    # static site in apps/web/out
```

- Brand assets: `apps/web/public/brand/` (wordmark and mark, navy and cream) and the favicon set in `apps/web/public/`.
- Photography: AI-generated in Figma (file "Shulife — Website Imagery"), optimised to WebP in `apps/web/public/images/`.
- Pages: `/`, `/how-it-works`, `/features`, `/for-directors`, `/for-bursars`, `/for-parents` (EN/SW), `/pricing`, `/security`, `/about`, `/book-demo`, `/resources`, `/help`, `/legal/*`, `/login`.
- Unconfirmed values (contacts, pricing, ODPC number) live in `apps/web/src/lib/site.ts` as `null` and stay hidden until set.
