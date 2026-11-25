import type { Metadata } from "next";
import { Wordmark, Mark } from "@/components/brand";
import { signParentToken } from "@/lib/session";
import { supabaseConfigured } from "@/lib/supabase";
import { signIn } from "./actions";

export const metadata: Metadata = { title: "Log in" };
export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const live = supabaseConfigured();
  const parentLink = `/p/${signParentToken("f1")}/`;
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-16 sm:px-16">
        <a href="/" aria-label="Shulife home">
          <Wordmark size="md" />
        </a>
        <h1 className="mt-16 font-display text-5xl text-navy-900">Welcome back.</h1>
        <p className="mt-4 max-w-sm text-lg text-ink-600">Staff sign in with email, password and a second step. Parents never need a password — use the link in your school’s message.</p>
        {live && (
          <form action={signIn} className="mt-10 max-w-sm space-y-3">
            {error && <p className="rounded-lg bg-due/10 p-3 text-sm text-due">{error === "no-access" ? "Your account isn’t linked to a school yet. Ask your director to invite you." : "Email or password is incorrect."}</p>}
            <input name="email" type="email" required autoComplete="email" placeholder="Email" className="h-12 w-full rounded-xl border border-cream-200 px-4" />
            <input name="password" type="password" required autoComplete="current-password" placeholder="Password" className="h-12 w-full rounded-xl border border-cream-200 px-4" />
            <button className="h-12 w-full rounded-full bg-navy-900 font-semibold text-cream-50">Sign in</button>
          </form>
        )}
        <div className={`${live ? "mt-6" : "mt-10"} max-w-sm space-y-3`}>
          <a href="/app/" className="flex h-12 items-center justify-center rounded-full bg-navy-900 font-semibold text-cream-50 hover:bg-navy-700">
            Explore the demo school
          </a>
          <a href={parentLink} className="flex h-12 items-center justify-center rounded-full border-2 border-navy-900 font-semibold text-navy-900">
            See a parent’s view
          </a>
          <p className="text-xs text-ink-600">Mlima Academy is a fictional demo school. Real sign-in connects to Supabase Auth when the project is configured.</p>
        </div>
      </div>
      <div className="relative hidden items-center justify-center overflow-hidden bg-navy-900 lg:flex">
        <div className="absolute size-[34rem] rounded-full border-[50px] border-cream-50/[0.04]" />
        <Mark tone="cream" className="relative h-40 w-auto" />
      </div>
    </main>
  );
}
