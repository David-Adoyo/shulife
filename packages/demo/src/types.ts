import type { AllocationRule, Cents, Invoice, LedgerEntry, MatchResult } from "@shulife/core";

export type Lang = "en" | "sw";

export type Campus = { id: string; name: string; code: string; paybill: string };
export type Stream = { id: string; campusId: string; gradeCode: string; name: string; teacher: string };
export type Route = { id: string; campusId: string; name: string; amount: Cents };
export type Family = { id: string; code: string; displayName: string; lang: Lang; credit: Cents; campusId: string };
export type Guardian = { id: string; familyId: string; name: string; relationship: string; phone: string; phoneHash: string; whatsapp: boolean; lang: Lang; isPayer: boolean };
export type Learner = {
  id: string;
  campusId: string;
  familyId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gradeCode: string;
  streamId: string;
  boarding: "day" | "boarder";
  routeId: string | null;
  lunch: boolean;
  status: "active" | "left" | "graduated";
  ageKey: string;
  sponsored: boolean;
  staffChild: boolean;
};
export type Term = { id: string; key: string; name: string; number: number; year: number; opening: string; closing: string; due: string; status: "open" | "closed" };

export type OpenLine = { lineId: string; learnerId: string; termKey: string; feeItemId: string; feeItemCode: string; feeItemName: string; priority: number; amount: Cents; outstanding: Cents };

export type Payment = {
  id: string;
  providerRef: string;
  campusId: string;
  amount: Cents;
  billRef: string | null;
  phoneLast3: string | null;
  phoneHash: string | null;
  payerName: string | null;
  paidAt: string;
  channel: "c2b" | "stk" | "ratiba" | "bank_import" | "cash" | "cheque" | "bank_slip";
  matchStatus: "auto" | "manual" | "unmatched" | "suggested" | "reversed" | "not_ours";
  matchKind: "Auto" | "Guardian phone" | "Learned" | "Reviewed" | "Manual" | "—";
  confidence: number | null;
  familyId: string | null;
  learnerId: string | null;
  rule: AllocationRule | null;
  split: { learnerId: string; name: string; amount: Cents }[];
  credit: Cents;
  receiptNo: string | null;
  verifyCode: string | null;
  termId: string;
  suggestions: MatchResult["suggestions"];
  bookRef?: string;
  receivedBy?: string;
  banked?: boolean;
};

export type Plan = { id: string; familyId: string; termId: string; status: "active" | "completed" | "broken"; total: Cents; acceptedAt: string; instalments: { n: number; dueDate: string; amount: Cents; paid: Cents }[] };

export type Notice = { id: string; title: string; bodyEn: string; bodySw: string; audienceLabel: string; sentAt: string; channels: ("whatsapp" | "sms")[]; stats: { total: number; delivered: number; read: number; failed: number } };

export type SchoolEvent = { id: string; name: string; kind: "exam" | "trip"; date: string; cost: Cents; audienceLabel: string; consented: number; paid: number; invited: number };

export type InboxThread = { id: string; familyId: string; tag: "fees" | "transport" | "general"; subject: string; lastMessage: string; at: string; status: "open" | "closed" };

export type School = {
  org: { id: string; name: string; allocationRule: AllocationRule; clearancePct: number; quietStart: string; quietEnd: string; maxPerWeek: number; officePhone: string; familyPrefix: string; isDemo?: boolean; county?: string; setup?: Record<string, boolean>; liveAt?: string | null };
  today: string; // ISO instant "now" for the demo
  campuses: Campus[];
  grades: string[];
  streams: Stream[];
  routes: Route[];
  families: Family[];
  guardians: Guardian[];
  learners: Learner[];
  terms: Term[];
  feeItems: { id: string; code: string; name: string; kind: "mandatory" | "optional"; proRata: boolean; priority: number }[];
  structures: Record<string, { gradeCode: string; feeItemId: string; day: Cents; boarder: Cents }[]>; // by term id
  invoices: (Invoice & { id: string; number: string; campusId: string })[];
  lines: Map<string, OpenLine>;
  ledger: LedgerEntry[];
  payments: Payment[];
  payerLinks: { phoneHash: string; familyId: string; source: "guardian_record" | "learned" | "import" }[];
  plans: Plan[];
  notices: Notice[];
  events: SchoolEvent[];
  inbox: InboxThread[];
  duplicatesIgnored: number;
  receiptSeq: Record<string, number>;
  sponsor: { id: string; name: string };
};
