import { site } from "@/lib/site";
import { Wordmark } from "./brand";
import { Icon } from "./icons";
import { Container } from "./ui";

const columns = [
  { title: "Schools", links: [["How it works", "/how-it-works/"], ["Features", "/features/"], ["For directors", "/for-directors/"], ["For bursars", "/for-bursars/"], ["Pricing", "/pricing/"]] },
  { title: "Parents", links: [["How to pay", "/for-parents/#pay"], ["Balance on WhatsApp", "/for-parents/#whatsapp"], ["Payment plans", "/for-parents/#plans"], ["Msaada kwa Kiswahili", "/for-parents/?lang=sw"]] },
  { title: "Company", links: [["About", "/about/"], ["Security", "/security/"], ["Resources", "/resources/"], ["Book a demo", "/book-demo/"]] },
  { title: "Help", links: [["Help centre", "/help/"], ["Contact", "/help/#contact"], ["Log in", "/login/"]] },
];

export function Footer() {
  const contacts = [
    site.supportPhone && { label: site.supportPhone, href: `tel:${site.supportPhone}` },
    site.supportEmail && { label: site.supportEmail, href: `mailto:${site.supportEmail}` },
    site.supportWhatsapp && { label: `WhatsApp ${site.supportWhatsapp}`, href: `https://wa.me/${site.supportWhatsapp.replace(/\D/g, "")}` },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <footer className="bg-navy-950 text-cream-100">
      <Container className="py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Wordmark tone="cream" size="lg" />
            <p className="mt-6 max-w-xs leading-relaxed text-cream-100/70">School fees collection and parent communication for Kenyan private schools.</p>
            {contacts.length > 0 && (
              <ul className="mt-6 space-y-2 text-sm">
                {contacts.map((c) => (
                  <li key={c.href}>
                    <a href={c.href} className="hover:text-gold-300">
                      {c.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {columns.map((c) => (
              <div key={c.title}>
                <p className="text-sm font-semibold text-gold-300">{c.title}</p>
                <ul className="mt-5 space-y-3">
                  {c.links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="text-cream-100/80 transition hover:text-cream-50">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-cream-50/10 pt-8">
          <p className="inline-flex items-center gap-2 text-sm font-semibold">
            <Icon.Globe className="size-5 text-gold-300" />
            Kenya · English | Kiswahili
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-cream-100/70">
            <li><a href="/legal/privacy/" className="hover:text-cream-50">Privacy</a></li>
            <li><a href="/legal/terms/" className="hover:text-cream-50">Terms</a></li>
            <li><a href="/legal/dpa/" className="hover:text-cream-50">Data processing</a></li>
            <li><a href="/security/" className="hover:text-cream-50">Security</a></li>
          </ul>
        </div>
        <div className="mt-6 flex flex-wrap justify-between gap-4 text-xs text-cream-100/50">
          <p>© {new Date().getFullYear()} Shulife</p>
          {site.odpcRegNo && <p>Registered with the ODPC · {site.odpcRegNo}</p>}
        </div>
      </Container>
    </footer>
  );
}
