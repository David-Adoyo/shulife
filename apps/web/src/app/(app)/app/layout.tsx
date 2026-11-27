import type { Metadata } from "next";
import { school } from "@/lib/db";
import { reviewQueue, currentTerm } from "@shulife/demo";
import { Mark } from "@/components/brand";
import { Icon } from "@/components/icons";
import { can, getSession, ROLES } from "@/lib/session";
import { setCampus, setRole } from "../actions";
import { NavLink } from "@/components/app/nav-link";
import { supabaseConfigured } from "@/lib/supabase";
import { signOut } from "@/app/login/actions";

export const metadata: Metadata = { title: { default: "School app", template: "%s · Shulife" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await school();
  const session = await getSession();
  const term = currentTerm(s);
  const queue = reviewQueue(s).length;
  const money = can.seeMoney(session.role);
  const nav = [
    { href: "/app/", label: "Home", icon: Icon.Chart, show: money },
    { href: "/app/families/", label: "Families", icon: Icon.Users, show: money },
    { href: "/app/payments/", label: "Payments", icon: Icon.Receipt, show: money },
    { href: "/app/review/", label: "Review queue", icon: Icon.Match, show: can.review(session.role), badge: queue },
    { href: "/app/fees/", label: "Fees", icon: Icon.Book, show: money },
    { href: "/app/notices/", label: "Notices", icon: Icon.Bell, show: can.sendNotice(session.role) },
    { href: "/app/clearance/", label: "Clearance", icon: Icon.Shield, show: true },
    { href: "/app/reports/", label: "Reports", icon: Icon.Calendar, show: can.reports(session.role) },
    { href: "/app/team/", label: "Team", icon: Icon.Users, show: session.role === "director" },
    { href: "/app/onboarding/", label: "Set-up", icon: Icon.Sparkle, show: can.settings(session.role) },
  ].filter((n) => n.show);
  const campus = s.campuses.find((c) => c.id === session.campusId);

  return (
    <div className="min-h-screen bg-cream-50 lg:flex">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-navy-900 text-cream-50 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="border-b border-cream-50/10 p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-cream-50 font-display text-xl text-navy-900">M</span>
            <div className="min-w-0">
              <p className="truncate font-semibold">Mlima Academy</p>
              <p className="truncate text-xs text-cream-100/60">{campus?.name.replace("Mlima Academy, ", "") ?? "All campuses"}</p>
            </div>
          </div>
          {session.role !== "class_teacher" && (
            <form action={setCampus} className="mt-4">
              <label className="sr-only" htmlFor="campus">
                Campus
              </label>
              <select id="campus" name="campus" defaultValue={session.campusId ?? "all"} className="w-full rounded-lg border border-cream-50/15 bg-navy-800 px-3 py-2 text-sm text-cream-50">
                <option value="all">All campuses</option>
                {s.campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name.replace("Mlima Academy, ", "")}
                  </option>
                ))}
              </select>
              <button className="mt-2 w-full rounded-lg bg-cream-50/10 py-1.5 text-xs font-semibold hover:bg-cream-50/20">Switch campus</button>
            </form>
          )}
        </div>
        <nav aria-label="App" className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((n) => (
            <NavLink key={n.href} href={n.href}>
              <n.icon className="size-5 shrink-0" />
              <span className="flex-1">{n.label}</span>
              {n.badge ? <span className="rounded-full bg-gold-400 px-2 text-xs font-bold text-navy-950">{n.badge}</span> : null}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2 border-t border-cream-50/10 p-4 text-xs text-cream-100/60">
          <Mark tone="cream" className="h-5 w-auto" /> Powered by Shulife
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-cream-200 bg-cream-50/95 px-4 py-3 backdrop-blur sm:px-6">
          <span className="rounded-full bg-navy-900 px-3 py-1.5 text-xs font-semibold text-cream-50">{term.name.replace(/Term (\d) (\d+)/, "Term $1 · $2")}</span>
          {money && (
            <form action="/app/families/" className="relative min-w-0 flex-1 sm:max-w-md">
              <Icon.Eye className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
              <input name="q" placeholder="Learner, admission number or guardian phone" className="h-10 w-full rounded-full border border-cream-200 bg-white pl-9 pr-4 text-sm focus:border-navy-900 focus:outline-none" />
            </form>
          )}
          {supabaseConfigured() ? (
            <form action={signOut} className="ml-auto flex items-center gap-3">
              <span className="hidden text-sm text-ink-600 sm:block">{session.name}</span>
              <button className="h-10 rounded-full px-4 text-sm font-semibold text-navy-900 ring-1 ring-cream-200">Sign out</button>
            </form>
          ) : (
          <form action={setRole} className="ml-auto flex items-center gap-2">
            <label htmlFor="role" className="hidden text-xs text-ink-600 sm:block">
              Viewing as
            </label>
            <select id="role" name="role" defaultValue={session.role} className="h-10 rounded-full border border-cream-200 bg-white px-3 text-sm font-semibold text-navy-900">
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            <button className="h-10 rounded-full bg-navy-900 px-4 text-sm font-semibold text-cream-50">Switch</button>
          </form>
          )}
        </header>
        <div className="border-b border-gold-400/40 bg-gold-200/40 px-4 py-2 text-center text-xs text-navy-900 sm:px-6">
          {supabaseConfigured() ? "Signed in as" : "Demo school with fictional data · Signed in as"} <b>{session.name}</b> ({ROLES.find((r) => r.id === session.role)!.label})
        </div>
        <main id="main" className="px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12">
          {children}
        </main>

        {/* Mobile bottom tab bar */}
        <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-cream-200 bg-white lg:hidden">
          {nav.slice(0, 5).map((n) => (
            <a key={n.href} href={n.href} className="flex flex-1 flex-col items-center gap-1 py-2 text-[0.7rem] font-semibold text-navy-900">
              <n.icon className="size-5" />
              {n.label.split(" ")[0]}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
