import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { supabaseConfigured, supabaseServer } from "@/lib/supabase";
import { setPassword } from "../actions";
import { SessionFromLink } from "@/components/app/session-from-link";

export const metadata: Metadata = { title: "Set your password" };
export const dynamic = "force-dynamic";

export default async function SetPassword({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!supabaseConfigured()) redirect("/login/");
  const { data } = await (await supabaseServer()).auth.getUser();
  if (!data.user)
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream-50 p-6">
        <div className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-8 shadow-lift">
          <Wordmark size="md" />
          <SessionFromLink url={process.env.NEXT_PUBLIC_SUPABASE_URL!} anonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!} />
        </div>
      </main>
    );
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-50 p-6">
      <form action={setPassword} className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-8 shadow-lift">
        <Wordmark size="md" />
        <h1 className="font-display text-3xl text-navy-900">Welcome to Shulife</h1>
        <p className="text-ink-600">Choose a password for {data.user.email}. At least 10 characters.</p>
        {error && <p className="rounded-lg bg-due/10 p-3 text-sm text-due">{error === "short" ? "Use at least 10 characters." : error === "match" ? "The two passwords don’t match." : "Could not save the password. Please try again."}</p>}
        <input name="full_name" placeholder="Your full name" required className="h-12 w-full rounded-xl border border-cream-200 px-4" />
        <input name="password" type="password" minLength={10} required autoComplete="new-password" placeholder="New password" className="h-12 w-full rounded-xl border border-cream-200 px-4" />
        <input name="confirm" type="password" minLength={10} required autoComplete="new-password" placeholder="Repeat password" className="h-12 w-full rounded-xl border border-cream-200 px-4" />
        <button className="h-12 w-full rounded-full bg-navy-900 font-semibold text-cream-50">Save and continue</button>
      </form>
    </main>
  );
}
