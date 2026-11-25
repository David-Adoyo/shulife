# SHULIFE — Master Build Prompt (v1.0)

> **Every fee. Every parent. On time.**
> School fees collection and parent communication for Kenyan private schools.
> *Shulife* — from *shule*, Kiswahili for "school" — keeps school life running smoothly: every fee in on time, every parent in the loop.

---

## 0. READ THIS FIRST — How you (the agent) must work

You are a **principal full-stack engineer and senior product designer** who specialises in school software, mobile-money payments and premium, parent-friendly interfaces. You are building **Shulife** end to end: the marketing website, the school web app (director, bursar and staff), the parent portal, the WhatsApp/SMS assistant, the payment engine and the admin console.

### 0.1 Operating rules (non-negotiable)

1. **Scope-lock.** Build only what this document specifies. If something seems missing or wrong, **stop and ask**. Do not add features, libraries or pages on your own initiative.
2. **Staged build with STOP gates.** Work through the stages in §17 in order. At the end of every stage, **STOP**, run the app, and give me a preview summary (what was built, screenshots or the route list, how to test it, open questions). Do not start the next stage until I reply "continue".
3. **Proof-one before rollout.** Every repeatable pattern (a screen layout, a table, an engine, a message template) is built **once**, shown to me, approved, and only then repeated.
4. **Placeholders, never inventions.** Any value not confirmed here uses a `{{PLACEHOLDER}}` token (register in §19). Never invent prices, phone numbers, school names presented as customers, legal text, statistics or testimonials.
5. **UK spelling** in all UI copy, code comments and docs (organisation, colour, enrolment, programme, centre, cheque). The currency is **KES**, written in the UI as `KSh 25,000`. The time zone is **Africa/Nairobi**. Dates are written `24 Nov 2026`.
6. **Money is sacred.** All amounts are stored as **integers in cents** (`bigint`). No floats for money. Payments and ledger entries are immutable; corrections are new adjusting entries.
7. **Idempotency everywhere.** Webhooks, jobs and payment handlers must be safe to run twice.
8. **Children's data is precious.** Collect the minimum. Row Level Security on every table from the first migration. No learner data in analytics events. No messages ever sent to learners.
9. **Commit discipline.** Small, descriptive commits. Keep `CHANGELOG.md` and `DECISIONS.md` (architecture decision log).
10. **Tests travel with code.** Engines (fee billing, matching, sibling allocation, reminders, clearance) ship with unit tests from day one.

### 0.2 What "done" means for any feature
- Works on a 360 px-wide Android phone on a slow 3G profile and on a 1440 px desktop.
- Designed loading (skeleton), empty, error and success states. No blank screens.
- Keyboard accessible; WCAG 2.2 AA contrast.
- UK English copy; **all parent-facing copy also in Kiswahili**.
- Tests cover anything touching money, matching, allocation or permissions.
- Shown to me at a STOP gate and approved.

---

## 1. The product in one breath

Shulife lets a Kenyan private school with **100–1,500 learners** collect fees without the chaos. Parents pay into the **school's own M-Pesa Paybill or bank** using the **admission number**. Shulife **matches every payment** (even with wrong references or from an unknown phone), **splits payments between siblings** by the school's rule, sends an **instant receipt**, and keeps a **clean ledger per learner and per family**. Parents get **itemised fee statements**, **polite reminders with one-tap M-Pesa**, **payment plans**, and can ask for their **balance on WhatsApp**. The director sees **collection by class in real time** and **cash projected for the next 30 days**. Notices go to **exactly the right parents** (a class, a bus route, boarders) with **read receipts**, in English or Kiswahili.

**Positioning:** fees and parents only. Shulife **works alongside** any school management system the school already uses (Zeraki, spreadsheets or anything else) through import and export. Premium, calm and dignified: it should feel like a well-run private school's front office.

**Core promises (use across the site):**
1. Every payment matched, every parent receipted, instantly.
2. Siblings sorted automatically.
3. Kinder than sending children home.
4. Your money never touches us.
5. Live in an afternoon.

---

## 2. Who uses Shulife (roles and permissions)

| Role | Who | Can do | Cannot do |
|---|---|---|---|
| **Director / Owner** | Owns the school (or a group of campuses); the paying customer | Everything, across all campuses in their organisation | — |
| **Head teacher / Principal** | Runs the school day to day | Dashboards, notices, events/consent, clearance overrides, approve waivers up to `{{HEAD_WAIVER_LIMIT}}` | Change payment credentials, billing |
| **Bursar / Accounts** | Runs fees | Fee structures, invoicing, review queue, manual receipts (cash/cheque/bank slip), payment plans, statements, reports, term close | Delete payments; approve own waivers above limit |
| **Front office / Secretary** | Reception | Look up a family, resend statements/receipts, log enquiries, send approved notice templates, update contact details (audited) | Change charges or balances |
| **Class teacher** | Teacher of a stream | See the class list, the clearance status (cleared / not cleared, **no amounts**) and notices to their class; send class notices (if the school allows) | See any fee amounts |
| **Transport coordinator** | Manages buses | Route lists, route notices, route changes (which drive billing for the next term) | See fee amounts beyond transport |
| **Parent / Guardian** | Pays and receives communication | Portal via magic link or SMS OTP: all their children in one family view, balances, Pay now, statements, receipts, fee structure, payment plans, notices, consent forms, contact details | See anything about other families |
| **Sponsor** (optional) | A bursary/scholarship sponsor or employer paying part of the fees | View statements for sponsored learners only, download sponsor invoices | Anything else |
| **Shulife Admin** | Internal staff | Support console, impersonation with consent and audit, feature flags, school health | Read payment credentials |

**Learners have no accounts in v1.** Shulife never messages a learner.
Permissions are enforced in **Postgres RLS** and mirrored in the UI (hide what a role cannot do; no dead buttons).

---

## 3. Pain points → Shulife solutions (the heart of the product)

Every feature exists because of a pain point below. Use this matrix to write the marketing copy, the onboarding tips and the empty states.

### 3.1 Bursars and accounts staff

