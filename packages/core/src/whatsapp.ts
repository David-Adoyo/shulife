import { formatKes, type Cents } from "./money";
import { render, type Lang } from "./messaging";

/**
 * Command-based WhatsApp assistant (§7.10) — no AI chat. The sender must be a
 * registered guardian of the family; unknown numbers get no data at all.
 */
export type Command = "balance" | "statement" | "receipt" | "pay" | "fees" | "plan" | "help" | "office";

const WORDS: Record<string, { command: Command; lang: Lang }> = {
  BALANCE: { command: "balance", lang: "en" }, SALIO: { command: "balance", lang: "sw" },
  STATEMENT: { command: "statement", lang: "en" }, TAARIFA: { command: "statement", lang: "sw" },
  RECEIPT: { command: "receipt", lang: "en" }, RISITI: { command: "receipt", lang: "sw" },
  PAY: { command: "pay", lang: "en" }, LIPA: { command: "pay", lang: "sw" },
  FEES: { command: "fees", lang: "en" }, ADA: { command: "fees", lang: "sw" },
  PLAN: { command: "plan", lang: "en" }, MPANGO: { command: "plan", lang: "sw" },
  HELP: { command: "help", lang: "en" }, MSAADA: { command: "help", lang: "sw" }, MENU: { command: "help", lang: "en" },
  OFFICE: { command: "office", lang: "en" }, OFISI: { command: "office", lang: "sw" },
};

export function parseCommand(text: string): { command: Command; lang: Lang } | null {
  const word = text.trim().toUpperCase().replace(/[^A-Z]/g, " ").split(/\s+/).filter(Boolean)[0];
  return word ? WORDS[word] ?? null : null;
}

export type WaFamily = {
  familyId: string;
  guardianPhoneHashes: string[];
  preferredLang: Lang;
  children: { name: string; balance: Cents }[];
  payLink: string;
};

export type WaReply =
  | { kind: "text"; text: string }
  | { kind: "document"; document: "statement" | "receipts" | "fee_structure"; familyId: string; caption: string }
  | { kind: "stk"; familyId: string; options: Cents[] }
  | { kind: "route_to_inbox"; familyId: string; tag: "fees" | "general"; text: string };

export function handleInbound(input: {
  senderPhoneHash: string;
  text: string;
  school: { name: string; officePhone: string; term: string };
  families: WaFamily[];
  rateLimiter?: { allow(key: string): boolean };
}): WaReply {
  const fam = input.families.find((f) => f.guardianPhoneHashes.includes(input.senderPhoneHash));
  const parsed = parseCommand(input.text);
  const lang: Lang = parsed?.lang ?? fam?.preferredLang ?? "en";
  if (!fam) {
    // Security: never disclose anything to an unregistered number.
    return { kind: "text", text: render("wa_unknown_number", lang, { school: input.school.name, phone: input.school.officePhone }) };
  }
  if (input.rateLimiter && !input.rateLimiter.allow(input.senderPhoneHash)) {
    return { kind: "text", text: lang === "sw" ? `${input.school.name}: Tafadhali jaribu tena baada ya dakika chache.` : `${input.school.name}: Please try again in a few minutes.` };
  }
  const school = input.school.name;
  switch (parsed?.command) {
    case "balance": {
      const total = fam.children.reduce((s, c) => s + c.balance, 0);
      const lines = fam.children.map((c) => `• ${c.name}: ${formatKes(c.balance)}`).join("\n");
      return { kind: "text", text: render("wa_balance", lang, { school, term: input.school.term, lines, total: formatKes(total, { prefix: false }), link: fam.payLink }) };
    }
    case "statement":
      return { kind: "document", document: "statement", familyId: fam.familyId, caption: `${school}: ${lang === "sw" ? "Taarifa ya" : "Statement for"} ${input.school.term}` };
    case "receipt":
      return { kind: "document", document: "receipts", familyId: fam.familyId, caption: `${school}: ${lang === "sw" ? "Risiti zako za mwisho" : "Your latest receipts"}` };
    case "fees":
      return { kind: "document", document: "fee_structure", familyId: fam.familyId, caption: `${school}: ${lang === "sw" ? "Muundo wa ada" : "Fee structure"}` };
    case "pay": {
      const total = fam.children.reduce((s, c) => s + c.balance, 0);
      return { kind: "stk", familyId: fam.familyId, options: total > 0 ? [total] : [] };
    }
    case "plan":
      return { kind: "route_to_inbox", familyId: fam.familyId, tag: "fees", text: "Parent asked for a payment plan via WhatsApp" };
    case "office":
      return { kind: "route_to_inbox", familyId: fam.familyId, tag: "general", text: input.text };
    default:
      return { kind: "text", text: render("wa_help", lang, { school }) };
  }
}

/** Simple fixed-window rate limiter (per sender), e.g. 10 commands per 10 minutes. */
export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, number[]>();
  return {
    allow(key: string) {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(t);
      hits.set(key, recent);
      return true;
    },
  };
}
