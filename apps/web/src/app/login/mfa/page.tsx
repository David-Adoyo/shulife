import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { supabaseConfigured } from "@/lib/supabase";
import { enrolTotp, verifyTotp } from "../actions";

export const metadata: Metadata = { title: "Two-step sign-in" };
export const dynamic = "force-dynamic";

export default async function Mfa({ searchParams }: { searchParams: Promise<{ enrol?: string; error?: string }> }) {
  if (!supabaseConfigured()) redirect("/login/");
  const { enrol, error } = await searchParams;
  const setup = enrol ? await enrolTotp() : null;
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-50 p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-lift">
        <Wordmark size="md" />
        <h1 className="mt-8 font-display text-3xl text-navy-900">{setup ? "Set up your authenticator" : "Enter your code"}</h1>
        <p className="mt-2 text-ink-600">Directors, heads and bursars confirm every sign-in with a 6-digit code from an authenticator app.</p>
        {setup && (
          <div className="mt-5 rounded-xl bg-cream-100 p-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qr} alt="QR code for your authenticator app" className="mx-auto size-44" />
            <p className="mt-2 break-all font-mono text-xs text-ink-600">{setup.secret}</p>
          </div>
        )}
        {error && <p className="mt-4 rounded-lg bg-due/10 p-3 text-sm text-due">That code didn’t work. Please try again.</p>}
        <form action={verifyTotp} className="mt-6 space-y-3">
          <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" required placeholder="123 456" className="h-12 w-full rounded-xl border border-cream-200 px-4 text-center font-mono text-xl tracking-widest" />
          <button className="h-12 w-full rounded-full bg-navy-900 font-semibold text-cream-50">Verify</button>
        </form>
      </div>
    </main>
  );
}
