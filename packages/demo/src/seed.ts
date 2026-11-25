import { buildInvoice, hashMsisdn, invoiceNumber, kes, nairobiDate, priorityFor, roundTo, upliftStructure, type DiscountRule, type FeeItem, type FeeStructure, type Sponsorship } from "@shulife/core";
import { familyBalance, ingest, resolveReview } from "./pipeline";
import type { Family, Guardian, Learner, OpenLine, Payment, School, Stream, Term } from "./types";

/**
 * "Mlima Academy" — a FICTIONAL demo school (§16). Two campuses, PP1–Grade 9,
 * 620 learners in 410 families, 3 bus routes, boarders in Grades 7–9, one sponsor
 * and two terms of payments, all processed through the real engines.
 * Names come from a neutral generated list; any resemblance is coincidental.
 */

export const SALT = "demo-salt";

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Amani", "Zawadi", "Baraka", "Wanjiru", "Achieng", "Kiprono", "Chebet", "Njeri", "Imani", "Neema", "Jabari", "Makena", "Wambui", "Kamau", "Otieno", "Akinyi", "Mwende", "Kibet", "Nafula", "Wekesa", "Aisha", "Fatma", "Yusuf", "Hassan", "Priya", "Arjun", "Anika", "Rohan", "Liam", "Emma", "Grace", "Daniel", "Mercy", "Brian", "Faith", "Kevin", "Joy", "Ian", "Chen", "Mei", "Leo", "Zara", "Tamara", "Elijah", "Sharon", "Victor", "Lulu", "Malaika", "Tumaini", "Pendo", "Zuri", "Jomo", "Nia", "Kofi", "Ayana", "Sanjay", "Noor", "Sofia", "Ethan", "Hawa"];
const LAST = ["Otieno", "Kamau", "Mwangi", "Wanjiku", "Ochieng", "Kiprop", "Mutua", "Njoroge", "Odhiambo", "Kariuki", "Wekesa", "Chebet", "Muriuki", "Achieng", "Kimani", "Omondi", "Waweru", "Kiplagat", "Nyambura", "Barasa", "Patel", "Shah", "Hassan", "Ali", "Mohamed", "Abdi", "Chen", "Wright", "Okafor", "Mensah", "Njeri", "Gitau", "Onyango", "Macharia", "Langat", "Koech", "Mugo", "Wairimu", "Ndegwa", "Juma"];
const ADULT = ["Janet", "Peter", "Mary", "Joseph", "Ann", "John", "Esther", "David", "Lucy", "James", "Ruth", "Samuel", "Alice", "Paul", "Rose", "Stephen", "Catherine", "Michael", "Agnes", "George", "Salma", "Omar", "Meera", "Raj", "Linda", "Mark"];

