"use client";

import { useActionState, useState } from "react";
import { checkImport } from "@/app/(app)/actions";
import { importLearnersAction } from "./actions";

const EXAMPLE = `Adm No,First Name,Surname,Class,Stream,Parent Name,Phone,Boarding,Lunch,Balance
1001,Imani,Kariuki,Grade 4,East,Lucy Kariuki,0712 000 111,Day,Yes,4500
1002,Tumaini,Kariuki,PP2,East,Lucy Kariuki,0712 000 111,Day,Yes,0`;

/** One textarea, two buttons: check the rows first, then import them. */
export function LearnerImport({ campuses }: { campuses: { id: string; name: string }[] }) {
  const [state, check, checking] = useActionState(checkImport, null);
  // Controlled, so the text survives React resetting the form after "Check the rows".
  const [csv, setCsv] = useState("");
  return (
    <form className="grid gap-5 lg:grid-cols-2" action={importLearnersAction}>
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-navy-900" htmlFor="csv">
          Paste from Excel (with the header row), or upload a CSV
        </label>
        <textarea id="csv" name="csv" rows={10} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={EXAMPLE} className="w-full rounded-lg border border-cream-200 p-3 font-mono text-xs" />
        <input type="file" accept=".csv,text/csv" aria-label="Upload a CSV file" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setCsv(await f.text()); }} className="block w-full max-w-full text-sm" />
        {campuses.length > 1 && (
          <label className="block text-sm font-semibold text-navy-900">
            Campus
            <select name="campus" className="mt-1 block h-11 w-full rounded-lg border border-cream-200 bg-white px-3">
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex flex-wrap gap-3">
          <button formAction={check} disabled={checking} className="h-11 rounded-full px-5 text-sm font-semibold text-navy-900 ring-1 ring-navy-900 disabled:opacity-60">
            {checking ? "Checking…" : "Check the rows"}
          </button>
          <button className="h-11 rounded-full bg-navy-900 px-5 text-sm font-semibold text-cream-50">Import learners</button>
        </div>
      </div>
      <div aria-live="polite" className="text-sm">
        {state?.error && <p className="rounded-lg bg-due/10 p-3 text-due">{state.error}</p>}
        {state && !state.error && (
          <div className="space-y-3">
            <p className="rounded-lg bg-paid/10 p-3 text-navy-900">
              <b>{state.ok}</b> of {state.total} learners ready, in <b>{state.familyCount}</b> families.
            </p>
            {state.issues && state.issues.length > 0 && (
              <ul className="space-y-1">
                {state.issues.map((i, k) => (
                  <li key={k} className={i.severity === "error" ? "text-due" : "text-partial"}>
                    {i.row ? `Row ${i.row}: ` : ""}
                    {i.message}
                  </li>
                ))}
              </ul>
            )}
            <ul className="space-y-2">
              {state.families?.map((f) => (
                <li key={f.code} className="rounded-lg bg-cream-50 p-3">
                  <b className="text-navy-900">{f.name}</b> <span className="text-ink-600">· {f.code}</span>
                  {f.needsConfirmation && <span className="ml-2 rounded-full bg-gold-200 px-2 text-xs font-semibold">Different surnames: check</span>}
                  <span className="block text-ink-600">{f.learners.join(", ")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </form>
  );
}
