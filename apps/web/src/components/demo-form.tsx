"use client";

import { useActionState, useState } from "react";
import { Icon } from "./icons";
import { requestDemo } from "@/app/(marketing)/book-demo/actions";

const field =
  "mt-2 block h-12 w-full rounded-xl border border-cream-200 bg-cream-50 px-4 text-ink-900 placeholder:text-ink-400 focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400/50";

/* Saves to demo_requests in Supabase. TODO: WhatsApp confirmation once the WhatsApp number is approved (§9.3). */
export function DemoForm() {
  const [state, action, pending] = useActionState(requestDemo, null);
  const [again, setAgain] = useState(0);
  const sent = state?.ok && again === 0 ? state.school || "your school" : null;

  if (sent) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl bg-cream-50 p-10 text-center text-navy-900">
        <span className="inline-flex size-16 items-center justify-center rounded-full bg-gold-200">
          <Icon.Check className="size-8" strokeWidth={2.2} />
        </span>
        <p className="mt-6 font-display text-3xl">Thank you!</p>
        <p className="mt-3 max-w-sm text-ink-600">
          {state?.saved === false
            ? `Demo bookings for ${sent} open very soon. This form is a preview and has not sent your details yet.`
            : `We’ve received your request for ${sent}. We’ll call you to arrange your demo.`}
        </p>
        <button type="button" onClick={() => setAgain((n) => n + 1)} className="mt-6 font-semibold underline decoration-gold-500 decoration-2 underline-offset-4">
          Back to the form
        </button>
      </div>
    );
  }

  return (
    <form action={(fd) => { setAgain(0); return action(fd); }} className="grid gap-5 rounded-3xl bg-cream-50 p-6 text-navy-900 sm:grid-cols-2 sm:p-8">
      <label className="sm:col-span-2">
        <span className="text-sm font-semibold">School name</span>
        <input name="school" required className={field} placeholder="e.g. Mlima Academy" autoComplete="organization" />
      </label>
      <label>
        <span className="text-sm font-semibold">Your role</span>
        <select name="role" className={field} defaultValue="Director / Owner">
          <option>Director / Owner</option>
          <option>Head teacher / Principal</option>
          <option>Bursar / Accounts</option>
          <option>Other</option>
        </select>
      </label>
      <label>
        <span className="text-sm font-semibold">Number of learners</span>
        <select name="learners" className={field} defaultValue="300–600">
          <option>Under 300</option>
          <option>300–600</option>
          <option>600–1,000</option>
          <option>Over 1,000</option>
        </select>
      </label>
      <label>
        <span className="text-sm font-semibold">County</span>
        <input name="county" className={field} placeholder="e.g. Kiambu" />
      </label>
      <label>
        <span className="text-sm font-semibold">Phone</span>
        <input name="phone" type="tel" required className={field} placeholder="07XX XXX XXX" autoComplete="tel" />
      </label>
      <label className="sm:col-span-2">
        <span className="text-sm font-semibold">Best time to call</span>
        <select name="time" className={field} defaultValue="Morning">
          <option>Morning</option>
          <option>Afternoon</option>
          <option>Evening (before 8 pm)</option>
        </select>
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {state && !state.ok && <p role="alert" className="rounded-xl bg-due/10 p-3 text-sm text-due sm:col-span-2">{state.error}</p>}
      <button type="submit" disabled={pending} className="group inline-flex h-13 min-h-12 items-center justify-center gap-2 rounded-full bg-navy-900 px-7 font-semibold text-cream-50 transition hover:bg-navy-700 sm:col-span-2">
        {pending ? "Sending…" : "Book my free demo"}
        <Icon.Arrow className="size-[18px] transition-transform group-hover:translate-x-1" />
      </button>
      <p className="text-xs text-ink-600 sm:col-span-2">We use your details only to arrange your demo.</p>
    </form>
  );
}
