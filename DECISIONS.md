# Decisions

## 2026-11-25 · Marketing site first pass
- **Palette:** midnight navy (`#14204A`, matching the logo) as the theme colour, warm cream (`#FDF9F1`) for contrast and gold (`#DFB460`) for calls to action. Coral (`#FF6A45`) is kept only for the logo dot, as in the supplied logo.
- **Layout:** structure inspired by a leading fintech home page (audience toggle, mega menus, kinetic "… smarter" sections, card carousel, trust section, multi-row footer), with original Shulife content and visuals.
- **Logo:** the supplied 78×28 and 72×80 PNGs were redrawn as SVG vectors (wordmark outlined from Plus Jakarta Sans ExtraBold) so they stay sharp at every size.
- **Imagery:** AI-generated photographs of diverse learners and teachers. Swap for licensed photography with model releases (`{{PHOTO_SOURCE}}`) before launch.
- **Placeholders:** no prices, contacts, testimonials or statistics are invented; the demo form is a preview and does not send data yet.

## 2026-11-25 · Remaining marketing pages
- **Legal pages** show what each document will cover and a clear "being prepared" notice; no legal text is drafted (§13).
- **Pricing** shows the model (per learner per term, free until first automatic match) and stays without amounts until `pricePerLearnerTerm` is set in `src/lib/site.ts`. Plan tiers are not shown because their contents are not yet defined.
- **Kiswahili** on /for-parents is a first draft and must be reviewed by a native speaker before launch (`swReviewDone` in `src/lib/site.ts`).
- **Resources** guides contain practical advice only — no statistics or customer claims.
- **Sitemap.xml** is deferred until the production domain (`{{DOMAIN}}`) is confirmed.

## 2026-11-25 · Product build (stages 0–11)
- **Monorepo with npm workspaces** instead of a separate tool: fewer dependencies (§0.1 rule 1).
- **Demo data source first.** Without a Supabase project or Daraja keys, the app runs on an in-memory demo school processed by the real engines. The Postgres schema and RLS are written and tested separately; wiring the app to Supabase is the next step (docs/LAUNCH-CHECKLIST.md).
- **Demo role switcher** stands in for Supabase Auth so each role's view can be reviewed; permission rules mirror the RLS policies.
- **Matching combination rule:** the strongest signal plus 30% of the others, capped at 100; auto-apply at ≥ 90 with a 15-point margin; typos and learners who have left are never auto-applied.
- **Oldest-balance rule:** each term tier is settled oldest first, shared across children in proportion to what each owes in that tier; whole shillings where possible.
- **Overpayment** becomes family credit (learner credit under the exact-number rule) and is applied automatically when the next term is invoiced.
- **Ratiba** is behind an adapter that refuses to run until Safaricom's API is confirmed.
- **Not built yet:** PDF generation, Supabase wiring, the Expo mobile app (Stage 12), load tests.
