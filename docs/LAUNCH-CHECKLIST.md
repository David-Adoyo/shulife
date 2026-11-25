# Launch checklist (Stage 13)

| Item | Status |
|---|---|
| Core engines tested (money, billing, matching, allocation, reminders, clearance, projection) | ✅ `npm test` |
| RLS isolation and integrity tested | ✅ `npm run test:db` |
| ≥ 90% auto-match on 300 simulated payments | ✅ `packages/demo/test/seed.test.ts` |
| Supabase project, migrations applied, auth with TOTP for director/head/bursar | ⬜ needs project |
| Supabase-backed data source replacing the demo store | ⬜ |
| Daraja sandbox end-to-end (C2B, STK success/failure, duplicates, reversals) | ⬜ needs keys |
| Ratiba API confirmed with Safaricom | ⬜ |
| WhatsApp templates approved by Meta; SMS sender ID approved | ⬜ |
| PDF receipts and statements (@react-pdf/renderer) | ⬜ |
| Load test: 2,000 callbacks in an hour, no loss or duplicates | ⬜ |
| Backup restore drill | ⬜ |
| Legal texts, ODPC registration, Kiswahili review (`{{SW_REVIEW_DONE}}`) | ⬜ |
| Licensed photography replacing AI images (`{{PHOTO_SOURCE}}`) | ⬜ |
| Real prices, contacts and domain in `apps/web/src/lib/site.ts` | ⬜ |
| Mobile app (Expo, Stage 12) | ⬜ not started |
