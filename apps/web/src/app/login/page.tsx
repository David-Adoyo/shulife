import type { Metadata } from "next";
import { Wordmark, Mark } from "@/components/brand";

export const metadata: Metadata = { title: "Log in" };

export default function Login() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-16 sm:px-16">
        <a href="/" aria-label="Shulife home">
          <Wordmark size="md" />
        </a>
        <h1 className="mt-16 font-display text-5xl text-navy-900">Welcome back.</h1>
        <p className="mt-4 max-w-sm text-lg text-ink-600">Sign-in for school staff opens with the Shulife school app. Parents never need a password — use the link in your school's message.</p>
        <a href="/book-demo/" className="mt-10 inline-flex h-12 w-fit items-center rounded-full bg-navy-900 px-7 font-semibold text-cream-50 hover:bg-navy-700">
          Book a demo instead
        </a>
      </div>
      <div className="relative hidden items-center justify-center overflow-hidden bg-navy-900 lg:flex">
        <div className="absolute size-[34rem] rounded-full border-[50px] border-cream-50/[0.04]" />
        <Mark tone="cream" className="relative h-40 w-auto" />
      </div>
    </main>
  );
}
