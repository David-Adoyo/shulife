"use client";

import { useActionState } from "react";
import { inviteStaff } from "@/app/(app)/app/team/actions";

export function InviteForm({ streams }: { streams: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState(inviteStaff, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[2fr_1fr_1.4fr_auto] sm:items-end">
      <label className="text-sm">
        <span className="font-semibold text-navy-900">Email</span>
        <input name="email" type="email" required className="mt-1 h-11 w-full rounded-lg border border-cream-200 px-3" placeholder="name@school.ac.ke" />
      </label>
      <label className="text-sm">
        <span className="font-semibold text-navy-900">Role</span>
        <select name="role" className="mt-1 h-11 w-full rounded-lg border border-cream-200 px-3">
          <option value="bursar">Bursar</option>
          <option value="head">Head teacher</option>
          <option value="front_office">Front office</option>
          <option value="class_teacher">Class teacher</option>
          <option value="director">Director</option>
        </select>
      </label>
      <label className="text-sm">
        <span className="font-semibold text-navy-900">Class (teachers)</span>
        <select name="stream" className="mt-1 h-11 w-full rounded-lg border border-cream-200 px-3">
          <option value="">—</option>
          {streams.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <button disabled={pending} className="h-11 rounded-full bg-navy-900 px-5 text-sm font-semibold text-cream-50 disabled:opacity-60">
        {pending ? "Sending…" : "Invite"}
      </button>
      {state && <p role="status" className={`text-sm sm:col-span-4 ${state.ok ? "text-paid" : "text-due"}`}>{state.message}</p>}
    </form>
  );
}
