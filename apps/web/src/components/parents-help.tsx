"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { Container, Eyebrow, Money } from "./ui";
import { Photo, FaqList } from "./shared";
import { faqParents } from "./content";

/* Bilingual public help for parents (§9.3). Kiswahili copy must be reviewed by a
 * native speaker before launch ({{SW_REVIEW_DONE}} in src/lib/site.ts). */

type Lang = "en" | "sw";

const t = {
  en: {
    eyebrow: "Help for parents",
    title: ["Paying school fees,", "made simple."],
    intro: "No app and no password. Pay with M-Pesa, get your receipt in seconds and check your balance on WhatsApp — any time.",
    jump: ["How to pay", "Check your balance", "Your statement", "Payment plans", "Privacy"],
    payTitle: "How to pay with M-Pesa",
    payIntro: "Pay into your school’s own Paybill. The money goes straight to the school.",
    steps: [
      ["Open M-Pesa", "Choose Lipa na M-PESA, then Pay Bill."],
      ["Business number", "Enter your school’s Paybill number. You’ll find it on the school’s notice and in every message from the school."],
      ["Account number", "Enter your child’s admission number, for example 2041 — or your family code, for example FAM-2041, to pay for all your children at once."],
      ["Amount and PIN", "Enter the amount and your M-Pesa PIN, then confirm."],
      ["Your receipt", "The school’s receipt arrives by WhatsApp or SMS within seconds."],
    ],
    bank: "Paying at the bank? Use your child’s admission number or family code as the reference.",
    wrong: "Typed the wrong account number? Don’t worry — Shulife also recognises your registered phone number, and the bursar checks anything unclear. You’ll get your receipt once it’s matched.",
    phoneBiz: "Business no.",
    phoneBizVal: "Your school’s Paybill",
    phoneAcc: "Account no.",
    phoneAmt: "Amount",
    waTitle: "Your balance on WhatsApp",
    waIntro: "Send one word to your school’s WhatsApp number from your registered phone.",
    waCols: ["Send", "Or", "You get"],
    cmds: [
      ["BALANCE", "SALIO", "The balance for each of your children, with a pay link"],
      ["STATEMENT", "TAARIFA", "This term’s statement as a PDF"],
      ["RECEIPT", "RISITI", "Your last three receipts"],
      ["PAY", "LIPA", "An M-Pesa payment prompt on your phone"],
      ["FEES", "ADA", "The fee structure for your children’s grades"],
      ["PLAN", "MPANGO", "A request to the bursar for an instalment plan"],
      ["HELP", "MSAADA", "The menu, and a way to talk to the school office"],
    ],
    waNote: "For your family’s privacy, Shulife only answers numbers registered with the school.",
    stTitle: "How to read your statement",
    stIntro: "Every child gets an itemised statement each term. Here’s what each part means.",
    st: [
      ["Balance brought forward", "Anything left from last term, carried over automatically."],
      ["Fee items", "What this term’s fees are for. Optional items like lunch or transport are clearly marked."],
      ["Payments", "Every payment you made, with its receipt number."],
      ["Balance", "What’s left to pay this term. Zero means fully paid."],
    ],
    stLabels: ["Balance brought forward", "Tuition", "Lunch (optional)", "Transport — Route 2 (optional)", "Payment · RCT-000456", "Balance"],
    plTitle: "Payment plans and auto-pay",
    plans: [
      ["Pay in instalments", "Can’t pay the whole term at once? Reply PLAN on WhatsApp or talk to the bursar. You accept the plan with a code sent by SMS, and get a reminder two days before each instalment and on the day."],
      ["Auto-pay with M-PESA Ratiba", "If your school offers it, set up a standing order once and each instalment is paid automatically. You approve it on your own phone."],
      ["Kinder than sending children home", "If fees are outstanding before exams or a trip, the school contacts you first — privately and politely — with options to pay or agree a plan."],
    ],
    prTitle: "Your privacy",
    privacy: [
      "Only you and the school’s bursar and director can see your balance.",
      "Teachers only see whether a child is cleared — never any amounts.",
      "Shulife never sends messages to children.",
      "Your money goes straight to the school’s account. Shulife never holds it.",
    ],
    faqTitle: "Common questions",
    faqs: faqParents,
    demo: "Example only. Your school’s details will be different.",
  },
  sw: {
    eyebrow: "Msaada kwa wazazi",
    title: ["Kulipa karo,", "kwa urahisi."],
    intro: "Hakuna programu wala nenosiri. Lipa kwa M-PESA, pokea risiti ndani ya sekunde chache na uangalie salio lako kupitia WhatsApp — wakati wowote.",
    jump: ["Jinsi ya kulipa", "Angalia salio", "Taarifa yako", "Mipango ya malipo", "Faragha"],
    payTitle: "Jinsi ya kulipa kwa M-PESA",
    payIntro: "Lipa kwenye Paybill ya shule yako. Pesa huenda moja kwa moja kwa shule.",
    steps: [
      ["Fungua M-PESA", "Chagua Lipa na M-PESA, kisha Pay Bill."],
      ["Namba ya biashara", "Weka namba ya Paybill ya shule yako. Utaipata kwenye tangazo la shule na katika kila ujumbe kutoka kwa shule."],
      ["Namba ya akaunti", "Weka namba ya usajili ya mtoto wako, kwa mfano 2041 — au namba ya familia, kwa mfano FAM-2041, kuwalipia watoto wako wote kwa pamoja."],
      ["Kiasi na PIN", "Weka kiasi na PIN yako ya M-PESA, kisha thibitisha."],
      ["Risiti yako", "Risiti ya shule inafika kupitia WhatsApp au SMS ndani ya sekunde chache."],
    ],
    bank: "Unalipa benki? Tumia namba ya usajili ya mtoto wako au namba ya familia kama kumbukumbu.",
    wrong: "Umekosea namba ya akaunti? Usijali — Shulife pia hutambua namba yako ya simu iliyosajiliwa, na mhasibu hukagua chochote kisicho wazi. Utapokea risiti yako malipo yakishalinganishwa.",
    phoneBiz: "Namba ya biashara",
    phoneBizVal: "Paybill ya shule yako",
    phoneAcc: "Namba ya akaunti",
    phoneAmt: "Kiasi",
    waTitle: "Salio lako kupitia WhatsApp",
    waIntro: "Tuma neno moja kwa namba ya WhatsApp ya shule yako kutoka kwa simu yako iliyosajiliwa.",
    waCols: ["Tuma", "Au", "Utapokea"],
    cmds: [
      ["SALIO", "BALANCE", "Salio la kila mtoto wako, pamoja na kiungo cha kulipa"],
      ["TAARIFA", "STATEMENT", "Taarifa ya muhula huu kwa PDF"],
      ["RISITI", "RECEIPT", "Risiti zako tatu za mwisho"],
      ["LIPA", "PAY", "Ombi la malipo ya M-PESA kwenye simu yako"],
      ["ADA", "FEES", "Muundo wa ada kwa madarasa ya watoto wako"],
      ["MPANGO", "PLAN", "Ombi kwa mhasibu la mpango wa kulipa kwa awamu"],
      ["MSAADA", "HELP", "Menyu, na njia ya kuzungumza na ofisi ya shule"],
    ],
    waNote: "Kwa faragha ya familia yako, Shulife hujibu tu namba zilizosajiliwa na shule.",
    stTitle: "Jinsi ya kusoma taarifa yako",
    stIntro: "Kila mtoto hupata taarifa ya kina kila muhula. Hii ndiyo maana ya kila sehemu.",
    st: [
      ["Salio lililoletwa", "Kiasi chochote kilichobaki muhula uliopita, kinaletwa moja kwa moja."],
      ["Vipengele vya ada", "Ada ya muhula huu ni ya nini. Vipengele vya hiari kama chakula cha mchana au usafiri vimewekwa alama wazi."],
      ["Malipo", "Kila malipo uliyofanya, pamoja na namba ya risiti."],
      ["Salio", "Kiasi kilichobaki kulipwa muhula huu. Sifuri inamaanisha umelipa yote."],
    ],
    stLabels: ["Salio lililoletwa", "Masomo", "Chakula cha mchana (hiari)", "Usafiri — Njia 2 (hiari)", "Malipo · RCT-000456", "Salio"],
    plTitle: "Mipango ya malipo na kulipa kiotomatiki",
    plans: [
      ["Lipa kwa awamu", "Huwezi kulipa muhula mzima kwa mara moja? Jibu MPANGO kwenye WhatsApp au zungumza na mhasibu. Unakubali mpango kwa namba ya siri inayotumwa kwa SMS, na unapata ukumbusho siku mbili kabla ya kila awamu na siku yenyewe."],
      ["Lipa kiotomatiki kwa M-PESA Ratiba", "Ikiwa shule yako inatoa huduma hii, weka agizo la kudumu mara moja na kila awamu italipwa kiotomatiki. Unaidhinisha kwenye simu yako mwenyewe."],
      ["Wema kuliko kumrudisha mtoto nyumbani", "Ikiwa kuna ada ambayo haijalipwa kabla ya mitihani au safari, shule inawasiliana nawe kwanza — kwa faragha na kwa adabu — ukipewa njia za kulipa au kukubaliana na mpango."],
    ],
    prTitle: "Faragha yako",
    privacy: [
      "Ni wewe tu, na mhasibu na mkurugenzi wa shule, mnaoweza kuona salio lako.",
      "Walimu huona tu kama mtoto ameruhusiwa — kamwe si kiasi cha pesa.",
      "Shulife haitumi ujumbe kwa watoto kamwe.",
      "Pesa yako huenda moja kwa moja kwenye akaunti ya shule. Shulife haishiki pesa yako.",
    ],
    faqTitle: "Maswali ya kawaida",
    faqs: [
      ["Ninalipaje karo?", "Tumia Paybill ya M-PESA kwa namba ya biashara ya shule yako. Kwa namba ya akaunti, weka namba ya usajili ya mtoto wako — au namba ya familia kuwalipia watoto wako wote kwa pamoja."],
      ["Nimekosea namba ya akaunti. Nifanye nini?", "Usijali. Shulife pia huangalia namba yako ya simu iliyosajiliwa na jina lililo kwenye kumbukumbu. Ikiwa bado haina uhakika, mhasibu hukagua na utapokea risiti yako malipo yakishalinganishwa."],
      ["Ninaangaliaje salio langu?", "Tuma SALIO (au BALANCE) kwenye WhatsApp kwa namba ya shule yako kutoka kwa simu yako iliyosajiliwa. Unaweza pia kufungua kiungo kilicho katika ujumbe wowote kutoka kwa shule."],
      ["Je, ninahitaji kupakua programu au kuunda nenosiri?", "Hapana. Kila kitu kinafanya kazi kwa M-PESA, SMS na WhatsApp. Ukurasa wa wazazi hufunguka kwa kiungo au namba ya siri inayotumwa kwa SMS."],
      ["Je, ninaweza kulipa kwa awamu?", "Ndiyo, ikiwa shule yako inatoa mipango ya malipo. Jibu MPANGO (au PLAN) kwenye WhatsApp, au wasiliana na mhasibu, ili kukubaliana kuhusu awamu. Utapata ukumbusho kabla ya kila awamu."],
      ["Nani anaweza kuona salio la familia yangu?", "Ni wewe tu, na mhasibu na mkurugenzi wa shule. Walimu hawaoni kiasi chochote, na wazazi wengine hawaoni chochote kuhusu familia yako."],
    ] as const,
    demo: "Mfano tu. Maelezo ya shule yako yatakuwa tofauti.",
  },
};