| # | Pain point | Shulife solution | Module |
|---|---|---|---|
| B1 | A lost week at the start of every term matching hundreds of M-Pesa messages to admission numbers | Automatic matching: admission number → registered guardian phone → learned phone → name similarity → one-tap review queue that **learns** | Matching §7.3 |
| B2 | Parents type the wrong account number, a child's name, or nothing at all | A tolerant reference parser (`ADM 1234`, `1234 grade 3`, `JOHN K`), fuzzy matching and the guardian-phone signal; anything uncertain goes to the review queue with ranked suggestions | §7.3 |
| B3 | One payment for three siblings with one reference | **Sibling allocation engine** that splits by the school's rule and sends the parent a confirmation of the split, with a "request a change" path | Allocation §7.4 |
| B4 | Handwritten receipt books, queues at the bursar's window | Instant numbered digital receipts with the school crest, by WhatsApp/SMS plus PDF, QR-verifiable | Receipts §7.5 |
| B5 | Cash, cheques and bank slips still arrive | A manual receipt flow with a photo of the slip/cheque, a daily cash-up report and a banking reconciliation; every manual entry is audited | §7.6 |
| B6 | Bank Paybill payments (school's bank account) don't show up anywhere useful | Bank statement import (CSV) with the same matching pipeline; a bank API adapter hook for later | §7.2 |
| B7 | Building fee invoices every term from scratch in Excel | A **fee structure builder** (grade × term × fee item matrix) plus opt-in items (lunch, transport route, boarding, clubs, trips) → invoices for the whole school in one click | Billing §7.1 |
| B8 | Discounts, sibling discounts, staff children and bursaries handled by memory | Rule-based discounts, bursary/sponsor splits and approved waivers, all on the statement | §7.1 |
| B9 | Balance brought forward from last term gets lost or disputed | Term close carries every balance forward automatically, with a full history | Term close §7.11 |
| B10 | End-of-term reports take days | One-click reports: collection by grade/stream, fee-item summary, defaulters (internal only), plans, waivers, daily cash-up, banking | Reports §10 |

### 3.2 Directors and owners

| # | Pain point | Solution |
|---|---|---|
| D1 | Can't see collections without asking the bursar | A live director dashboard: collected today/term, % by grade and stream, top balances, plans on track |
| D2 | Cash-flow gaps when salaries and suppliers are due | A **30-day cash projection** from instalment plans, historical payment curves and term dates |
| D3 | Fear of leakage and errors | Money flows straight to the school account; every manual entry is audited; daily cash-up variance alerts |
| D4 | Several campuses, no single view | Multi-campus organisation with a group dashboard |
| D5 | Sending children home damages reputation | Clearance lists plus polite automated parent outreach and payment plans, replacing the gate-side conversation |
| D6 | Parents feel overcharged and complain | Itemised, transparent invoices and a published fee structure in the parent portal |

### 3.3 Parents and guardians (their goodwill brings fees in faster)

| # | Pain point | Solution |
|---|---|---|
| P1 | "I paid, but the school says I haven't" | An instant receipt for every payment, a live balance, and a downloadable statement any time |
| P2 | Not sure what the fees are for | An itemised invoice per child per term, with optional items clearly marked |
| P3 | Several children, confusing balances | A **family view**: every child, every balance, one total, one Pay now button |
| P4 | Can't pay a full term at once | Payment plans agreed with the school, with reminders on each instalment and optional **M-PESA Ratiba** auto-pay |
| P5 | Lost notes in school bags; noisy WhatsApp groups | Targeted notices by WhatsApp/SMS, a notices page in the portal, and nothing irrelevant |
| P6 | Trip and event forms get lost; paying separately | Consent and payment in one link |
| P7 | No app wanted; low data bundles | No app: M-Pesa, SMS, WhatsApp, and a light portal (≤ 150 KB JS) |
| P8 | Prefers Kiswahili | Every parent message and portal screen in English or Kiswahili, parent's choice |
| P9 | Embarrassment when a child is sent home | The school contacts the parent first, privately and politely, with options to pay or agree a plan |
| P10 | Needs fee proof for an employer, sponsor or loan | Official statements and receipts with QR verification; sponsor invoices |

### 3.4 Teachers and front office

| # | Pain point | Solution |
|---|---|---|
| T1 | Teachers asked to "check who has paid" | Teachers see only cleared / not cleared for exams and trips, **never amounts** |
| T2 | Reception flooded with "what's my balance?" calls | Parents self-serve via WhatsApp (`BALANCE` / `SALIO`) and the portal; reception has a one-search family lookup |
| T3 | Sending class notices means collecting phone numbers | Audience chips: send to Grade 4 East parents in seconds, with read receipts |

---
## 4. Locked decisions

1. **Multi-tenant SaaS.** Each customer is an **Organisation** (a school or a school group) with one or more **Campuses**.
2. **Kenya first.** KES, Africa/Nairobi, Kenyan phone formats, English plus Kiswahili for parent-facing text. Academic structure is **configurable** (grades, streams, terms), seeded with the current Kenyan structure: PP1–PP2, Grades 1–9, Senior School Grades 10–12, three terms a year. Legacy "Form" labels are supported as display names. Term dates are entered per school.
3. **Shulife never holds fees.** Money goes to the **school's own** M-Pesa Paybill/Till or bank account. Each school connects its own Daraja credentials. Bank collections come in through **statement import** in v1.
4. **The admission number is the account number.** An optional **family code** (`{{FAMILY_CODE_PREFIX}}-1234`) lets a parent pay once for all children.
5. **Parents need no app and no password.** Portal access is by magic link or SMS OTP. The WhatsApp assistant answers simple commands.
6. **Fees and parents only.** No timetables, exams or report cards. Instead: **CSV/Excel import and export** for learners, classes and balances so Shulife sits beside any existing system.
7. **AI is used sparingly:** parsing messy spreadsheets and photos of class registers, and name-similarity suggestions in the review queue. No chatbot: the WhatsApp assistant is command-based.
8. **Respectful collections.** No late fees by default (the school can enable them only after confirming its fee policy allows). No shaming, no lists of debtors shared with anyone outside the bursar/director roles, no messages to learners.
9. **Pricing model:** per enrolled learner per term, free until the first payment is matched automatically. All amounts are placeholders (§19).

---

## 5. Architecture and stack

### 5.1 Stack

| Layer | Choice | Notes |
|---|---|---|
| Web framework | **Next.js (App Router, TypeScript, Server Actions)** | Route groups `(marketing)`, `(app)`, `(parent)`, `(admin)` |
| UI | **Tailwind CSS + shadcn/ui (deeply themed) + Radix** | Tokens from §8 |
| Icons | **Phosphor Icons** (Light/Regular) | |
| Charts | **Recharts** (themed) | |
| Motion | **Framer Motion** | Respects `prefers-reduced-motion` |
| Database | **Supabase Postgres** | RLS, pg_cron, pgmq queues, Vault for secrets |
| Auth | **Supabase Auth** | Staff: email + password + TOTP 2FA; parents: magic link / phone OTP |
| Storage | **Supabase Storage** | Private buckets with signed URLs: crests, receipts, statements, slip photos, consent PDFs |
| Jobs | **Edge Functions + pg_cron + pgmq** | Invoicing, reminders, reconciliation, PDFs, broadcasts |
| Payments in | **Safaricom Daraja**: C2B register/confirmation, STK Push, Transaction Status, **M-PESA Ratiba** | Per-school credentials |
| Shulife's own billing | M-Pesa STK to `{{SHULIFE_PAYBILL}}` + **Paystack** cards | Separate from school fee flows |
| SMS | **Africa's Talking** (sender ID `{{SMS_SENDER_ID}}`, per-school sender IDs later) | Delivery reports stored |
| WhatsApp | **WhatsApp Business Cloud API** | Utility templates plus an inbound command handler |
| Email | **Resend + React Email** | |
| PDF | **@react-pdf/renderer** | Receipts, invoices, statements, consent forms, clearance lists |
| AI | **Anthropic Claude API** | Import parsing and match suggestions only; behind a flag with per-school caps |
| Observability | **Sentry**, **PostHog** (no learner data in events), **Better Stack** uptime | |
| Hosting | **Vercel + Supabase** | Preview deployment per branch |
| Testing | **Vitest**, **Playwright**, Daraja sandbox | |
| Mobile (later) | **Expo** bursar/director app | Stage 12 |

### 5.2 System overview

```
 Parent phone ──(Paybill, Account = ADM no. or family code)──► Safaricom M-Pesa
       │                                                          │
       │ WhatsApp "BALANCE" / "SALIO"                C2B confirmation / STK / Ratiba callback
       ▼                                                          ▼
 [WhatsApp webhook] ─► Command handler         [Edge: /webhooks/mpesa/:school/:secret] ─► raw_mpesa_events
                                                          │ verify, dedupe, enqueue
                                                          ▼
                               [payments.ingest] ─► Matching ─► Sibling Allocation ─► ledger (per learner)
                                                          │                │
                                                 review_queue        receipts + split confirmation
 Bank CSV import ──────────────────────────────────────────┘                │
 [Term invoicing run] ─► invoices ─► Reminder scheduler ─► messages_outbox ─► SMS / WhatsApp / email
 [Notices composer] ─► audience resolver ─► messages_outbox ─► delivery + read receipts
```

### 5.3 Repository layout

```
/apps/web            Next.js: marketing, app, parent portal, admin
/apps/mobile         Expo (later)
/packages/ui         Themed components + Shulife signature components
/packages/core       Pure TS domain logic: money, fee billing, discounts, matching, sibling allocation,
                     reminders, clearance, projections (fully unit-tested)
/packages/db         Migrations, RLS policies, seeds, generated types
/packages/pdf        Receipt, invoice, statement, clearance list, consent form templates
/packages/messaging  EN/SW template registry, SMS/WhatsApp/email adapters, WhatsApp command parser
/packages/integrations  daraja, africastalking, whatsapp, paystack, anthropic, bank-csv parsers
/supabase/functions  Webhooks and jobs
/docs                DECISIONS.md, RUNBOOK.md, DATA-PROTECTION.md
```

---

## 6. Data model (Postgres)

All tables: `id uuid pk`, `org_id`, `campus_id` where relevant, `created_at`, `updated_at`, `created_by`. Money is `bigint` cents. Soft delete is `archived_at`. RLS is on everywhere.

### 6.1 Organisation and academic structure
- `organisations` — name, legal name, plan, status, default language, quiet hours (default 21:00–07:00).
- `campuses` — name, crest (logo), motto, address, county, phone, receipt footer, brand colour accent (optional), Paybill/bank display details.
- `memberships` — user_id, role, campus scope, grade/stream scope (for class teachers), 2FA required.
- `academic_years`, `terms` — name (`Term 1 2027`), opening date, closing date, half-term dates, fee due date, status (`planned|open|closed`).
- `grades` — code (`PP1`, `G1`…`G12`), display name, sort order, level (`pre_primary|primary|junior|senior`).
- `streams` — grade_id, name (`East`, `Blue`), class teacher.

### 6.2 Learners and families
- `families` — family code, display name (e.g. "The Wanjiru family"), preferred language, communication consent flags, notes (internal).
- `learners` — admission_number (**unique per campus**), first name, last name, other names, gender (optional), date of birth (**optional**, used only for age-based fees if needed), family_id, status (`active|suspended|left|graduated|prospective`), boarding (`day|boarder`), join date, leave date. **Do not store photos, medical information or national assessment numbers in v1.**
- `guardians` — name, relationship, phone(s) E.164, email, WhatsApp opt-in, preferred language, is_primary_payer, receives_notices.
- `learner_guardians` — many-to-many with role flags.
- `enrolments` — learner × term: grade, stream, boarding, transport route, optional items chosen. Created by a "promote to next term" wizard.
- `admission_aliases` — old numbers, typo variants learned from the review queue.

### 6.3 Fees and billing
- `fee_items` — tuition, lunch, transport, boarding, activity, exam, development levy, uniform, trip, admission fee, caution money and so on (school-configurable; flags: `mandatory|optional`, `refundable`, `allocation_priority`).
- `fee_structures` — term × grade × fee_item → amount; boarding/day variants; versioned and approved before invoicing (status `draft|approved|published`).
- `transport_routes` — name, zones, amount per term, coordinator.
- `optional_subscriptions` — learner × term × optional item (lunch, club, route).
- `discount_rules` — sibling discount (e.g. % off tuition for the 3rd child), staff child, early-payment (optional), with stacking rules.
- `sponsors` and `sponsorships` — a bursary or employer covering a % or fixed amount of selected fee items per learner; generates a sponsor invoice.
- `invoices` / `invoice_lines` — per learner per term; number `INV-{{CAMPUS_CODE}}-2027-T1-000123`; PDF.
- `ledger_entries` — **append-only** per learner: debits (invoice lines, charges), credits (allocations, discounts, waivers, sponsor payments); family balance = sum across the family's learners (view).
- `adjustments` — waivers, credit notes, write-offs: reason, requested_by, approved_by, approval tier.
- `payment_plans` / `plan_instalments` — family or learner level; status; accepted_by_guardian_at (OTP).

### 6.4 Payments
- `payment_integrations` — provider (`mpesa_paybill|mpesa_till|bank_import|manual`), shortcode, environment, Vault secret references, callback secret, last verified.
- `raw_mpesa_events` — exact JSON, headers, source IP, received_at. **Immutable.**
- `payments` — provider_ref (TransID, unique per org), amount, msisdn hash plus last 3 digits, payer name, bill_ref (as typed), paid_at, channel (`c2b|stk|ratiba|bank_import|cash|cheque|bank_slip`), match_status (`auto|suggested|unmatched|manual|split|reversed|not_ours`), confidence, matched_family_id / matched_learner_id.
- `allocations` — payment → learner → invoice line (with the rule used).
- `allocation_change_requests` — a parent asks to re-split; the bursar approves.
- `payer_links` — phone hash → family, source (`guardian_record|learned|import`), confidence.
- `review_queue` — payment, suggestions (family/learner, score, reasons), assignee, resolution.
- `manual_receipts` — cash/cheque/slip: receipt-book reference, photo, received_by, banked status.
- `bank_deposits` — daily banking batches reconciling cash and cheques.
- `stk_requests`, `ratiba_mandates`, `receipts` (number, PDF, verify code, channel, sent_at).

### 6.5 Communication and operations
- `audiences` — saved segments (grade, stream, route, boarders, day scholars, whole school, custom list). Never "debtors" as a broadcast segment for notices; fee reminders run only through the reminder engine.
- `notices` — title, body EN/SW, attachments, audience, channel(s), scheduled_for, sent_by, approval status.
- `messages_outbox` — recipient guardian, channel, template, variables, status, provider id, cost, delivered_at, **read_at** (WhatsApp read receipts), related entity.
- `events` and `consent_forms` — trip/event details, cost (creates an optional charge on acceptance), deadline, questions; `consent_responses` (guardian, learner, answer, OTP signature, paid status).
- `inbox_threads` / `inbox_messages` — parent replies and enquiries routed to the front office; tags; SLA timers.
- `clearance_rules` — event (`exam|trip|report_collection|term_end`), threshold (e.g. ≥ `{{CLEARANCE_PCT}}`% paid or an active plan in good standing), overrides with reason.
- `clearance_status` — learner × rule: cleared, not_cleared, overridden (by, reason).
- `reminder_rules` — offsets relative to term opening/due dates/instalments, channels, tone preset.
- `audit_log` — append-only.
- `subscriptions`, `subscription_invoices` — Shulife's own billing (learners counted per term).

### 6.6 RLS principles
- Every policy checks org (and campus scope).
- **Class teachers** read a view of their streams with `clearance_status` only: no money columns.
- **Transport coordinators** read route rosters and route fee status only.
- **Parents** never query tables directly: server routes verify a signed, expiring parent token and return their family's data only.
- **Sponsors** see sponsored learners' sponsor-relevant lines only.
- Secrets, raw events and the audit log are service-role only (admin views redact them).

---

## 7. Core engines (build with great care)

### 7.1 Fee billing engine
- The **fee structure builder** is a spreadsheet-like matrix (grades as rows, fee items as columns, day/boarder toggle) with copy-from-last-term, % uplift, approval and publish steps. A published structure is visible to parents in the portal.
- The **invoicing run** (per term, per campus) uses enrolment × structure + optional subscriptions + transport route − discounts − sponsorships = invoice. A preview shows totals by grade before committing. Idempotent per learner per term.
- **Mid-term joiners/leavers:** pro-rata rules per fee item (some items are non-refundable). The rule set is configurable and documented.
- **Discounts:** rules evaluate in a defined order (sponsorship → sibling → staff → manual waiver), and every discount appears as its own statement line.
- **One-off charges** (trip, lost book, uniform) can be added to one learner or in bulk to an audience.
- **Late fees:** disabled by default; if enabled, a flat or percentage charge after a grace period, with an automatic parent notice.

### 7.2 Payment ingestion
- **C2B:** register URLs per campus shortcode. The validation URL **accepts all** payments. The confirmation handler writes `raw_mpesa_events`, then enqueues. Always return 200 fast.
- **STK Push** from the parent portal "Pay now", reminder links, and the bursar's "Request payment".
- **Ratiba** standing orders for plan instalments or monthly amounts.
- **Bank statement import:** CSV parsers for the major Kenyan banks' statement formats (`{{BANK_FORMATS}}`, confirm samples with pilot schools), plus a generic column-mapping importer. Dedupe by bank reference. Same matching pipeline.
- **Manual receipts:** cash, cheque and bank slip with a mandatory photo, receipt-book number and receiver. They appear in the daily cash-up and must be **banked** (linked to a deposit) within `{{BANKING_SLA_DAYS}}` days or the director is alerted.
- **Reconciliation:** nightly Transaction Status checks on pending STK requests; a reversal handler; a daily summary for the bursar.
- **Security:** a secret callback path per campus, optional Safaricom IP allow-list `{{SAFARICOM_CALLBACK_IPS}}`, a unique `(org_id, provider_ref)` index, a dead-letter queue and a replay tool.

### 7.3 Matching engine (`/packages/core/matching`)
Score candidates (family or learner) from 0 to 100 with explanations:

1. **Exact admission number** in `bill_ref` after normalisation (strip `ADM`, `NO`, spaces, dashes, leading zeros; aliases count) → 100 for that learner.
2. **Exact family code** → 100 for the family.
3. **Registered guardian phone** (MSISDN hash matches a guardian on record) → 90 for that family.
4. **Learned phone** (`payer_links`) → 85.
5. **Name in reference** (e.g. `KAMAU GRADE 4`): fuzzy match of learner names within the grade if a grade is mentioned → up to 70.
6. **Payer name similarity** to guardian names (Jaro-Winkler, Kenyan name-order tolerant) → up to 50.
7. **Amount heuristic** (equals a family's balance, an instalment or a fee-item total) → up to 25.
8. **Admission number typo** (Levenshtein 1 on numbers of 4 digits or more) → 60; never auto-applied alone.

Combine signals (capped at 100). Auto-apply when ≥ `{{AUTO_MATCH_THRESHOLD}}` (default 90) **and** the margin over the next candidate is ≥ 15. Otherwise → review queue with the top three suggestions and their reasons.
**Learning:** every manual assignment creates or strengthens a `payer_link` and, where relevant, an `admission_alias`.
**Test fixtures must include:** a parent paying with a child's name, a sibling's number used for the whole family, a grandparent's phone, two learners with the same name, a payment for a learner who has left, duplicates, reversals, overpayments, and a payment for a different school (`not_ours`).

### 7.4 Sibling allocation engine (signature feature)
When a payment matches a **family** (or one learner's number but the family has several children with balances), apply the school's chosen rule:
- **A. Oldest balance first** (default): arrears from earlier terms first, then the current term, across all children.
- **B. Proportional** to each child's outstanding balance.
- **C. Youngest first / eldest first.**
- **D. Exact-number only:** apply only to the learner whose number was used; overpayment goes to that learner's credit.

Within each learner, allocate by fee-item priority (configurable, e.g. tuition → boarding → lunch → transport → other).
The parent immediately receives a **split confirmation** ("KSh 45,000 received: Amani KSh 20,000, Baraka KSh 15,000, Zawadi KSh 10,000") with a link to **request a change**. A change request goes to the bursar and is resolved with a reallocation (reversing and new allocation entries, fully audited).
Overpayment becomes family credit, applied automatically to the next invoice.

### 7.5 Receipting
- Generate within seconds: number (`RCT-{{CAMPUS_CODE}}-2027-000456`), school crest, learner(s), allocations by fee item, balance after payment, QR to `{{DOMAIN}}/r/{code}` (a public page showing only the school, receipt number, amount, date and "Valid").
- Delivered by the guardian's preferred channel; p95 under 30 s from callback.
- Reprint/resend from the family profile, with an audit entry.

### 7.6 Daily cash-up and banking
- The end-of-day report per receiver shows cash, cheques and slips by receiver, totals and photos.
- Banking batches match deposits to manual receipts; a variance alerts the director.
- Locked days: once a day is closed, edits require an adjustment with approval.

### 7.7 Reminder engine
- **Term timeline (default; editable):**
  - Term −14 days: the new fee statement is published with a "pay early" note.
  - Term −3: a friendly reminder before opening.
  - Due date: due today.
  - Due +7: a gentle follow-up with a plan offer.
  - Due +21: a firm-but-polite follow-up and an invitation to talk to the bursar.
  - Clearance event −7 (exams/trips): "to avoid any disruption for {child}, please clear or agree a plan by {date}".
  - Plan instalments: −2 days and on the day.
- Each message has the amount, the children, the Paybill and account number, and a **one-tap Pay link** (portal + STK).
- **Stops** when the balance is cleared or a plan is active (the plan sends its own reminders).
- **Quiet hours** `{{QUIET_START}}`–`{{QUIET_END}}`; no messages on Sunday mornings; a configurable public-holiday calendar; a per-family weekly cap `{{MAX_REMINDERS_PER_WEEK}}`.
- **Tone presets:** *Gentle*, *Standard*, *Firm-but-polite*. Shaming words are blocked in custom templates.
- **Channel logic:** WhatsApp (if opted in) → SMS fallback; email copy for statements.

### 7.8 Clearance engine ("Kinder than sending children home")
- Rules per event: cleared if paid ≥ X% of the term's fees, **or** on a plan with no missed instalment, **or** overridden by the head/bursar with a reason.
- Seven days before the event, not-cleared families get a private, polite message with the options (pay, agree a plan, talk to the bursar).
- The day before, a **clearance list PDF** goes to the head and class teachers, showing names and Cleared / Not cleared / Override only (**no amounts**).
- Teachers see the same status in their class view. Nothing is ever shown to learners or other parents.

### 7.9 Notices, events and the parent inbox
- **Composer:** title, body (EN and SW side by side, with a "suggest Kiswahili draft" button; the human must review), attachments (PDF/image), audience chips (whole school, campus, grade, stream, route, boarders/day, custom), channels, schedule, and a live phone preview (WhatsApp and SMS).
- **Approval flow:** teachers' class notices can require head approval (school setting).
- **Delivery dashboard:** sent, delivered, **read** (WhatsApp), failed, with a resend-by-SMS button for unread after `{{UNREAD_FOLLOWUP_HOURS}}` h.
- **Events and consent:** a trip with cost, date, deadline and questions → each parent gets one link → consent by OTP signature → an optional charge is created → payment via STK → the organiser sees a live roster (consented, paid, outstanding) and exports it.
- **Emergency broadcast:** whole-school SMS plus WhatsApp in one tap (e.g. early closure), restricted to the director and head, with an audit entry.
- **Parent inbox:** parent replies to any message land in a shared inbox for the front office, with tags (fees, transport, general), assignment, response-time tracking and canned replies in EN/SW.

### 7.10 WhatsApp assistant (command-based, no AI chat)
On the school's WhatsApp number (or a shared Shulife number `{{WHATSAPP_NUMBER}}` with school selection):
- `BALANCE` / `SALIO` → family balance per child plus a pay link.
- `STATEMENT` / `TAARIFA` → PDF statement for the current term.
- `RECEIPT` / `RISITI` → the last 3 receipts.
- `PAY` / `LIPA` → STK prompt to the sender's number (amount chosen from quick replies: full balance, current instalment, or another amount).
- `FEES` / `ADA` → the published fee structure PDF for their children's grades.
- `HELP` / `MSAADA` → the menu plus "talk to the office" (routes to the inbox).
- **Security:** the sender's number must be a registered guardian of that family. Unknown numbers are asked to contact the school, and **no data is disclosed**. Rate-limited.

### 7.11 Term lifecycle
- **Before the term:** the promote wizard (grade +1, streams, leavers, new admissions), fee structure approval, invoicing run, statement publication.
- **During the term:** collections, plans, clearance, notices.
- **Term close:** lock the term, carry balances forward as "balance brought forward" lines, produce the closing report pack (PDF/CSV) and archive.
- **Leavers:** final statement, refundable items (e.g. caution money), clearance certificate when the balance is zero.

### 7.12 Director's cash projection
- Projected inflows for the next 30/60/90 days from plan instalments due, Ratiba mandates, and the historical payment curve by grade for the same week of term (from Shulife data; it needs ≥ 1 term of history, otherwise it shows "learning").
- A simple chart with a confidence band and plain-English notes ("Most Term 1 fees typically arrive in the first 3 weeks").

### 7.13 Shulife's own subscription billing
- Plans: `{{PLAN_ESSENTIAL}}`, `{{PLAN_PLUS}}`, `{{PLAN_GROUP}}`, priced per enrolled learner per term (`{{PRICE_PER_LEARNER_TERM}}`), with a minimum `{{MIN_TERM_FEE}}`.
- **Free until the first automatically matched payment**, then `{{TRIAL_DAYS}}` days, then billing.
- On non-payment: read-only after `{{GRACE_DAYS_SUBSCRIPTION}}` days. **Payment ingestion, receipts and parent balances never stop.**

---
## 8. Design system — "The well-run front office"

Shulife must feel like the front office of the best private school in Nairobi: **calm, warm, orderly and quietly confident**. Midnight navy brings authority and trust, ivory brings warmth and paper-like calm, and **coral orange** is the bell: used sparingly to signal action, arrival and delight. Never a generic admin template. Generous white space. Beautiful numbers. One clear question answered per screen.

### 8.1 Brand essence
- **Personality:** dignified, warm, reassuring, efficient, quietly modern, proudly Kenyan without clichés.
- **Voice:** respectful and kind, never scolding. Parents are partners. Short sentences. Talk to "you". Plain words: "balance" not "arrears", "fee items" in UI (with the local term "voteheads" as a synonym in bursar screens and help), "statement" not "ledger".
- **Logo:** the Shulife mark — a rounded navy **"s" monogram** with a single **coral dot** above it (the dot is the signal/arrival accent), beside the lowercase wordmark **"shulife"** (see `logo.png`; Figma source `{{LOGO_FIGMA_URL}}`). Primary colours: midnight navy mark and wordmark on ivory, with the coral dot. Provide SVG lockups: horizontal, stacked, mark-only, monochrome ivory and monochrome navy.
- **Motif:** the **signal ripple**: concentric coral arcs that animate once when something good arrives (a payment, a fully collected class), echoing the coral dot. Used sparingly as the brand's signature moment.

### 8.2 Colour tokens

| Token | Hex | Use |
|---|---|---|
| `--navy-950` | `#0B1426` | Footer, deepest panels |
| `--navy-900` (**brand primary**) | `#14213D` | Sidebar, primary buttons, headings on ivory |
| `--navy-700` | `#24365E` | Hover/active, secondary surfaces on dark |
| `--navy-100` | `#E6EAF2` | Selected rows, info tints |
| `--ivory-50` (**app background**) | `#FBF8F2` | Page background |
| `--ivory-100` | `#F7F3EA` | Cards on dark, marketing sections |
| `--sand-200` | `#E7DFD0` | Borders, dividers |
| `--coral-500` (**accent**) | `#F2735A` | Primary CTAs on marketing pages (with **navy text**), the bell ripple, key highlights, the progress arc. **≤ 5–8% of any screen.** |
| `--coral-600` | `#E05A40` | CTA hover |
| `--coral-700` | `#B9442C` | Coral text/links on ivory (passes AA) |
| `--coral-100` | `#FDE6DF` | Soft highlight tints, "new" badges |
| `--ink-900` | `#141A26` | Primary text |
| `--ink-600` | `#5A6378` | Secondary text |
| `--ink-400` | `#8A90A0` | Tertiary text |
| `--status-paid` | `#2E7D5B` | Paid / Cleared |
| `--status-partial` | `#C98A1E` | Partly paid / On plan |
| `--status-due` | `#8E3B5E` | Balance due / Not cleared (a muted plum, deliberately **not** coral and not alarm-red) |
| `--status-info` | `#2F5D8A` | Informational |

Contrast rules: white or ivory text on coral is **not allowed** for body text; use navy on coral. Every status pill carries an icon and a label, never colour alone. Dark mode is out of scope, but use semantic tokens.

### 8.3 Typography
- **Display:** *Fraunces* (soft serif, optical size on, weights 400–600). Used for page titles, hero lines, big numbers and the wordmark.
- **UI / body:** *Plus Jakarta Sans* (400/500/600/700). `font-variant-numeric: tabular-nums` for all figures.
- **Scale (rem):** 0.75 · 0.875 · 1 · 1.125 · 1.25 · 1.5 · 2 · 2.5 · 3.5 · 4.5.
- **Money style:** small `KSh` in ink-600, then the amount in ink-900 weight 600. Hero figures use Fraunces.

### 8.4 Layout, shape, depth
- 8-pt grid; cards padded 24–32 px; page gutters 24 px (mobile) and 48 px (desktop).
- Radius: 8 px (inputs/buttons), 14 px (cards), 24 px (hero panels), full (pills, avatars).
- 1 px `--sand-200` borders; soft, rare shadows: `0 1px 2px rgba(20,33,61,.05), 0 10px 28px rgba(20,33,61,.07)`.
- Desktop shell: a slim **navy sidebar** with the campus switcher at the top (crest + name), an ivory canvas, and a top bar with term switcher (e.g. "Term 1 · 2027"), search (⌘K: learner, admission number, guardian phone), notifications and the user menu.
- Mobile shell: a bottom tab bar (Home, Families, Payments, Notices, More) and a floating **Request payment** button.

### 8.5 Motion
- 150–250 ms ease-out; content fades and rises 4 px.
- **Bell ripple** on a new payment in the live feed (once, subtle) and on reaching 100% for a class. An optional soft chime, off by default.
- Count-up on dashboard figures, once per session. Respect `prefers-reduced-motion`.

### 8.6 Signature components (proof-one: design these first)
1. **Term Collection Ring:** a large ring with a coral arc on a navy-100 track; centre shows "68% collected" in Fraunces, with "KSh 5.1m of 7.5m · Term 1 2027" below; tap to see by grade.
2. **Class Heatmap:** a grid of grades × streams; each tile shows % collected, a colour scale from plum (low) through amber to green (high), learner count, and the cleared count for the next event. It should feel like looking at the whole school at once.
3. **Family Card:** a stacked card showing the guardian(s) and each child (name, grade/stream, balance, status pill), the family total, plan status and quick actions (Request payment, Statement, Message).
4. **Live Payment Feed:** time, payer (masked phone), family/learner, amount, match badge (Auto · Guardian phone · Learned · Reviewed), a split indicator, and the bell ripple on arrival.
5. **Match Card (review queue):** the payment details plus the top 3 suggestions with reasons and confidence bars; keyboard shortcuts 1/2/3, F (assign to family and split), N (not ours), S (skip).
6. **Split Bar:** a horizontal bar showing how a payment was shared between siblings, in each child's tint, with amounts. The same visual appears in the parent's split confirmation page.
7. **Fee Structure Matrix:** a spreadsheet-like editor (grades × fee items) with sticky headers, keyboard navigation, copy-from-last-term, % uplift, a diff view versus last term, and approve/publish.
8. **Notice Composer:** two columns: an editor (EN | SW tabs, audience chips, channels, schedule) and a **live phone preview** toggling between WhatsApp and SMS, with a character counter and SMS-part estimate.
9. **Read-Receipt Meter:** delivered and read progress per notice, with a "resend by SMS to unread" action.
10. **Clearance Board:** for an event, columns Cleared · On plan · Not cleared · Overridden, with learner chips; no amounts shown to teacher roles.
11. **Receipt (web + PDF):** A5 portrait, ivory paper feel, a navy header band with the **school's crest** (Shulife mark small in the footer: "Powered by Shulife"), a large amount in Fraunces, an allocation table, a QR code and "Verified".
12. **Fee Statement PDF:** a bank-statement layout per child plus a family summary, with term sections, balance brought forward and the school's payment instructions.
13. **"Fully collected" moment:** when a stream reaches 100%, a gentle banner reads "Grade 4 East is fully paid for Term 1", with a single bell ripple.
14. Supporting components: KPI tile, Money text, Status pill, Data table (virtualised, column chooser, CSV export), Filter bar, Side sheet, Stepper, Photo capture, Audience chips, Command palette, Empty states (fine-line illustrations: bell, school gate, exercise books, a parent with a phone, in navy line art with coral accents).

### 8.7 Imagery
- Marketing: modern Kenyan private-school settings, learners in uniform (**licensed stock or commissioned only**, `{{PHOTO_SOURCE}}`, with model releases for children), parents with phones, a calm bursar's office, golden-hour light. No real school names or crests unless the school has given written permission (`{{CUSTOMER_PERMISSIONS}}`).
- Product mock-ups: real UI in phone and laptop frames.

### 8.8 Accessibility and inclusion
- WCAG 2.2 AA; 2 px coral-700 focus rings; 44 px touch targets.
- An EN/SW toggle on every parent screen; parent messages in the guardian's language.
- Low-literacy friendly: big numbers, icons with labels, and "Pay now" as the single dominant action.
- Low bandwidth: the parent portal works on 2G/3G; images lazy-loaded; no heavy fonts on parent pages (subset fonts, `font-display: swap`).

---

## 9. Marketing website (`(marketing)`)

**Goal:** a director lands, understands in 5 seconds, trusts in 30, books a demo in 2 minutes. A bursar finds the "how does matching work?" detail. A parent finds "how do I pay and check my balance?".
**Tech:** static/ISR, Lighthouse ≥ 95, OG images, sitemap, JSON-LD (`SoftwareApplication`, `Organization`, `FAQPage`).

### 9.1 Sitemap
`/` · `/how-it-works` · `/features` · `/for-directors` · `/for-bursars` · `/for-parents` (EN/SW, public help: how to pay, WhatsApp commands, statements) · `/pricing` · `/security` · `/about` · `/book-demo` · `/resources` · `/help` · `/legal/terms` · `/legal/privacy` · `/legal/dpa` · `/login`

### 9.2 Home page sections
1. **Hero:** "Every fee. Every parent. On time." Sub-line: "Shulife matches every M-Pesa payment, splits it between siblings, receipts parents instantly and keeps them informed, so your bursar gets their week back." CTA **Book a free demo** (coral, navy text) plus a secondary **See how it works**. Visual: a parent's phone showing a split confirmation, beside a laptop with the Term Collection Ring and Class Heatmap. A subtle bell ripple behind the phone.
2. **Trust strip:** "Your money never touches us" · "Works with your existing Paybill" · "Alongside any school system" · "No app for parents".
3. **"Every term starts the same way"** — before and after story cards: the bursar's lost week, "whose fees is this?", "But I paid!".
4. **How it works** (3 steps, animated): Bill → Collect → Confirm.
5. **The sibling moment:** an interactive demo where a visitor drags a KSh 45,000 payment onto a 3-child family and watches the Split Bar allocate it by rule (with a toggle between rules).
6. **Feature pillars** (8 cards): Automatic matching · Sibling splits · Itemised statements · Balance on WhatsApp · Payment plans + Ratiba · Kinder clearance · Director's dashboard · Notices with read receipts.
7. **"What late fees cost you" calculator:** learners, average fees per term and % paying late → outstanding, cash-flow gap and Shulife cost per term (uses `{{PRICE_PER_LEARNER_TERM}}`).
8. **For parents:** "Parents love it too": receipts, balance on WhatsApp, Kiswahili, no app. A mini WhatsApp chat mock-up (`SALIO` → balance reply).
9. **Security and trust:** money-flow diagram, children's data protection commitments, audit trail.
10. **Testimonials:** `{{TESTIMONIALS}}`. **Never invented.** The section stays hidden until real ones exist.
11. **Pricing teaser plus FAQ:** "Do we need a new Paybill?", "Does it replace our school system?", "What about cash and bank payments?", "Can teachers see fees?", "What if a parent pays the wrong number?", "Is our data safe?", "Do parents need an app?", "How long does setup take?", "What happens to receipts if we stop paying for Shulife?".
12. **Final CTA band** (navy with a coral ripple): "Ring in a calmer term." **Book a free demo.**
13. **Footer:** links, `{{SUPPORT_PHONE}}`, `{{SUPPORT_EMAIL}}`, WhatsApp `{{SUPPORT_WHATSAPP}}`, data protection registration `{{ODPC_REG_NO}}`.

### 9.3 Key pages
- **/for-bursars:** matching explained, the review queue, sibling rules, manual receipts and banking, term close, reports. A short demo video slot `{{DEMO_VIDEO_URL}}`.
- **/for-directors:** dashboards, cash projection, multi-campus, clearance and reputation, audit, pricing logic.
- **/for-parents:** bilingual public help: how to pay (Paybill + admission number or family code), how to read a statement, WhatsApp commands, payment plans, Ratiba setup, privacy. This page is linked in every parent message footer.
- **/book-demo:** school name, role, learner count, county, phone, best time → admin CRM lead + WhatsApp confirmation; optional `{{BOOKING_URL}}`.

### 9.4 SEO targets (Kenya)
*School fees management system Kenya*, *school fees M-Pesa reconciliation*, *school fee payment app Kenya*, *bursar software Kenya*, *parent communication app Kenya school*, *school fee statement template Kenya*. Resources articles answer one bursar or director question each.

---

## 10. The school web app (`(app)`) — screens

> Proof-one: build **Director Dashboard**, **Class Heatmap**, **Family Card**, **Live Payment Feed** and **Match Card** first; get approval; then roll out.

1. **Auth:** staff sign-in, 2FA, invite acceptance. A split layout: form on ivory, navy panel with the crest of the school being joined (or the Shulife mark).
2. **Onboarding wizard** (§11).
3. **Director Dashboard:** Term Collection Ring, KPI tiles (Collected today, This term, Outstanding, On plans, Auto-match rate), Class Heatmap, 30-day Cash Projection, Live Payment Feed, "Needs attention" (review queue, unbanked cash, change requests, unread parent messages, upcoming clearance event), and a campus switcher for groups.
4. **Bursar Workspace:** today's payments, review queue, manual receipt entry, daily cash-up, banking, change requests, plan instalments due today, quick search.
5. **Families:** a searchable list (by learner, admission number, guardian phone, family code) → **Family profile**: Family Card, children tabs (invoice, statement, allocations), guardians, payment history with split bars, plans, messages timeline (delivered/read), notes, and actions (Request payment, Send statement, Create plan, Add charge, Waiver request, Reallocate).
6. **Learners:** list by grade/stream with filters (status, boarding, route, cleared), learner detail, bulk actions (move stream, change route, add charge).
7. **Fees:** fee items, Fee Structure Matrix, transport routes, optional items, discount rules, sponsors, invoicing run (preview → commit), one-off charges, late-fee policy.
8. **Payments:** feed with filters, payment detail (raw M-Pesa fields, allocations, receipt), bank import, manual receipts, reversals, exports.
9. **Review queue:** Match Cards with a progress meter ("12 left, about 3 minutes").
10. **Payment plans:** list, create (per family or learner), instalment calendar, missed-instalment alerts.
11. **Reminders:** visual term timeline editor, tone presets, EN/SW template previews (SMS and WhatsApp side by side), quiet hours, weekly cap, a log with costs.
12. **Clearance:** events, rules, the Clearance Board, overrides, a PDF list for teachers.
13. **Notices:** composer, scheduled and sent lists, delivery and read dashboards, templates library.
14. **Events and consent:** create an event, track responses and payments, export the roster.
15. **Inbox:** shared parent inbox with tags, assignment and canned EN/SW replies.
16. **Reports:** collection by grade/stream/fee item, outstanding by age, plans performance, discounts and waivers, sponsor statements, daily cash-up, banking, term close pack, communication delivery stats. All exportable to PDF/CSV, with print layouts.
17. **Term management:** academic years and terms, the promote wizard, term close.
18. **Team:** members, roles, campus/grade scopes, 2FA enforcement.
19. **Settings:** campus profile and crest, receipt/statement branding, payment integrations (Daraja guided connect with test and URL registration; bank import formats), allocation rule and fee-item priority, clearance defaults, messaging (sender ID, WhatsApp number, quiet hours), data export, data retention, delete organisation (owner only).
20. **Billing** (Shulife subscription).
21. **Help:** guides, WhatsApp support, status page.
22. **Command palette (⌘K):** "ADM 1234", "Request payment from the Wanjiru family", "Notice to Grade 6 parents".

### 10.1 Class teacher view
Their streams only: class list with Cleared/Not cleared for the next event (no amounts), class notices composer (with approval if required), and read receipts for class notices.

### 10.2 Parent portal (`(parent)`, mobile-first, ≤ 150 KB JS)
Entry by magic link or SMS OTP (the phone must be a registered guardian).
- **Family home:** total balance (big Fraunces number), each child's card (grade/stream, balance, status), next due date or instalment, a **Pay now** button (STK to a number of their choice; choose full balance, an instalment, or another amount), and an **Auto-pay with Ratiba** explainer.
- **Statements:** per child and family, downloadable PDF.
- **Receipts:** list with download and share.
- **Fee structure:** the published structure for their children's grades, with optional items.
- **Payment plan:** view and accept by OTP; see instalments.
- **Split confirmation page:** the Split Bar and a "request a change" form.
- **Notices:** a feed of school notices sent to them.
- **Events and consent:** pending forms; consent + pay in one flow.
- **Contact the school:** a message to the inbox.
- **My details:** phone, email, language (EN/SW), WhatsApp opt-in.
- Balance and payment instructions work **without JavaScript** (progressive enhancement).

### 10.3 Sponsor portal
Sponsored learners, sponsor invoices and statements, payment instructions.

### 10.4 Admin console (`(admin)`)
School list and health (auto-match rate, webhook failures, message failures, subscription status), lead CRM from /book-demo, impersonation (school consent toggle, time-limited, audited), WhatsApp template status, feature flags, announcements, webhook replay.

---

## 11. Onboarding — "Live in an afternoon"

A resumable stepper, saved at every step:
1. **School details:** name, campus(es), crest upload, county, phone; your role.
2. **Academic set-up:** confirm grades (pre-filled for Kenya), add streams, enter current term dates.
3. **Learners and families:** upload Excel/CSV (template downloadable), **or a photo of a class register** (AI parses it into a table), **or** import from another system's export (column mapping). A preview with inline fixes. Families are auto-grouped by shared guardian phone, with confirmation.
4. **Fees:** build the Fee Structure Matrix (or upload last term's fee structure sheet), set optional items and routes, choose sibling allocation rule and fee-item priority.
5. **Opening balances:** import balances brought forward (CSV) so statements are right from day one.
6. **Connect payments:** M-Pesa Paybill/Till (Daraja guided connect, test, URL registration) and/or bank statement import format.
7. **Parents:** preview the welcome message (EN/SW) → send now or schedule; download the **"How to pay school fees" notice PDF** (crest, Paybill, account = admission number, WhatsApp commands, QR to `/for-parents`) for the notice board and the school diary.
8. **Reminders:** choose a tone preset; review the term timeline.
9. **Go-live checklist** with progress: "Your first matched payment unlocks your free period."

Concierge mode: a Shulife Admin can run steps 3–6 on behalf of the school (audited), because many schools will want setup done for them.

---

## 12. Messaging catalogue (EN + SW)

Rules: SMS ≤ 160 GSM-7 characters where possible (no emoji in SMS); WhatsApp templates are **Utility** category and need Meta approval; every message starts with the school name; respectful tone; **never addressed to learners**. Variables are in `{curly}`. **A native Kiswahili speaker must review all SW copy before launch** (`{{SW_REVIEW_DONE}}`).

| Key | English | Kiswahili |
|---|---|---|
| `welcome` | {school}: Welcome to Shulife. Pay fees via Paybill {paybill}, Account {adm_or_family}. Balance anytime: WhatsApp "BALANCE" to {wa}. {link} | {school}: Karibu Shulife. Lipa ada kupitia Paybill {paybill}, Akaunti {adm_or_family}. Salio wakati wowote: tuma "SALIO" WhatsApp kwa {wa}. {link} |
| `statement_published` | {school}: {term} fees for {children}: KSh {total}. Paybill {paybill}, Acc {adm_or_family}. Statement: {link} | {school}: Ada ya {term} kwa {children}: KSh {total}. Paybill {paybill}, Akaunti {adm_or_family}. Taarifa: {link} |
| `pre_opening` | {school}: School opens {date}. Balance for {children}: KSh {balance}. Pay in one tap: {link} | {school}: Shule itafunguliwa {date}. Salio la {children}: KSh {balance}. Lipa kwa mguso mmoja: {link} |
| `due_today` | {school}: Fees for {children} (KSh {balance}) are due today. Pay: {link}. Thank you. | {school}: Ada ya {children} (KSh {balance}) inatakiwa leo. Lipa: {link}. Asante. |
| `due_plus_7` | {school}: KSh {balance} for {children} is still outstanding. Pay via {link}, or reply PLAN to agree instalments with the bursar. | {school}: KSh {balance} ya {children} bado haijalipwa. Lipa kupitia {link}, au jibu MPANGO ili kukubaliana na mhasibu kuhusu awamu. |
| `clearance_notice` | {school}: {event} starts {date}. To avoid any disruption for {child}, please clear KSh {balance} or agree a plan by {deadline}: {link} | {school}: {event} itaanza {date}. Ili {child} asikose, tafadhali lipa KSh {balance} au kubaliana na mpango kabla ya {deadline}: {link} |
| `receipt` | {school}: Received KSh {amount} for {child}. Receipt {receipt_no}. Balance: KSh {balance}. Thank you! {link} | {school}: Tumepokea KSh {amount} kwa {child}. Risiti {receipt_no}. Salio: KSh {balance}. Asante! {link} |
| `split_confirmation` | {school}: KSh {amount} received and shared: {split}. Need a change? {link} | {school}: KSh {amount} imepokelewa na kugawanywa: {split}. Unahitaji kubadilisha? {link} |
| `plan_instalment` | {school}: Instalment {n} of {total_n} (KSh {amount}) for {children} is due {date}. Pay: {link} | {school}: Awamu ya {n} kati ya {total_n} (KSh {amount}) kwa {children} inatakiwa {date}. Lipa: {link} |
| `consent_request` | {school}: {event} on {date}. Cost KSh {cost}. Please respond by {deadline}: {link} | {school}: {event} tarehe {date}. Gharama KSh {cost}. Tafadhali jibu kabla ya {deadline}: {link} |
| `notice` | {school}: {title}. {body} | {school}: {title}. {body} |
| `wa_unknown_number` | Sorry, this number isn't registered with {school}. Please contact the school office on {phone}. | Samahani, nambari hii haijasajiliwa na {school}. Tafadhali wasiliana na ofisi ya shule kwa {phone}. |
| `director_daily` *(staff, email/WhatsApp)* | {school} today: KSh {today} collected, {pct}% of term. {review_count} payments need review. {link} | — |

WhatsApp commands (EN / SW): `BALANCE`/`SALIO`, `STATEMENT`/`TAARIFA`, `RECEIPT`/`RISITI`, `PAY`/`LIPA`, `FEES`/`ADA`, `PLAN`/`MPANGO` (routes a plan request to the bursar), `HELP`/`MSAADA`.

---

## 13. Security, privacy and children's data

- **Kenya Data Protection Act, 2019:** the **school is the data controller**; **Shulife is the processor**. Ship a Data Processing Agreement (`{{LEGAL_TEXT}}`, from a lawyer). Register with the ODPC (`{{ODPC_REG_NO}}`). Follow the Act's requirements for **children's personal data** (processing with parental/guardian consent and in the child's best interests) and document them in `DATA-PROTECTION.md`.
- **Minimisation:** learners have name, admission number, grade/stream, boarding/route and family link only. No photos, health data, national IDs or assessment numbers in v1. Guardian phones are hashed for matching (shown masked in lists).
- **Consent records:** WhatsApp opt-in and consent forms are stored with a timestamp and channel.
- **Access:** 2FA for director, head and bursar roles; teachers never see amounts; parents only ever see their own family; impersonation needs school consent and is audited.
- **Encryption:** TLS; Daraja secrets in Vault (never returned after saving); signed short-lived URLs for files.
- **Audit:** an append-only log of every money, permission, data-export and settings action, visible to the director under Settings → Activity.
- **Webhooks:** secret path, optional IP allow-list, schema validation, dedupe, dead-letter queue, replay.
- **Retention:** `{{RETENTION_YEARS}}` years for financial records (confirm with a lawyer and accountant); leavers' contact data is minimised after `{{LEAVER_CONTACT_RETENTION_MONTHS}}` months.
- **Data subject requests:** a guardian's access/correction request flow handled by the school, with admin tooling to export a family's data.
- **Backups:** point-in-time recovery; a quarterly restore drill.
- **Do not draft legal text.** Use clearly marked placeholders.

---

## 14. Performance and quality budgets
- Marketing: LCP < 2.0 s on 4G, CLS < 0.05, Lighthouse ≥ 95.
- App dashboard interactive < 2.5 s on mid-range Android over 4G; tables virtualise beyond 200 rows (schools may have 1,500 learners).
- Invoicing run: 1,500 learners in < 60 s; a notice to 3,000 guardians is queued in < 10 s.
- Parent portal ≤ 150 KB JS; balance visible < 1.5 s on 3G.
- Payment callback → receipt: p95 < 30 s. Webhook uptime 99.9%.
- **Term-opening load:** 2,000 callbacks in an hour without loss or duplicates.

---

## 15. Analytics and KPIs
- **School-facing KPIs:** % of term collected (by day of term vs last term), auto-match rate, average days to pay, plan compliance, reminder → payment conversion, notice read rate, unbanked cash.
- **Product analytics (PostHog; no learner or guardian personal data):** `onboarding_step_completed`, `integration_connected`, `invoicing_run_committed`, `first_payment_matched`, `review_card_resolved`, `split_change_requested`, `stk_initiated/succeeded`, `wa_command_used`, `notice_sent`, `consent_completed`, `term_closed`.
- **North-star metric:** the share of payments matched **and** allocated with no human touch (target ≥ 90% by the second term of use).

---

## 16. Testing and seed data
- **Seed:** a fictional school, "Mlima Academy" (two campuses: "Mlima Academy, Ruiru" and "Mlima Academy, Syokimau"), PP1–Grade 9, 2 streams per grade, 620 learners, 410 families (with 1–4 children each), 3 transport routes, boarders in Grades 7–9, one sponsor, and two terms of payment history including wrong references, sibling payments, bank imports, cash, plans, reversals and overpayments. Clearly marked as demo data; names from a neutral generated list.
- **Unit tests:** money utils, fee structure → invoice, discounts order, pro-rata, matching scores and thresholds, every sibling rule, fee-item priority, overpayment credit, reminders (quiet hours, caps, stop-on-paid, plan-aware), clearance rules, the cash projection maths.
- **Integration tests:** Daraja sandbox C2B, STK success/failure, duplicates, reversals; bank CSV import; WhatsApp command handling (registered vs unknown numbers).
- **End-to-end (Playwright):** onboarding → invoicing → first matched payment → split confirmation → parent requests change → bursar reallocates; plan accepted by OTP → instalment reminders → payment; consent + pay; term close.
- **Load:** the term-opening burst profile in §14.

---
## 17. Staged build plan (STOP after every stage)

| Stage | Build | Acceptance criteria | STOP: show me |
|---|---|---|---|
| **0. Foundations** | Monorepo, Next.js, Supabase, design tokens from §8 (navy/ivory/coral), Fraunces + Plus Jakarta Sans, themed shadcn, app shells (marketing, app, parent, admin), CI, Sentry, PostHog, DECISIONS.md | CI green; `/dev/tokens` shows colours (with contrast checks), type scale, buttons, inputs, pills, money text | Token page and shell screenshots |
| **1. Signature components (proof-one)** | Term Collection Ring, Class Heatmap, Family Card, Live Payment Feed with bell ripple, Match Card, Split Bar, Fee Structure Matrix (static), Notice Composer with phone preview, Read-Receipt Meter, Clearance Board, Receipt (web + PDF), Statement PDF, Empty states, in a `/dev/components` gallery with mock data | Pixel-polished, responsive, accessible, reduced-motion respected | The gallery. **Wait for design approval before anything else.** |
| **2. Marketing website** | All pages in §9, the sibling drag demo, the late-fees calculator, the bilingual /for-parents help, the book-demo form → leads | Lighthouse ≥ 95; no invented testimonials, prices or legal text | Preview URL + Lighthouse report |
| **3. Organisation, academics and people** | Auth + 2FA, organisations/campuses, roles and scopes, academic years/terms/grades/streams, learners, families, guardians, enrolments, RLS with tests, audit log | RLS tests prove isolation across schools, campuses and roles (teacher sees no amounts) | Role-by-role walkthrough |
| **4. Onboarding and import** | Wizard §11, Excel/CSV import with preview, photo-of-register import (flagged), family auto-grouping, opening balances import, "How to pay school fees" PDF | 600 learners imported in < 60 s with clear error fixing; families grouped correctly on seed data | Walkthrough |
| **5. Fees and billing** | Fee items, Fee Structure Matrix (live), routes, optional items, discounts, sponsors, invoicing run with preview, one-off charges, append-only ledger, statements (learner + family) | Totals reconcile to the cent on seed data; tests pass | Invoice and statement PDFs, test report |
| **6. Payments, matching, sibling allocation, receipts** | Daraja connect + test + URL registration, C2B webhook, queue, matching engine, sibling allocation (all rules), receipts, split confirmations, change requests, review queue with learning, bank CSV import, manual receipts, cash-up and banking, reversals | Sandbox: 300 simulated payments on seed data → ≥ 90% auto-matched and allocated; duplicates ignored; receipt p95 < 30 s | **Proof-one:** one end-to-end sandbox family payment: raw event → match → split → receipts → parent split page |
| **7. Reminders, plans and messaging** | EN/SW template registry, SMS + WhatsApp adapters, term timeline editor, tone presets, quiet hours, caps, holidays, stop-on-paid, payment plans with OTP acceptance, Ratiba | A simulated term sends the right messages at the right times, none in quiet hours or after payment | Message timeline for 5 sample families |
| **8. Parent portal and WhatsApp assistant** | Magic link/OTP, family home, Pay now (STK), statements, receipts, fee structure, plan acceptance, split page, notices, consent, contact school, EN/SW; WhatsApp commands with registered-number security | Works on a 360 px phone over 3G; unknown numbers get no data | Mobile screenshots EN + SW and a WhatsApp transcript |
| **9. Communication suite** | Notices composer (audiences, approvals, schedule), delivery + read dashboards, resend-to-unread by SMS, events and consent + pay, parent inbox, emergency broadcast, class teacher view | A notice to Grade 4 East reaches only those guardians; read receipts recorded | Composer demo + delivery dashboard |
| **10. Clearance, dashboards, projection and reports** | Clearance engine + board + teacher PDF, director dashboard (complete), cash projection, the full reports suite, term close + promote wizard, leavers' clearance | Term close carries balances forward exactly; clearance lists show no amounts | Dashboard + report pack |
| **11. Shulife subscriptions and admin** | Plans, learner counting per term, free-until-first-match, STK/Paystack billing, dunning, read-only mode (ingestion never stops), admin console, concierge onboarding mode | Lifecycle simulated: signup → free → trial → paid → overdue → read-only → restored | Admin walkthrough |
| **12. Mobile app (Expo)** | Director (dashboard, heatmap, feed) and bursar (review queue, manual receipts with camera, request payment), push notifications for payments | Runs on low-end Android 10+; camera capture works offline and syncs | Device screenshots + APK |
| **13. Hardening and launch** | Security checklist, load tests (term-opening burst), backup restore drill, legal placeholders swapped, ODPC line, status page, help centre, demo school | Every item in §13–§14 ticked | Launch readiness report |

---

## 18. Guardrails: never do these
- Never message a learner or store learner photos, health data or national IDs.
- Never show fee amounts to class teachers or transport staff beyond their scope.
- Never broadcast or export a "debtors" list outside the bursar/director roles.
- Never send parent messages in quiet hours, beyond the weekly cap, or after the balance is cleared.
- Never enable late fees by default.
- Never hold or route school fees through Shulife.
- Never edit or delete payments, ledger entries or audit entries. Adjust instead.
- Never disclose any data to an unregistered WhatsApp number.
- Never hard-code prices, tax/legal text, phone numbers or term dates.
- Never invent testimonials, statistics, school names as customers, or awards.
- Never add features, pages or dependencies not in this document without asking.
- Never skip a STOP gate.

---

## 19. Placeholder register

| Token | Meaning | Default / note |
|---|---|---|
| `{{DOMAIN}}` | Production domain | e.g. shulife.co.ke (**check availability**) |
| `{{SUPPORT_PHONE}}` / `{{SUPPORT_EMAIL}}` / `{{SUPPORT_WHATSAPP}}` | Support contacts | — |
| `{{WHATSAPP_NUMBER}}` | Shared Shulife WhatsApp number (until schools bring their own) | — |
| `{{SMS_SENDER_ID}}` | Default sender ID | "SHULIFE" (needs approval); per-school IDs later |
| `{{SHULIFE_PAYBILL}}` | Shulife's own Paybill for subscriptions | — |
| `{{PRICE_PER_LEARNER_TERM}}`, `{{MIN_TERM_FEE}}`, `{{PLAN_ESSENTIAL}}`, `{{PLAN_PLUS}}`, `{{PLAN_GROUP}}`, `{{TRIAL_DAYS}}`, `{{GRACE_DAYS_SUBSCRIPTION}}` | Pricing | To be decided |
| `{{AUTO_MATCH_THRESHOLD}}` | Auto-apply score | 90 |
| `{{FAMILY_CODE_PREFIX}}` | Family code prefix | "FAM" |
| `{{CAMPUS_CODE}}` | Short campus code on receipts/invoices | 3–4 letters |
| `{{HEAD_WAIVER_LIMIT}}` | Head teacher waiver approval limit | KSh 5,000 |
| `{{CLEARANCE_PCT}}` | Default clearance threshold | 70% (school-configurable) |
| `{{QUIET_START}}` / `{{QUIET_END}}` | Quiet hours | 21:00 / 07:00 |
| `{{MAX_REMINDERS_PER_WEEK}}` | Fee reminders cap per family | 2 |
| `{{UNREAD_FOLLOWUP_HOURS}}` | Resend unread notices by SMS after | 24 |
| `{{BANKING_SLA_DAYS}}` | Days before unbanked cash alerts | 2 |
| `{{BANK_FORMATS}}` | Supported bank CSV formats | Confirm with pilot schools' real statements |
| `{{SAFARICOM_CALLBACK_IPS}}` | Callback allow-list | Confirm from Safaricom documentation |
| `{{ODPC_REG_NO}}` | Data protection registration | Required before launch |
| `{{RETENTION_YEARS}}` / `{{LEAVER_CONTACT_RETENTION_MONTHS}}` | Retention | Confirm with a lawyer/accountant |
| `{{LEGAL_TEXT}}` | Terms, Privacy, DPA | From a lawyer |
| `{{TESTIMONIALS}}` / `{{CUSTOMER_PERMISSIONS}}` | Real quotes and written permission to show school names/crests | Hidden until available |
| `{{DEMO_VIDEO_URL}}` / `{{BOOKING_URL}}` | Marketing media | — |
| `{{PHOTO_SOURCE}}` | Licensed photography with model releases | — |
| `{{LOGO_FIGMA_URL}}` | Logo source | Figma file "Shulife — Brand & Pitch Assets" (recolour tick and sound lines to coral) |
| `{{SW_REVIEW_DONE}}` | Kiswahili copy reviewed by a native speaker | Must be true before launch |

---

## 20. Out of scope for v1 (do not build)
Timetables, exams, report cards and attendance · learner accounts or learner messaging · pocket-money/canteen wallets (leave a hook) · transport GPS tracking · fee loans/financing · eTIMS (hook only) · accounting sync (Xero/QuickBooks: hook only) · bank API integrations (statement import only) · countries other than Kenya · dark mode · AI chat assistant · native iOS build (Android first in Stage 12).

---

## 21. Your first response
Reply with:
1. A short confirmation that you have read and understood this masterplan.
2. Any **blocking questions** (maximum 10), grouped by stage.
3. Your proposed folder structure and the list of Stage 0 tasks.

Then **STOP** and wait for my "continue".
