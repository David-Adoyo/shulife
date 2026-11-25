/**
 * EN/SW message catalogue (§12). Every message starts with the school name, is
 * respectful, and is never addressed to a learner. Kiswahili copy must be reviewed
 * by a native speaker before launch ({{SW_REVIEW_DONE}}).
 */
export type Lang = "en" | "sw";

export const TEMPLATES = {
  welcome: {
    en: "{school}: Welcome to Shulife. Pay fees via Paybill {paybill}, Account {adm_or_family}. Balance anytime: WhatsApp \"BALANCE\" to {wa}. {link}",
    sw: "{school}: Karibu Shulife. Lipa ada kupitia Paybill {paybill}, Akaunti {adm_or_family}. Salio wakati wowote: tuma \"SALIO\" WhatsApp kwa {wa}. {link}",
  },
  statement_published: {
    en: "{school}: {term} fees for {children}: KSh {total}. Paybill {paybill}, Acc {adm_or_family}. Statement: {link}",
    sw: "{school}: Ada ya {term} kwa {children}: KSh {total}. Paybill {paybill}, Akaunti {adm_or_family}. Taarifa: {link}",
  },
  pre_opening: {
    en: "{school}: School opens {date}. Balance for {children}: KSh {balance}. Pay in one tap: {link}",
    sw: "{school}: Shule itafunguliwa {date}. Salio la {children}: KSh {balance}. Lipa kwa mguso mmoja: {link}",
  },
  due_today: {
    en: "{school}: Fees for {children} (KSh {balance}) are due today. Pay: {link}. Thank you.",
    sw: "{school}: Ada ya {children} (KSh {balance}) inatakiwa leo. Lipa: {link}. Asante.",
  },
  due_plus_7: {
    en: "{school}: KSh {balance} for {children} is still outstanding. Pay via {link}, or reply PLAN to agree instalments with the bursar.",
    sw: "{school}: KSh {balance} ya {children} bado haijalipwa. Lipa kupitia {link}, au jibu MPANGO ili kukubaliana na mhasibu kuhusu awamu.",
  },
  due_plus_21: {
    en: "{school}: KSh {balance} for {children} remains outstanding. Please pay via {link} or contact the bursar to agree a plan. Thank you.",
    sw: "{school}: KSh {balance} ya {children} bado haijalipwa. Tafadhali lipa kupitia {link} au wasiliana na mhasibu ili kukubaliana na mpango. Asante.",
  },
  clearance_notice: {
    en: "{school}: {event} starts {date}. To avoid any disruption for {child}, please clear KSh {balance} or agree a plan by {deadline}: {link}",
    sw: "{school}: {event} itaanza {date}. Ili {child} asikose, tafadhali lipa KSh {balance} au kubaliana na mpango kabla ya {deadline}: {link}",
  },
  receipt: {
    en: "{school}: Received KSh {amount} for {child}. Receipt {receipt_no}. Balance: KSh {balance}. Thank you! {link}",
    sw: "{school}: Tumepokea KSh {amount} kwa {child}. Risiti {receipt_no}. Salio: KSh {balance}. Asante! {link}",
  },
  split_confirmation: {
    en: "{school}: KSh {amount} received and shared: {split}. Need a change? {link}",
    sw: "{school}: KSh {amount} imepokelewa na kugawanywa: {split}. Unahitaji kubadilisha? {link}",
  },
  plan_instalment: {
    en: "{school}: Instalment {n} of {total_n} (KSh {amount}) for {children} is due {date}. Pay: {link}",
    sw: "{school}: Awamu ya {n} kati ya {total_n} (KSh {amount}) kwa {children} inatakiwa {date}. Lipa: {link}",
  },
  consent_request: {
    en: "{school}: {event} on {date}. Cost KSh {cost}. Please respond by {deadline}: {link}",
    sw: "{school}: {event} tarehe {date}. Gharama KSh {cost}. Tafadhali jibu kabla ya {deadline}: {link}",
  },
  notice: { en: "{school}: {title}. {body}", sw: "{school}: {title}. {body}" },
  wa_unknown_number: {
    en: "Sorry, this number isn't registered with {school}. Please contact the school office on {phone}.",
    sw: "Samahani, nambari hii haijasajiliwa na {school}. Tafadhali wasiliana na ofisi ya shule kwa {phone}.",
  },
  wa_balance: {
    en: "{school}: Balance for {term}:\n{lines}\nTotal: KSh {total}\nPay: {link}",
    sw: "{school}: Salio la {term}:\n{lines}\nJumla: KSh {total}\nLipa: {link}",
  },
  wa_help: {
    en: "{school}: Send BALANCE, STATEMENT, RECEIPT, PAY, FEES or PLAN. Reply OFFICE to talk to the school office.",
    sw: "{school}: Tuma SALIO, TAARIFA, RISITI, LIPA, ADA au MPANGO. Jibu OFISI kuzungumza na ofisi ya shule.",
  },
  director_daily: {
    en: "{school} today: KSh {today} collected, {pct}% of term. {review_count} payments need review. {link}",
    sw: "{school} today: KSh {today} collected, {pct}% of term. {review_count} payments need review. {link}",
  },
} as const;

export type TemplateKey = keyof typeof TEMPLATES;

export function render(key: TemplateKey, lang: Lang, vars: Record<string, string | number>): string {
  const tpl: string = TEMPLATES[key][lang];
  const missing: string[] = [];
  const out = tpl.replace(/\{(\w+)\}/g, (_, k: string) => {
    if (vars[k] === undefined || vars[k] === null) {
      missing.push(k);
      return "";
    }
    return String(vars[k]);
  });
  if (missing.length) throw new Error(`Missing variables for ${key}: ${missing.join(", ")}`);
  if (key !== "wa_unknown_number" && !out.startsWith(String(vars.school))) throw new Error("Messages must start with the school name");
  return out;
}

/* ---------- SMS length and encoding ---------- */

const GSM7 = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM7_EXT = "^{}\\[~]|€";

export function smsInfo(text: string): { encoding: "GSM-7" | "UCS-2"; length: number; parts: number } {
  let gsm = true;
  let length = 0;
  for (const ch of text) {
    if (GSM7.includes(ch)) length += 1;
    else if (GSM7_EXT.includes(ch)) length += 2;
    else {
      gsm = false;
      break;
    }
  }
  if (!gsm) {
    const units = [...text].length;
    return { encoding: "UCS-2", length: units, parts: units <= 70 ? 1 : Math.ceil(units / 67) };
  }
  return { encoding: "GSM-7", length, parts: length <= 160 ? 1 : Math.ceil(length / 153) };
}

/** SMS must not contain emoji (§12). Replaces typographic quotes and dashes, flags the rest. */
export function toSmsSafe(text: string): { text: string; problems: string[] } {
  const t = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, "-").replace(/…/g, "...").replace(/ /g, " ");
  const problems = [...t].filter((ch) => !GSM7.includes(ch) && !GSM7_EXT.includes(ch));
  return { text: t, problems: [...new Set(problems)] };
}

/* ---------- Respectful tone (§7.7) ---------- */

const BLOCKED = ["debtor", "defaulter", "shame", "shameful", "irresponsible", "delinquent", "deadbeat", "will be sent home", "chase", "blacklist"];

export function checkTone(text: string): string[] {
  const lower = text.toLowerCase();
  return BLOCKED.filter((w) => lower.includes(w));
}
