"use client";

import { useActionState } from "react";
import { checkImport } from "@/app/(app)/actions";

const SAMPLE = `Adm No,First Name,Surname,Class,Stream,Parent Name,Phone,Boarding
2501,Imani,Kariuki,Grade 4,East,Lucy Kariuki,0712 000 111,Day
2502,Tumaini,Kariuki,PP2,East,Lucy Kariuki,+254712000111,Day
2503,Arjun,Patel,G7,West,Raj Patel,0722 333 444,Boarder
2503,Copy,Row,G7,West,X,0722 333 445,Day
2504,Neema,Wanjiru,Form 9,East,Ruth Wanjiru,12345,Day`;

export function ImportTool() {
  const [state, action, pending] = useActionState(checkImport, null);
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <form action={action} className="space-y-3">
        <label className="block text-sm font-semibold text-navy-900" htmlFor="csv">
          Paste from Excel, or upload a CSV
        </label>
        <textarea id="csv" name="csv" rows={9} defaultValue={SAMPLE} className="w-full rounded-lg border border-cream-200 p-3 font-mono text-xs" />
        <input type="file" name="file" accept=".csv,text/csv" className="block w-full max-w-full text-sm" />
        <button disabled={pending} className="rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-cream-50 disabled:opacity-60">
          {pending ? "Checking…" : "Check the import"}
        </button>
      </form>
      <div aria-live="polite">
        {state?.error && <p className="rounded-xl bg-due/10 p-4 text-sm text-due">{state.error}</p>}
        {state && !state.error && (
          <div className="space-y-4">
            <p className="rounded-xl bg-paid/10 p-4 text-sm text-navy-900">
              <b>{state.ok}</b> of {state.total} learners ready · grouped into <b>{state.familyCount}</b> families by shared guardian phone
            </p>
            {state.issues && state.issues.length > 0 && (
              <ul className="space-y-1 text-sm">
                {state.issues.map((i, k) => (
                  <li key={k} className={i.severity === "error" ? "text-due" : "text-partial"}>
                    Row {i.row}: {i.message}
                  </li>
                ))}
              </ul>
            )}
            <ul className="space-y-2 text-sm">
              {state.families?.map((f) => (
                <li key={f.code} className="rounded-xl bg-cream-100 p-3">
                  <b className="text-navy-900">{f.name}</b> <span className="text-ink-600">· {f.code}</span>
                  {f.needsConfirmation && <span className="ml-2 rounded-full bg-gold-200 px-2 text-xs font-semibold">Please confirm</span>}
                  <span className="block text-ink-600">{f.learners.join(", ")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
