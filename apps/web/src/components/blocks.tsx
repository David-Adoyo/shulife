import { Icon } from "./icons";
import { Button, Container } from "./ui";

/* Reusable marketing blocks shared by the home page and inner pages. */

export function ThreeSteps() {
  const steps = [
    { n: "1", t: "Set your fees", d: "Enter the fee structure for each grade once, including lunch, transport and boarding for the learners who take them. Then invoice the whole school in one go.", icon: Icon.Receipt },
    { n: "2", t: "Parents pay as usual", d: "Into your own Paybill or bank, with the admission number as the account. Shulife picks up each payment, finds the family and splits it between siblings using your rule.", icon: Icon.Phone },
    { n: "3", t: "Receipts go out", d: "The parent gets a numbered receipt by SMS or WhatsApp. The ledger updates, and you can see collection by class at any point in the day.", icon: Icon.Check },
  ];
  return (
    <ol className="divide-y divide-navy-900/10 border-y border-navy-900/10">
      {steps.map((s) => (
        <li key={s.n} className="flex gap-6 py-8">
          <span className="font-display text-4xl leading-none text-gold-600">{s.n}</span>
          <div>
            <h3 className="font-display text-2xl text-navy-900">{s.t}</h3>
            <p className="mt-2 text-lg leading-relaxed text-ink-600">{s.d}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export const matchSignals = [
  ["Admission number", "Read even when typed as “ADM 2041”, “2041 grade 8” or “adm-2041”"],
  ["Family code", "One code that covers every child in the family"],
  ["Guardian’s phone", "The number on the learner’s record"],
  ["Remembered phones", "An aunt or grandparent who has paid before"],
  ["Name in the reference", "For example “OTIENO GRADE 8”"],
] as const;

export function PlansCarousel() {
  const cards = [
    { k: "Payment plans", t: "Instalments agreed with the school", d: "The parent confirms the plan with a one-time code. They get a reminder two days before each instalment and again on the day.", cls: "bg-navy-900 text-cream-50", accent: "text-gold-300" },
    { k: "M-PESA Ratiba", t: "Standing orders, if the parent wants them", d: "Instalments go through automatically on the agreed dates, so nobody has to remember.", cls: "bg-gold-300 text-navy-950", accent: "text-navy-700" },
    { k: "Family code", t: "One payment for all the children", d: "Parents pay once with the family code and Shulife shares it between siblings.", cls: "bg-cream-50 text-navy-900 ring-1 ring-navy-900/10", accent: "text-gold-700" },
    { k: "Before exams and trips", t: "Parents hear first, privately", d: "A week before, families who haven’t cleared get a polite message with the options. Children aren’t sent home to find out.", cls: "bg-navy-800 text-cream-50", accent: "text-gold-300" },
    { k: "Cash, cheque and bank", t: "Not everyone pays by M-Pesa", d: "Receipt cash and cheques at the window with a photo of the slip, import bank statements, and close the day with a cash-up report.", cls: "bg-cream-200 text-navy-900", accent: "text-gold-700" },
  ];
  return (
    <div className="no-scrollbar mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 sm:px-8 lg:px-[max(3rem,calc((100vw-1240px)/2+3rem))]">
      {cards.map((c) => (
        <div key={c.k} className={`flex min-h-[340px] w-[300px] shrink-0 snap-start flex-col rounded-2xl p-8 sm:w-[340px] ${c.cls}`}>
          <p className={`text-sm font-semibold ${c.accent}`}>{c.k}</p>
          <h3 className="mt-5 font-display text-[1.9rem] leading-[1.12]">{c.t}</h3>
          <p className="mt-auto pt-8 leading-relaxed opacity-80">{c.d}</p>
        </div>
      ))}
    </div>
  );
}

export function NoApp() {
  return (
    <section className="pb-24 sm:pb-28">
      <Container>
        <div className="grid items-center gap-10 rounded-2xl bg-gold-300 p-8 sm:p-14 lg:grid-cols-2">
          <div>
            <p className="text-[0.95rem] font-semibold text-navy-800">Parents</p>
            <h2 className="mt-3 font-display text-4xl leading-[1.08] text-navy-950 sm:text-5xl">Nothing to install, no password to forget</h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-navy-900/80">Parents use M-Pesa, SMS and WhatsApp. For anything more, a link opens a small web page that loads fine on a basic smartphone and a slow connection.</p>
            <div className="mt-8">
              <Button href="/for-parents/" variant="navy" arrow>
                Help for parents
              </Button>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-navy-900">WhatsApp keywords, in English or Kiswahili:</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["BALANCE", "SALIO", "Your family balance"],
                ["STATEMENT", "TAARIFA", "This term’s statement"],
                ["RECEIPT", "RISITI", "Your latest receipt"],
                ["HELP", "MSAADA", "Talk to the school"],
              ].map(([en, sw, d]) => (
                <div key={en} className="rounded-xl bg-cream-50 p-5">
                  <p className="font-mono text-sm font-bold text-navy-900">
                    {en} <span className="text-ink-400">/</span> {sw}
                  </p>
                  <p className="mt-2 text-sm text-ink-600">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