const GRADES = ["PP1", "PP2", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9"];

export function createSchool(seed = 2027): School {
  const r = rng(seed);
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const chance = (p: number) => r() < p;

  const campuses = [
    { id: "c-rui", name: "Mlima Academy, Ruiru", code: "RUI", paybill: "522533" },
    { id: "c-syo", name: "Mlima Academy, Syokimau", code: "SYO", paybill: "522533" },
  ];
  const streams: Stream[] = [];
  for (const c of campuses) for (const g of GRADES) for (const n of c.code === "RUI" ? ["East", "West"] : ["Blue", "Gold"]) streams.push({ id: `${c.code}-${g}-${n}`, campusId: c.id, gradeCode: g, name: n, teacher: `${pick(ADULT)} ${pick(LAST)}` });
  const routes = [
    { id: "r1", campusId: "c-rui", name: "Route 1 — Ruiru Town", amount: kes(7000) },
    { id: "r2", campusId: "c-rui", name: "Route 2 — Kamakis", amount: kes(8500) },
    { id: "r3", campusId: "c-syo", name: "Route 3 — Syokimau Estate", amount: kes(10000) },
  ];
  const terms: Term[] = [
    { id: "t-2026-3", key: "2026-3", name: "Term 3 2026", number: 3, year: 2026, opening: "2026-08-31", closing: "2026-10-30", due: "2026-09-07", status: "closed" },
    { id: "t-2027-1", key: "2027-1", name: "Term 1 2027", number: 1, year: 2027, opening: "2027-01-05", closing: "2027-04-01", due: "2027-01-12", status: "open" },
  ];
  const feeItems: (FeeItem & { proRata: boolean })[] = [
    { id: "fi-tu", code: "tuition", name: "Tuition", kind: "mandatory", proRata: true, priority: priorityFor("tuition") },
    { id: "fi-bo", code: "boarding", name: "Boarding", kind: "mandatory", proRata: true, priority: priorityFor("boarding") },
    { id: "fi-lu", code: "lunch", name: "Lunch", kind: "optional", proRata: true, priority: priorityFor("lunch") },
    { id: "fi-tr", code: "transport", name: "Transport", kind: "optional", proRata: true, priority: priorityFor("transport") },
    { id: "fi-ac", code: "activity", name: "Activity fee", kind: "mandatory", proRata: false, priority: 50 },
  ];
  const tuitionFor = (g: string) => (g.startsWith("PP") ? 28000 : Number(g.slice(1)) <= 6 ? 35000 : 42000);
  const t3: FeeStructure = {
    id: "fs-2026-3",
    termId: "t-2026-3",
    status: "published",
    rows: GRADES.flatMap((g) => [
      { gradeCode: g, feeItemId: "fi-tu", day: kes(tuitionFor(g)), boarder: kes(tuitionFor(g)) },
      { gradeCode: g, feeItemId: "fi-bo", day: 0, boarder: Number(g.slice(1)) >= 7 ? kes(25000) : 0 },
      { gradeCode: g, feeItemId: "fi-lu", day: kes(6500), boarder: 0 },
      { gradeCode: g, feeItemId: "fi-ac", day: kes(2500), boarder: kes(2500) },
    ]),
  };
  const t1: FeeStructure = { ...upliftStructure(t3, "t-2027-1", 6), id: "fs-2027-1", status: "published" };

  // ---------- Families and learners ----------
  const counts = [...Array(260).fill(1), ...Array(100).fill(2), ...Array(40).fill(3), ...Array(10).fill(4)].sort(() => r() - 0.5);
  // The first family is the Otieno family (3 children), so make sure slot 0 is a 3.
  const three = counts.indexOf(3);
  [counts[0], counts[three]] = [counts[three], counts[0]];
  const families: Family[] = [];
  const guardians: Guardian[] = [];
  const learners: Learner[] = [];
  const admSeq: Record<string, number> = { "c-rui": 1001, "c-syo": 5001 };
  const usedPhones = new Set<string>();
  const phone = () => {
    let p: string;
    do p = `07${String(Math.floor(r() * 1e8)).padStart(8, "0")}`;
    while (usedPhones.has(p));
    usedPhones.add(p);
    return p;
  };
  const grandparents = new Map<string, string>();

  counts.forEach((n, fi) => {
    const special = fi === 0; // The Otieno family used across the marketing site
    const surname = special ? "Otieno" : pick(LAST);
    const campusId = special ? "c-rui" : chance(0.68) ? "c-rui" : "c-syo";
    const famId = `f${fi + 1}`;
    const lang = chance(0.25) ? "sw" : "en";
    const kids = special ? 3 : n;
    const gradeIdx: number[] = [];
    let g = special ? 9 : Math.floor(r() * GRADES.length);
    for (let k = 0; k < kids; k++) {
      gradeIdx.push(Math.max(0, Math.min(GRADES.length - 1, g)));
      g -= 1 + Math.floor(r() * 3);
    }
    if (special) gradeIdx.splice(0, 3, 9, 6, 1);
    const adms: string[] = [];
    gradeIdx.forEach((gi, k) => {
      const grade = GRADES[gi];
      const adm = special ? ["2041", "2187", "2399"][k] : String(admSeq[campusId]++);
      adms.push(adm);
      const campusStreams = streams.filter((s) => s.campusId === campusId && s.gradeCode === grade);
      const boarder = gi >= 8 && chance(0.3);
      const campusRoutes = routes.filter((x) => x.campusId === campusId);
      learners.push({
        id: `l-${campusId.slice(2)}-${adm}`,
        campusId,
        familyId: famId,
        admissionNumber: adm,
        firstName: special ? ["Amani", "Zawadi", "Baraka"][k] : pick(FIRST),
        lastName: surname,
        gradeCode: grade,
        streamId: special ? campusStreams[0].id : pick(campusStreams).id,
        boarding: boarder ? "boarder" : "day",
        routeId: !boarder && chance(0.4) ? pick(campusRoutes).id : null,
        lunch: !boarder && chance(0.6),
        status: "active",
        ageKey: `${2027 - 4 - gi}-${String(1 + Math.floor(r() * 12)).padStart(2, "0")}`,
        sponsored: false,
        staffChild: false,
      });
    });
    const code = `FAM-${adms[0]}`;
    families.push({ id: famId, code, displayName: `The ${surname} family`, lang, credit: 0, campusId });
    const mum = { id: `${famId}-g1`, familyId: famId, name: special ? "Janet Otieno" : `${pick(ADULT)} ${surname}`, relationship: "Mother", phone: phone(), phoneHash: "", whatsapp: chance(0.75), lang, isPayer: true } as Guardian;
    guardians.push(mum);
    if (chance(0.55)) guardians.push({ id: `${famId}-g2`, familyId: famId, name: `${pick(ADULT)} ${surname}`, relationship: "Father", phone: phone(), phoneHash: "", whatsapp: chance(0.6), lang, isPayer: false });
    if (chance(0.08)) grandparents.set(famId, phone());
  });
  for (const gd of guardians) gd.phoneHash = hashMsisdn(gd.phone, SALT);

  // A few special cases for the matching fixtures (§16): sponsored and staff children, two learners with the same name.
  const pool = learners.filter((l) => l.familyId !== "f1");
  pool.slice(10, 14).forEach((l) => (l.sponsored = true));
  pool.slice(20, 23).forEach((l) => (l.staffChild = true));
  const twinA = pool.find((l) => l.gradeCode === "G4")!;
  const twinB = pool.find((l) => l.gradeCode === "G4" && l.familyId !== twinA.familyId)!;
  twinB.firstName = twinA.firstName;
  twinB.lastName = twinA.lastName;

  const school: School = {
    org: { id: "org-mlima", name: "Mlima Academy", allocationRule: "oldest_balance", clearancePct: 70, quietStart: "21:00", quietEnd: "07:00", maxPerWeek: 2, officePhone: "0700 000 000", familyPrefix: "FAM" },
    today: nairobiDate("2027-02-03", 9, 30).toISOString(),
    campuses,
    grades: GRADES,
    streams,
    routes,
    families,
    guardians,
    learners,
    terms,
    feeItems,
    structures: { "t-2026-3": t3.rows, "t-2027-1": t1.rows },
    invoices: [],
    lines: new Map(),
    ledger: [],
    payments: [],
    payerLinks: guardians.map((g) => ({ phoneHash: g.phoneHash, familyId: g.familyId, source: "guardian_record" as const })),
    plans: [],
    notices: [],
    events: [],
    inbox: [],
    duplicatesIgnored: 0,
    receiptSeq: {},
    sponsor: { id: "sp-1", name: "Demo Sponsor Ltd" },
  };

  // ---------- Invoicing (both terms) ----------
  const discounts: DiscountRule[] = [
    { kind: "sibling", minRank: 3, percent: 10, feeItemCodes: ["tuition"], label: "Sibling discount 10%" },
    { kind: "staff", percent: 50, feeItemCodes: ["tuition"], label: "Staff child 50%" },
  ];
  const seqs: Record<string, number> = {};
  const invoiceTerm = (term: Term) => {
    const structure = term.id === "t-2026-3" ? t3 : t1;
    for (const fam of families) {
      const kids = learners.filter((l) => l.familyId === fam.id).sort((a, b) => a.ageKey.localeCompare(b.ageKey));
      kids.forEach((l, rank) => {
        const gi = GRADES.indexOf(l.gradeCode) - (term.id === "t-2026-3" ? 1 : 0);
        if (gi < 0) return; // PP1 learners joined in January
        const campus = campuses.find((c) => c.id === l.campusId)!;
        const route = routes.find((x) => x.id === l.routeId) ?? null;
        const sponsorships: Sponsorship[] = l.sponsored ? [{ sponsorId: "sp-1", sponsorName: "Demo Sponsor Ltd", feeItemCodes: ["tuition"], percent: 50 }] : [];
        const inv = buildInvoice({
          enrolment: { learnerId: l.id, termId: term.id, gradeCode: GRADES[gi], boarding: l.boarding, optionalItemIds: l.lunch ? ["fi-lu"] : [], route, siblingRank: rank + 1, staffChild: l.staffChild },
          structure,
          feeItems,
          term: { opening: term.opening, closing: term.closing },
          discountRules: discounts,
          sponsorships,
        });
        const key = `${campus.code}-${term.key}`;
        seqs[key] = (seqs[key] ?? 0) + 1;
        const id = `inv-${term.key}-${l.id}`;
        school.invoices.push({ ...inv, id, number: invoiceNumber(campus.code, term.year, term.number, seqs[key]), campusId: campus.id });
        const posted = nairobiDate(term.opening, 9).getTime() - 14 * 86_400_000;
        const byItem = new Map<string, number>();
        for (const line of inv.lines) {
          school.ledger.push({ id: `${id}:${line.key}`, learnerId: l.id, termKey: term.key, at: new Date(posted).toISOString(), kind: line.kind === "charge" ? "invoice_line" : line.kind === "sponsorship" ? "sponsor" : "discount", description: line.description, amount: line.amount, ref: school.invoices.at(-1)!.number });
          if (line.feeItemCode) byItem.set(line.feeItemCode, (byItem.get(line.feeItemCode) ?? 0) + line.amount);
        }
        for (const [code, amount] of byItem) {
          if (amount <= 0) continue;
          const item = feeItems.find((f) => f.code === code)!;
          const open: OpenLine = { lineId: `${id}:${code}`, learnerId: l.id, termKey: term.key, feeItemId: item.id, feeItemCode: code, feeItemName: item.name, priority: item.priority, amount, outstanding: amount };
          school.lines.set(open.lineId, open);
        }
      });
    }
  };

  // ---------- Payments ----------
  let seq = 0;
  const truth = new Map<string, string>(); // payment id → true family (to simulate the bursar's review decisions)
  const make = (term: Term, fam: Family, amount: number, at: number, style: string): { p: Payment; manual?: string } => {
    const kids = learners.filter((l) => l.familyId === fam.id);
    const payer = guardians.find((g) => g.familyId === fam.id && g.isPayer)!;
    const kid = pick(kids);
    const campus = campuses.find((c) => c.id === fam.campusId)!;
    const id = `p${++seq}`;
    const base: Payment = { id, providerRef: `${term.year === 2026 ? "SJ" : "TA"}${String(100000 + seq * 7)}${String.fromCharCode(65 + (seq % 26))}${String.fromCharCode(75 + (seq % 15))}`, campusId: campus.id, amount, billRef: null, phoneLast3: payer.phone.slice(-3), phoneHash: payer.phoneHash, payerName: payer.name.toUpperCase(), paidAt: new Date(at).toISOString(), channel: "c2b", matchStatus: "unmatched", matchKind: "—", confidence: null, familyId: null, learnerId: null, rule: null, split: [], credit: 0, receiptNo: null, verifyCode: null, termId: term.id, suggestions: [] };
    truth.set(id, fam.id);
    const stranger = () => {
      const ph = `07${String(Math.floor(r() * 1e8)).padStart(8, "0")}`;
      base.phoneHash = hashMsisdn(ph, SALT);
      base.phoneLast3 = ph.slice(-3);
      base.payerName = `${pick(ADULT)} ${pick(LAST)}`.toUpperCase();
    };
    switch (style) {
      case "adm":
        base.billRef = pick([kid.admissionNumber, `ADM ${kid.admissionNumber}`, `${kid.admissionNumber} ${kid.gradeCode.replace("G", "grade ")}`, `adm-0${kid.admissionNumber}`, `NO.${kid.admissionNumber}`]);
        if (chance(0.15)) stranger(); // a relative paying with the right number
        break;
      case "family":
        base.billRef = pick([fam.code, fam.code.replace("-", " "), fam.code.toLowerCase()]);
        break;
      case "phone":
        base.billRef = pick(["", "fees", "school fees", "SCHOOL FEES TERM 1", "Mama " + kid.firstName, "karo"]);
        break;
      case "bank":
        base.channel = "bank_import";
        base.billRef = `FT ${kid.admissionNumber} ${fam.displayName.split(" ")[1].toUpperCase()}`;
        base.phoneHash = null;
        base.phoneLast3 = null;
        break;
      case "name":
        stranger();
        base.billRef = `${kid.lastName} ${kid.gradeCode.replace("G", "GRADE ").replace("PP", "PP ")}`;
        break;
      case "typo": {
        stranger();
        const a = kid.admissionNumber;
        base.billRef = a.slice(0, -1) + String((Number(a.at(-1)) + 1) % 10);
        break;
      }
      case "grandparent": {
        const gp = grandparents.get(fam.id) ?? phone();
        grandparents.set(fam.id, gp);
        base.phoneHash = hashMsisdn(gp, SALT);
        base.phoneLast3 = gp.slice(-3);
        base.payerName = `${pick(ADULT)} ${kid.lastName}`.toUpperCase();
        base.billRef = pick(["fees for my grandchild", "", "school"]);
        break;
      }
      case "cash":
      case "cheque":
        base.channel = style;
        base.providerRef = `${style === "cash" ? "CSH" : "CHQ"}-${term.key}-${seq}`;
        base.bookRef = `RB-${4000 + seq}`;
        base.receivedBy = "Front office";
        base.banked = at < Date.parse(school.today) - 2 * 86_400_000 || chance(0.5);
        base.phoneHash = null;
        base.phoneLast3 = null;
        return { p: base, manual: fam.id };
    }
    return { p: base };
  };
  const styleFor = (fam: Family) => {
    const x = r();
    if (grandparents.has(fam.id) && x < 0.35) return "grandparent";
    if (x < 0.6) return "adm";
    if (x < 0.69) return "family";
    if (x < 0.85) return "phone";
    if (x < 0.9) return "bank";
    if (x < 0.935) return "name";
    if (x < 0.955) return "typo";
    return chance(0.6) ? "cash" : "cheque";
  };
  const roundUp = (c: number) => roundTo(c + 49_999, 50_000) - (c % 50_000 === 0 ? 50_000 : 0);

  const events: { at: number; build: () => void }[] = [];
  // Statements are published 14 days before each term opens (§7.7).
  for (const term of terms) events.push({ at: nairobiDate(term.opening, 9).getTime() - 14 * 86_400_000, build: () => invoiceTerm(term) });
  for (const term of terms) {
    const open = nairobiDate(term.opening).getTime();
    const end = term.status === "closed" ? nairobiDate(term.closing).getTime() : Date.parse(school.today) - 3_600_000;
    const span = (end - (open - 10 * 86_400_000)) / 86_400_000;
    for (const fam of families) {
      const x = r();
      const kind = term.status === "closed" ? (x < 0.88 ? "full" : x < 0.97 ? "partial" : "none") : x < 0.56 ? "full" : x < 0.78 ? "partial" : x < 0.85 ? "plan" : "none";
      if (kind === "none") continue;
      if (kind === "plan") {
        events.push({
          at: nairobiDate("2027-01-08", 10).getTime(),
          build: () => {
            const total = familyBalance(school, fam.id);
            if (total <= 0) return;
            const third = roundTo(Math.floor(total / 3), 100);
            const instalments = [
              { n: 1, dueDate: "2027-01-12", amount: total - 2 * third, paid: 0 },
              { n: 2, dueDate: "2027-02-12", amount: third, paid: 0 },
              { n: 3, dueDate: "2027-03-12", amount: third, paid: 0 },
            ];
            school.plans.push({ id: `plan-${fam.id}`, familyId: fam.id, termId: term.id, status: "active", total, acceptedAt: new Date(nairobiDate("2027-01-08", 10)).toISOString(), instalments });
            const { p } = make(term, fam, instalments[0].amount, nairobiDate("2027-01-11", 12).getTime(), "family");
            if (ingest(school, p) !== "duplicate") instalments[0].paid = p.matchStatus === "auto" ? instalments[0].amount : 0;
          },
        });
        continue;
      }
      const nPay = kind === "full" ? 1 + Math.floor(r() * 2) : 1 + Math.floor(r() * 3);
      const share = kind === "full" ? 1 : 0.4 + r() * 0.5;
      for (let k = 0; k < nPay; k++) {
        const at = open - 10 * 86_400_000 + Math.floor(Math.pow(r(), 1.8) * span) * 86_400_000 + (7 + Math.floor(r() * 13)) * 3_600_000 + Math.floor(r() * 60) * 60_000;
        if (at > end) continue;
        const style = styleFor(fam);
        events.push({
          at,
          build: () => {
            const owed = familyBalance(school, fam.id);
            if (owed <= 0) return;
            const target = Math.round((owed * share) / (nPay - k));
            let amount = k === nPay - 1 && kind === "full" ? owed : roundTo(target, 50_000) || 50_000;
            if (kind === "full" && k === nPay - 1 && chance(0.25)) amount = roundUp(owed); // overpayments become credit
            if (amount <= 0) return;
            const { p, manual } = make(term, fam, amount, at, style);
            ingest(school, p, { manualFamilyId: manual });
          },
        });
      }
    }
  }
  // Payments for other schools (not ours), and repeated callbacks (duplicates).
  for (let k = 0; k < 6; k++) {
    const term = k < 3 ? terms[0] : terms[1];
    const at = (k < 3 ? nairobiDate("2026-09-10").getTime() : Date.parse(school.today) - (k - 2) * 3 * 86_400_000) + k * 3_600_000;
    events.push({
      at,
      build: () => {
        const ph = `07${String(Math.floor(r() * 1e8)).padStart(8, "0")}`;
        const p: Payment = { id: `p${++seq}`, providerRef: `ZZ${900000 + k}`, campusId: "c-rui", amount: kes(5000 + k * 1500), billRef: pick(["ST MARYS 98765", "KIAMBU HIGH 445566", "RENT JAN", "CHURCH TITHE"]), phoneLast3: ph.slice(-3), phoneHash: hashMsisdn(ph, SALT), payerName: `${pick(ADULT)} ${pick(LAST)}`.toUpperCase(), paidAt: new Date(at).toISOString(), channel: "c2b", matchStatus: "unmatched", matchKind: "—", confidence: null, familyId: null, learnerId: null, rule: null, split: [], credit: 0, receiptNo: null, verifyCode: null, termId: term.id, suggestions: [] };
        ingest(school, p);
        truth.set(p.id, "NOT_OURS");
      },
    });
  }
  // A few payments arriving this morning, so the live feed has something to show.
  for (let k = 0; k < 7; k++) {
    const at = nairobiDate("2027-02-03", 7, 5).getTime() + k * 19 * 60_000;
    const fam = families[(k * 37 + 11) % families.length];
    const style = ["adm", "family", "phone", "adm", "adm", "phone", "adm"][k];
    events.push({
      at,
      build: () => {
        const owed = familyBalance(school, fam.id);
        if (owed <= 0) return;
        const { p } = make(terms[1], fam, k % 3 === 0 ? owed : roundTo(Math.round(owed / 2), 50_000) || 50_000, at, style);
        ingest(school, p);
      },
    });
  }
  events.sort((a, b) => a.at - b.at);
  for (const e of events) e.build();
  for (const p of school.payments.filter((x) => x.channel === "c2b").slice(40, 45)) ingest(school, { ...p, id: `${p.id}-dup` }); // duplicate callbacks are ignored

  // The bursar works through the review queue, except the last week's items.
  const cutoff = Date.parse(school.today) - 7 * 86_400_000;
  for (const p of school.payments.filter((x) => x.matchStatus === "suggested" || x.matchStatus === "unmatched")) {
    if (Date.parse(p.paidAt) > cutoff) continue;
    const famId = truth.get(p.id);
    if (!famId || famId === "NOT_OURS") resolveReview(school, p.id, { notOurs: true });
    else resolveReview(school, p.id, { familyId: famId });
  }

  // Two reversals in last term (e.g. a payment sent to the wrong Paybill and recalled).
  for (const p of school.payments.filter((x) => x.termId === "t-2026-3" && x.matchStatus === "auto" && x.split.length === 1).slice(3, 5)) {
    for (const e of school.ledger.filter((x) => x.id.startsWith(`${p.id}:`))) {
      school.ledger.push({ ...e, id: `${e.id}:rev`, kind: "reversal", amount: -e.amount, description: `Reversal — ${p.receiptNo}`, at: new Date(Date.parse(p.paidAt) + 86_400_000).toISOString() });
      const line = school.lines.get(e.id.slice(p.id.length + 1));
      if (line) line.outstanding -= e.amount;
    }
    p.matchStatus = "reversed";
  }


  // Plans that are behind become "broken" so clearance and reminders reflect it.
  for (const plan of school.plans) plan.status = plan.instalments[0].paid > 0 ? "active" : "broken";

  seedCommunication(school);
  return school;
}

function seedCommunication(s: School) {
  const at = (d: string, h = 10) => nairobiDate(d, h).toISOString();
  s.notices.push(
    { id: "n1", title: "Welcome back for Term 1", bodyEn: "School opens on Tuesday 5 January. Please ensure your child arrives by 7:30 am in full uniform.", bodySw: "Shule itafunguliwa Jumanne tarehe 5 Januari. Tafadhali hakikisha mtoto wako anafika kufikia saa 1:30 asubuhi akiwa amevaa sare kamili.", audienceLabel: "Whole school", sentAt: at("2027-01-02"), channels: ["whatsapp", "sms"], stats: { total: 588, delivered: 581, read: 503, failed: 7 } },
    { id: "n2", title: "Grade 6 science trip", bodyEn: "Grade 6 will visit the Nairobi National Museum on Friday 12 February. Please give consent and pay the trip fee by Monday 8 February.", bodySw: "Darasa la 6 litatembelea Makumbusho ya Kitaifa ya Nairobi Ijumaa tarehe 12 Februari. Tafadhali toa idhini na ulipe ada ya safari kabla ya Jumatatu tarehe 8 Februari.", audienceLabel: "Grade 6 · both campuses", sentAt: at("2027-01-28"), channels: ["whatsapp", "sms"], stats: { total: 64, delivered: 63, read: 49, failed: 1 } },
    { id: "n3", title: "Route 2 pick-up time change", bodyEn: "From Monday, the Route 2 bus will collect learners 10 minutes earlier, at 6:20 am.", bodySw: "Kuanzia Jumatatu, basi la Njia ya 2 litachukua wanafunzi dakika 10 mapema, saa 12:20 asubuhi.", audienceLabel: "Route 2 — Kamakis", sentAt: at("2027-01-30"), channels: ["whatsapp", "sms"], stats: { total: 71, delivered: 71, read: 52, failed: 0 } },
    { id: "n4", title: "Mid-term exams timetable", bodyEn: "Mid-term exams begin on Monday 15 February. The timetable is attached.", bodySw: "Mitihani ya katikati ya muhula itaanza Jumatatu tarehe 15 Februari. Ratiba imeambatishwa.", audienceLabel: "Grades 4–9", sentAt: at("2027-02-01"), channels: ["whatsapp"], stats: { total: 342, delivered: 336, read: 201, failed: 6 } },
  );
  s.events.push(
    { id: "e1", name: "Mid-term exams", kind: "exam", date: "2027-02-15", cost: 0, audienceLabel: "Grades 4–9", consented: 0, paid: 0, invited: 0 },
    { id: "e2", name: "Grade 6 science trip", kind: "trip", date: "2027-02-12", cost: kes(1500), audienceLabel: "Grade 6", consented: 41, paid: 36, invited: 64 },
  );
  const fam = (i: number) => s.families[i].id;
  s.inbox.push(
    { id: "i1", familyId: fam(4), tag: "fees", subject: "Payment plan request", lastMessage: "PLAN", at: at("2027-02-02", 19), status: "open" },
    { id: "i2", familyId: fam(9), tag: "transport", subject: "Change of bus stop", lastMessage: "Could Baraka be picked up at the Total petrol station from next week?", at: at("2027-02-02", 8), status: "open" },
    { id: "i3", familyId: fam(15), tag: "general", subject: "Sports day", lastMessage: "Asante sana kwa taarifa. Tutakuja.", at: at("2027-02-01", 16), status: "closed" },
  );
}