const anchors = ["pay", "whatsapp", "statement", "plans", "privacy"];

export function ParentsHelp() {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("lang") === "sw") setLang("sw");
  }, []);

  const choose = (l: Lang) => {
    setLang(l);
    const url = new URL(window.location.href);
    if (l === "sw") url.searchParams.set("lang", "sw");
    else url.searchParams.delete("lang");
    window.history.replaceState(null, "", url);
  };

  const c = t[lang];
  const amounts = [6000, 22000, 4500, 3500, -21000];
  const balance = amounts.reduce((a, b) => a + b, 0);

  return (
    <div lang={lang === "sw" ? "sw" : "en-GB"}>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="grain absolute inset-0 [mask-image:radial-gradient(60%_60%_at_85%_20%,black,transparent)]" />
        <Container className="relative grid items-center gap-12 pb-20 pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-16">
          <div>
            <div role="group" aria-label="Language / Lugha" className="mb-8 flex w-fit rounded-full bg-cream-100 p-1 ring-1 ring-navy-900/5">
              {(
                [
                  ["en", "English"],
                  ["sw", "Kiswahili"],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={lang === k}
                  onClick={() => choose(k)}
                  className={`h-10 rounded-full px-5 text-sm font-semibold transition ${lang === k ? "bg-navy-900 text-cream-50" : "text-navy-900"}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <Eyebrow>{c.eyebrow}</Eyebrow>
            <h1 className="font-display text-[2.6rem] font-medium leading-[1.04] text-navy-900 sm:text-6xl lg:text-[4.2rem]">
              {c.title[0]} <span className="italic text-gold-600">{c.title[1]}</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-600 sm:text-xl">{c.intro}</p>
            <nav aria-label={c.eyebrow} className="mt-10 flex flex-wrap gap-2">
              {c.jump.map((j, i) => (
                <a key={j} href={`#${anchors[i]}`} className="rounded-full bg-cream-50 px-4 py-2.5 text-sm font-semibold text-navy-900 shadow-soft ring-1 ring-navy-900/10 transition hover:bg-navy-900 hover:text-cream-50">
                  {j}
                </a>
              ))}
            </nav>
          </div>
          <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
            <div className="relative aspect-[4/4.2] overflow-hidden rounded-[2rem] shadow-lift">
              <Photo name="parent" alt="A happy mother at the school gate with her two children in uniform" priority className="size-full object-[50%_30%]" sizes="(min-width:1024px) 560px, 92vw" />
            </div>
          </div>
        </Container>
      </section>

      {/* How to pay */}
      <section id="pay" className="scroll-mt-20 bg-cream-100 py-24 sm:py-28">
        <Container className="grid gap-14 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div>
            <h2 className="font-display text-4xl leading-tight text-navy-900 sm:text-5xl">{c.payTitle}</h2>
            <p className="mt-4 text-lg text-ink-600">{c.payIntro}</p>
            <ol className="mt-10 space-y-4">
              {c.steps.map(([h, d], i) => (
                <li key={h} className="flex gap-5 rounded-2xl bg-cream-50 p-5 shadow-soft">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-navy-900 font-display text-lg text-gold-300">{i + 1}</span>
                  <div>
                    <h3 className="font-semibold text-navy-900">{h}</h3>
                    <p className="mt-1 text-ink-600">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 flex items-start gap-3 text-ink-600">
              <Icon.Bank className="mt-0.5 size-5 shrink-0 text-gold-600" />
              {c.bank}
            </p>
          </div>
          <div className="space-y-6 lg:pt-20">
            <div className="mx-auto w-[300px] rounded-[2.6rem] bg-navy-950 p-3 shadow-lift">
              <div className="overflow-hidden rounded-[2rem] bg-cream-50">
                <div className="bg-[#2f8f3a] px-5 pb-4 pt-7 text-white">
                  <p className="text-xs opacity-80">Lipa na M-PESA</p>
                  <p className="text-lg font-semibold">Pay Bill</p>
                </div>
                <div className="space-y-4 p-5">
                  {[
                    [c.phoneBiz, c.phoneBizVal],
                    [c.phoneAcc, "2041"],
                    [c.phoneAmt, "45,000"],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <p className="text-xs text-ink-600">{l}</p>
                      <p className="mt-1 rounded-lg border border-cream-200 px-3 py-2.5 font-mono text-navy-900">{v}</p>
                    </div>
                  ))}
                  <p className="rounded-full bg-[#2f8f3a] py-3 text-center font-semibold text-white">OK</p>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-ink-400">{c.demo}</p>
            <div className="rounded-2xl border border-dashed border-gold-500/60 bg-gold-200/30 p-5 text-navy-900">
              <Icon.Heart className="mb-2 size-5 text-gold-700" />
              {c.wrong}
            </div>
          </div>
        </Container>
      </section>

      {/* WhatsApp */}
      <section id="whatsapp" className="scroll-mt-20 bg-navy-900 py-24 text-cream-50 sm:py-28">
        <Container>
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl leading-tight sm:text-5xl">{c.waTitle}</h2>
            <p className="mt-4 text-lg text-cream-100/80">{c.waIntro}</p>
          </div>
          <div className="mt-12 overflow-hidden rounded-3xl ring-1 ring-cream-50/10">
            <table className="w-full text-left">
              <thead className="bg-navy-800 text-sm text-gold-300">
                <tr>
                  {c.waCols.map((h, i) => (
                    <th key={h} className={`px-5 py-4 font-semibold ${i === 1 ? "max-sm:hidden" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-50/10">
                {c.cmds.map(([a, b, d]) => (
                  <tr key={a}>
                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-gold-400 px-2.5 py-1 font-mono text-sm font-bold text-navy-950">{a}</span>
                    </td>
                    <td className="px-5 py-4 font-mono text-sm text-cream-100/70 max-sm:hidden">{b}</td>
                    <td className="px-5 py-4 text-cream-100/90">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 flex items-center gap-3 text-cream-100/70">
            <Icon.Shield className="size-5 shrink-0 text-gold-300" />
            {c.waNote}
          </p>
        </Container>
      </section>

      {/* Statement */}
      <section id="statement" className="scroll-mt-20 py-24 sm:py-28">
        <Container className="grid items-start gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="font-display text-4xl leading-tight text-navy-900 sm:text-5xl">{c.stTitle}</h2>
            <p className="mt-4 text-lg text-ink-600">{c.stIntro}</p>
            <ol className="mt-10 space-y-5">
              {c.st.map(([h, d], i) => (
                <li key={h} className="flex gap-4">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-400 text-sm font-bold text-navy-950">{String.fromCharCode(65 + i)}</span>
                  <div>
                    <h3 className="font-semibold text-navy-900">{h}</h3>
                    <p className="mt-1 text-ink-600">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="overflow-hidden rounded-[1.6rem] bg-cream-50 shadow-lift ring-1 ring-navy-900/10">
            <div className="flex items-center justify-between bg-navy-900 px-6 py-5 text-cream-50">
              <div>
                <p className="font-display text-xl">Mlima Academy</p>
                <p className="text-xs text-cream-100/70">Fee statement · Term 1 2027</p>
              </div>
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-cream-50 font-display text-lg text-navy-900">M</span>
            </div>
            <div className="p-6">
              <p className="text-sm text-ink-600">Amani Otieno · ADM 2041 · Grade 8 East</p>
              <table className="mt-4 w-full text-sm tabular">
                <tbody>
                  {c.stLabels.slice(0, 5).map((l, i) => {
                    const tag = i === 0 ? "A" : i === 1 ? "B" : i === 4 ? "C" : null;
                    return (
                      <tr key={l} className="border-b border-cream-200">
                        <td className="py-3 text-navy-900">
                          {tag && <span className="mr-2 inline-flex size-5 items-center justify-center rounded-full bg-gold-400 text-[0.65rem] font-bold text-navy-950">{tag}</span>}
                          {l}
                        </td>
                        <td className={`py-3 text-right font-semibold ${amounts[i] < 0 ? "text-paid" : "text-navy-900"}`}>
                          {amounts[i] < 0 ? "− " : ""}
                          <Money amount={Math.abs(amounts[i])} />
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td className="pt-4 font-semibold text-navy-900">
                      <span className="mr-2 inline-flex size-5 items-center justify-center rounded-full bg-gold-400 text-[0.65rem] font-bold text-navy-950">D</span>
                      {c.stLabels[5]}
                    </td>
                    <td className="pt-4 text-right font-display text-2xl text-navy-900">
                      <Money amount={balance} />
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-6 text-xs text-ink-400">{c.demo}</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Plans */}
      <section id="plans" className="scroll-mt-20 bg-cream-100 py-24 sm:py-28">
        <Container>
          <h2 className="max-w-2xl font-display text-4xl leading-tight text-navy-900 sm:text-5xl">{c.plTitle}</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {c.plans.map(([h, d], i) => (
              <div key={h} className={`rounded-[2rem] p-8 ${i === 1 ? "bg-gold-300 text-navy-950" : i === 2 ? "bg-navy-900 text-cream-50" : "bg-cream-50 text-navy-900 shadow-soft"}`}>
                {[Icon.Calendar, Icon.Clock, Icon.Heart].map((I, k) => k === i && <I key={k} className="size-8" />)}
                <h3 className="mt-6 font-display text-2xl leading-snug">{h}</h3>
                <p className="mt-3 leading-relaxed opacity-85">{d}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Privacy */}
      <section id="privacy" className="scroll-mt-20 py-24 sm:py-28">
        <Container className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="font-display text-4xl leading-tight text-navy-900 sm:text-5xl">{c.prTitle}</h2>
            <ul className="mt-10 space-y-4">
              {c.privacy.map((p) => (
                <li key={p} className="flex items-start gap-3 text-lg text-navy-900">
                  <span className="mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-gold-200">
                    <Icon.Check className="size-3.5" strokeWidth={2.4} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-3xl text-navy-900">{c.faqTitle}</h2>
            <div className="mt-6">
              <FaqList items={c.faqs} tone="white" />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
