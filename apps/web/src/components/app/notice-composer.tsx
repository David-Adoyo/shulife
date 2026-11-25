"use client";

import { useActionState, useState } from "react";
import { smsInfo, toSmsSafe } from "@shulife/core/messaging";
import { previewAudience } from "@/app/(app)/actions";

type Opt = { value: string; label: string };

export function NoticeComposer({ school, grades, streams, routes }: { school: string; grades: Opt[]; streams: Opt[]; routes: Opt[] }) {
  const [lang, setLang] = useState<"en" | "sw">("en");
  const [title, setTitle] = useState("Sports day on Friday");
  const [en, setEn] = useState("Our sports day is on Friday 19 February from 9 am. Parents are welcome. Please send your child in their house T-shirt.");
  const [sw, setSw] = useState("Siku ya michezo ni Ijumaa tarehe 19 Februari kuanzia saa 3 asubuhi. Wazazi mnakaribishwa. Tafadhali mvalishe mtoto wako fulana ya nyumba yake.");
  const [kind, setKind] = useState("grade");
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [state, action, pending] = useActionState(previewAudience, null);
  const body = lang === "en" ? en : sw;
  const text = `${school}: ${title}. ${body}`;
  const sms = toSmsSafe(text);
  const info = smsInfo(sms.text);
  const options = kind === "grade" ? grades : kind === "stream" ? streams : kind === "route" ? routes : kind === "boarding" ? [{ value: "boarder", label: "Boarders" }, { value: "day", label: "Day scholars" }] : [];

  return (
    <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
      <form action={action} className="space-y-4 rounded-[14px] border border-cream-200 bg-white p-5 shadow-soft sm:p-6">
        <div>
          <p className="mb-2 text-sm font-semibold text-navy-900">Audience</p>
          <div className="flex flex-wrap gap-2">
            {[
              ["whole_school", "Whole school"],
              ["grade", "Grade"],
              ["stream", "Class"],
              ["route", "Bus route"],
              ["boarding", "Boarders / day"],
            ].map(([k, l]) => (
              <label key={k} className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold ${kind === k ? "bg-navy-900 text-cream-50" : "ring-1 ring-cream-200"}`}>
                <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
                {l}
              </label>
            ))}
          </div>
          {options.length > 0 && (
            <select name="value" className="mt-3 h-10 w-full rounded-lg border border-cream-200 px-3">
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
          <p className="mt-2 text-xs text-ink-600">There is no “debtors” audience. Fee reminders only go privately, through the reminder engine.</p>
        </div>
        <label className="block">
          <span className="text-sm font-semibold text-navy-900">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-cream-200 px-3" />
        </label>
        <div>
          <div role="tablist" className="mb-2 inline-flex rounded-full bg-cream-100 p-1">
            {(["en", "sw"] as const).map((l) => (
              <button type="button" role="tab" aria-selected={lang === l} key={l} onClick={() => setLang(l)} className={`rounded-full px-4 py-1 text-sm font-semibold ${lang === l ? "bg-navy-900 text-cream-50" : "text-navy-900"}`}>
                {l === "en" ? "English" : "Kiswahili"}
              </button>
            ))}
          </div>
          <textarea name="body" rows={5} value={body} onChange={(e) => (lang === "en" ? setEn(e.target.value) : setSw(e.target.value))} className="w-full rounded-lg border border-cream-200 p-3" />
          <p className="text-xs text-ink-600">Each parent gets the language they chose. Kiswahili drafts must be checked by a person before sending.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={pending} className="rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-cream-50 disabled:opacity-60">
            {pending ? "Counting…" : "Check audience"}
          </button>
          {state && (
            <span className="text-sm text-navy-900" role="status">
              <b>{state.count}</b> guardians · {state.whatsapp} on WhatsApp, the rest by SMS
              {state.tone.length > 0 && <span className="ml-2 font-semibold text-due">Please rephrase: “{state.tone.join("”, “")}”</span>}
            </span>
          )}
        </div>
        <p className="text-xs text-ink-600">Sending is switched off in the demo. In a live school, a teacher’s notice waits for the head’s approval if the school requires it.</p>
      </form>

      <div>
        <div className="mb-3 inline-flex rounded-full bg-white p-1 ring-1 ring-cream-200">
          {(["whatsapp", "sms"] as const).map((c) => (
            <button key={c} type="button" onClick={() => setChannel(c)} className={`rounded-full px-4 py-1 text-sm font-semibold ${channel === c ? "bg-navy-900 text-cream-50" : "text-navy-900"}`}>
              {c === "whatsapp" ? "WhatsApp" : "SMS"}
            </button>
          ))}
        </div>
        <div className="mx-auto w-[290px] rounded-[2.4rem] bg-navy-950 p-3 shadow-lift">
          <div className="overflow-hidden rounded-[1.9rem] bg-[#efe7dc]">
            <div className={`px-4 pb-3 pt-6 text-white ${channel === "whatsapp" ? "bg-[#0f5b4f]" : "bg-navy-800"}`}>
              <p className="text-sm font-semibold">{school}</p>
            </div>
            <div className="flex min-h-[300px] flex-col justify-end p-3">
              <div className="max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[0.82rem] leading-snug text-ink-900 shadow-sm">{channel === "sms" ? sms.text : text}</div>
            </div>
          </div>
        </div>
        {channel === "sms" && (
          <p className="mt-3 text-center text-sm text-ink-600">
            {info.length} characters · {info.parts} SMS part{info.parts > 1 ? "s" : ""} · {info.encoding}
            {sms.problems.length > 0 && <span className="block text-due">Remove: {sms.problems.join(" ")}</span>}
          </p>
        )}
      </div>
    </div>
  );
}
