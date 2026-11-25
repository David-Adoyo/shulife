import type { Metadata } from "next";
import { faqBilling, faqParents, faqSchools } from "@/components/content";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { FaqJsonLd, FaqList, PageHero } from "@/components/shared";
import { Button, Container, Eyebrow } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Help centre",
  description: "Answers for schools and parents: paying fees, checking balances, matching, receipts, pricing and data protection.",
};

const topics = [
  { id: "schools", t: "For schools", d: "Set-up, matching, receipts and staff access.", icon: Icon.Gate, items: faqSchools },
  { id: "parents", t: "For parents", d: "Paying, balances, plans and privacy.", icon: Icon.Users, items: faqParents },
  { id: "billing", t: "Billing and data", d: "Pricing, subscriptions and exports.", icon: Icon.Receipt, items: faqBilling },
];

export default function HelpPage() {
  const all = [...faqSchools, ...faqParents, ...faqBilling];
  const contacts = [
    site.supportWhatsapp && { label: "WhatsApp", value: site.supportWhatsapp, href: `https://wa.me/${site.supportWhatsapp.replace(/\D/g, "")}`, icon: Icon.Chat },
    site.supportPhone && { label: "Phone", value: site.supportPhone, href: `tel:${site.supportPhone}`, icon: Icon.Phone },
    site.supportEmail && { label: "Email", value: site.supportEmail, href: `mailto:${site.supportEmail}`, icon: Icon.Book },
  ].filter(Boolean) as { label: string; value: string; href: string; icon: typeof Icon.Chat }[];

  return (
    <>
      <FaqJsonLd items={all} />
      <PageHero
        eyebrow="Help centre"
        title={
          <>
            How can we <span className="italic text-gold-600">help?</span>
          </>
        }
        intro="Plain answers for school teams and parents. Parents — for step-by-step help in English or Kiswahili, visit the parent guide."
        actions={
          <>
            <Button href="/for-parents/" arrow>
              Parent guide
            </Button>
            <Button href="/for-parents/?lang=sw" variant="outline">
              Msaada kwa Kiswahili
            </Button>
          </>
        }
        aside={
          <div className="grid gap-3">
            {topics.map((t) => (
              <a key={t.id} href={`#${t.id}`} className="group flex items-center gap-5 rounded-2xl bg-cream-50 p-5 shadow-soft ring-1 ring-navy-900/5 transition hover:-translate-y-0.5 hover:bg-navy-900">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gold-200 text-navy-900">
                  <t.icon className="size-6" />
                </span>
                <span className="flex-1">
                  <span className="block font-display text-xl text-navy-900 group-hover:text-cream-50">{t.t}</span>
                  <span className="block text-sm text-ink-600 group-hover:text-cream-100/70">{t.d}</span>
                </span>
                <Icon.Arrow className="size-5 text-navy-900 transition group-hover:translate-x-1 group-hover:text-gold-300" />
              </a>
            ))}
          </div>
        }
      />

      {topics.map((t, i) => (
        <section key={t.id} id={t.id} className={`scroll-mt-20 py-20 sm:py-24 ${i % 2 === 0 ? "bg-cream-100" : ""}`}>
          <Container className="grid gap-10 lg:grid-cols-[1fr_1.8fr] lg:gap-20">
            <Reveal>
              <Eyebrow>{t.t}</Eyebrow>
              <h2 className="font-display text-4xl text-navy-900">{t.d}</h2>
            </Reveal>
            <Reveal>
              <FaqList items={t.items} tone={i % 2 === 0 ? "cream" : "white"} />
            </Reveal>
          </Container>
        </section>
      ))}

      <section id="contact" className="scroll-mt-20 bg-navy-900 py-24 text-cream-50">
        <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow tone="cream">Contact</Eyebrow>
            <h2 className="font-display text-4xl sm:text-5xl">Still need a hand?</h2>
            <p className="mt-5 max-w-md text-lg text-cream-100/80">
              Parents: for questions about your balance or a payment, please contact your school’s office — they can see your account. Schools: we’re here to help.
            </p>
          </div>
          <div className="grid gap-3">
            {contacts.map((c) => (
              <a key={c.label} href={c.href} className="flex items-center gap-4 rounded-2xl bg-navy-800 p-5 transition hover:bg-navy-700">
                <c.icon className="size-6 text-gold-300" />
                <span>
                  <span className="block text-sm text-cream-100/60">{c.label}</span>
                  <span className="block font-semibold">{c.value}</span>
                </span>
              </a>
            ))}
            <a href="/book-demo/" className="flex items-center gap-4 rounded-2xl bg-gold-400 p-5 text-navy-950 transition hover:bg-gold-300">
              <Icon.Calendar className="size-6" />
              <span className="flex-1">
                <span className="block text-sm opacity-70">Schools</span>
                <span className="block font-semibold">Book a call with our team</span>
              </span>
              <Icon.Arrow className="size-5" />
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
