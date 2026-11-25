import { redirect } from "next/navigation";
import { Card, PageTitle } from "@/components/app/ui";
import { ImportTool } from "@/components/app/import-tool";
import { Icon } from "@/components/icons";
import { can, getSession } from "@/lib/session";
import { resetDemo } from "../../actions";

export const metadata = { title: "Set-up" };

const STEPS = [
  ["School details", "Name, campuses, crest, county and phone", true],
  ["Academic set-up", "Grades PP1–Grade 9, streams and term dates", true],
  ["Learners and families", "Excel/CSV, a photo of a class register, or another system’s export", true],
  ["Fees", "Fee structure, optional items, routes, sibling rule", true],
  ["Opening balances", "Balances brought forward from your old records", true],
  ["Connect payments", "M-Pesa Paybill (guided test) and bank statement format", false],
  ["Parents", "Welcome message (EN/SW) and the “How to pay” notice", false],
  ["Reminders", "Tone and term timeline", true],
  ["Go live", "Your first matched payment starts your free period", false],
] as const;

export default async function Onboarding() {
  const session = await getSession();
  if (!can.settings(session.role)) redirect("/app/");
  const done = STEPS.filter((s) => s[2]).length;
  return (
    <>
      <PageTitle title="Live in an afternoon" sub={`${done} of ${STEPS.length} steps done · saved as you go`} action={<form action={resetDemo}><button className="rounded-full px-4 py-2 text-sm font-semibold text-navy-900 ring-1 ring-cream-200">Reset demo data</button></form>} />
      <div className="mb-5 h-2.5 overflow-hidden rounded-full bg-navy-100">
        <div className="h-full rounded-full bg-gold-500" style={{ width: `${(done / STEPS.length) * 100}%` }} />
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.6fr]">
        <Card>
          <ol className="space-y-1">
            {STEPS.map(([t, d, ok], i) => (
              <li key={t} className={`flex gap-3 rounded-xl p-3 ${i === 2 ? "bg-cream-100" : ""}`}>
                <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${ok ? "bg-paid text-white" : "border border-cream-300 text-navy-900"}`}>{ok ? <Icon.Check className="size-4" strokeWidth={2.6} /> : i + 1}</span>
                <span>
                  <span className="block font-semibold text-navy-900">{t}</span>
                  <span className="block text-sm text-ink-600">{d}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-4 rounded-xl bg-navy-100 p-3 text-sm text-navy-900">Prefer us to do it? Our team can run steps 3–6 for you, with every action in your audit log.</p>
        </Card>
        <Card title="Step 3 · Learners and families">
          <ImportTool />
        </Card>
      </div>
    </>
  );
}
