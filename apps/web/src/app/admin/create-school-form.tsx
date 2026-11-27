"use client";

import { useActionState } from "react";
import { createSchool } from "./actions";

const field = "mt-1 block h-11 w-full rounded-lg border border-cream-200 bg-white px-3 text-sm";

export function CreateSchoolForm() {
  const [state, action, pending] = useActionState(createSchool, null);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-3">
      <label className="text-sm font-semibold text-navy-900">
        School name
        <input name="name" required className={field} placeholder="e.g. Greenfield Academy" />
      </label>
      <label className="text-sm font-semibold text-navy-900">
        Director’s name
        <input name="directorName" className={field} placeholder="Optional" />
      </label>
      <label className="text-sm font-semibold text-navy-900">
        Director’s email
        <input name="email" type="email" required className={field} placeholder="director@school.ac.ke" />
      </label>
      <div className="sm:col-span-3 flex flex-wrap items-center gap-4">
        <button disabled={pending} className="h-11 rounded-full bg-navy-900 px-6 text-sm font-semibold text-cream-50 disabled:opacity-60">
          {pending ? "Adding…" : "Add school and invite director"}
        </button>
        <p className="text-sm text-ink-600">The director gets an email to set a password, then the app walks them through setting the school up.</p>
      </div>
      {state && <p role="status" className={`sm:col-span-3 rounded-lg p-3 text-sm ${state.ok ? "bg-paid/10 text-navy-900" : "bg-due/10 text-due"}`}>{state.message}</p>}
    </form>
  );
}
