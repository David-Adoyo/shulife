import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { supabaseConfigured } from "@/lib/supabase";
import { requestReset } from "../actions";

export const metadata: Metadata = { title: "Reset your password" };
export const dynamic = "force-dynamic";

export default async function ResetPassword({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  if (!supabaseConfigured()) redirect("/login/");
  const { sent } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-50 p-6">
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 ring-1 ring-navy-900/10">
        <Wordmark size="md" />
        <h1 className="font-display text-3xl text-navy-900">Reset your password</h1>
        {sent ? (
          <p className="text-ink-600">If there’s a Shulife account for that address, we’ve emailed it a link to choose a new password. Check your spam folder if it hasn’t arrived in a few minutes.</p>
        ) : (
          <form action={requestReset} className="space-y-3">
            <p className="text-ink-600">Enter the email you sign in with and we’ll send you a link.</p>
            <input name="email" type="email" required autoComplete="email" placeholder="Email" className="h-12 w-full rounded-xl border border-cream-200 px-4" />
            <button className="h-12 w-full rounded-full bg-navy-900 font-semibold text-cream-50">Email me a link</button>
          </form>
        )}
        <a href="/login/" className="block text-sm font-semibold text-navy-900 underline decoration-gold-500 underline-offset-4">Back to sign in</a>
      </div>
    </main>
  );
}
