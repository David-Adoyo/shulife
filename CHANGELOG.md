# Changelog

## Unreleased
- **Core engines** (`packages/core`): integer-cent money, Kenyan phones, Nairobi time, tolerant reference parser, matching engine with reasons and learning, sibling allocation (all four rules), fee billing with ordered discounts, sponsorships and pro-rata, append-only ledger and statements, receipts and cash-up, reminder engine (quiet hours, Sundays, holidays, weekly cap, stop-on-paid, plan-aware), clearance, cash projection, term close, EN/SW message catalogue, WhatsApp commands, audiences, CSV import with family grouping, C2B/STK/bank ingestion, subscription lifecycle.
- **Database** (`packages/db`): full data model, RLS on every table, append-only and immutability triggers, audit log; 51 tests.
- **Demo school** (`packages/demo`): Mlima Academy with two terms of realistic payments; reconciles to the cent; ≥ 90% auto-match acceptance test.
- **School app**: dashboard, families, payments, review queue, fees, notices, clearance, reports, set-up; role-aware.
- **Parent portal** (EN/SW, signed links), receipt verification, admin console, design tokens page.
- **Webhooks**: M-Pesa C2B (secret path, idempotent), WhatsApp assistant; reports CSV.
- **Integrations** (`packages/integrations`): Daraja, Africa's Talking, WhatsApp Cloud API, Paystack, Resend.
- CI workflow, runbook, data protection notes and launch checklist.
- All marketing pages from the sitemap (§9.1): How it works, Features, For directors, For bursars, For parents (English/Kiswahili), Pricing, Security, About, Book a demo, Resources (with three guides), Help centre, Terms, Privacy and Data processing (placeholders pending legal text), and a 404 page.
- Shared marketing layout and reusable page components; header and footer now link to real pages.
- Four more photographs (director, football, art class, graduation).
- FAQ structured data (JSON-LD) on home, pricing and help.
- Marketing home page: hero with schools/parents toggle, mega-menu header, trust strip, term story, how it works, matching signals, interactive sibling-split demo, feature pillars, parent communication tabs, payment plans carousel, director dashboard, school-life gallery, security, late-fees calculator, FAQ, demo booking and footer.
- Brand assets: SVG wordmark and mark (navy and cream), favicon (SVG, ICO, Apple touch icon, PWA icons).
- `/login` placeholder page.
