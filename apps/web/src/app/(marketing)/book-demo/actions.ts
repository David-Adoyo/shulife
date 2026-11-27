"use server";

import { normalizeMsisdn } from "@shulife/core/phone";
import { after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { compose, sendEmail, shulifeAdminEmails } from "@/lib/email";

export type DemoState = { ok: boolean; school?: string; error?: string; saved?: boolean } | null;

/** "Book a demo" → demo_requests (§9.3). Written with the service role; only Shulife admins can read it. */
export async function requestDemo(_: DemoState, formData: FormData): Promise<DemoState> {
  const school = String(formData.get("school") ?? "").trim();
  const phone = normalizeMsisdn(String(formData.get("phone") ?? ""));
  if (formData.get("website")) return { ok: true, school }; // honeypot: bots fill hidden fields
  if (school.length < 2) return { ok: false, error: "Please enter your school’s name." };
  if (!phone) return { ok: false, error: "Please enter a Kenyan phone number, e.g. 0712 345 678." };
  const sb = supabaseAdmin();
  if (!sb) return { ok: true, school, saved: false };
  const row = {
    school_name: school.slice(0, 160),
    role: String(formData.get("role") ?? "Other").slice(0, 60),
    learners_band: String(formData.get("learners") ?? "").slice(0, 40) || null,
    county: String(formData.get("county") ?? "").trim().slice(0, 60) || null,
    phone,
    best_time: String(formData.get("time") ?? "").slice(0, 40) || null,
  };
  const { error } = await sb.from("demo_requests").insert(row);
  if (error) {
    console.error("demo request failed", error);
    return { ok: false, error: "Sorry, something went wrong. Please try again in a moment." };
  }
  // Tell Shulife's team straight away (after the response, so the parent form stays fast).
  after(async () => {
    const to = await shulifeAdminEmails();
    await sendEmail(
      compose("demo_request", to, `Demo request: ${row.school_name}`, {
        heading: `New demo request from ${row.school_name}`,
        intro: "Call them back at the time they chose.",
        rows: [["School", row.school_name], ["Role", row.role], ["Learners", row.learners_band ?? "Not given"], ["County", row.county ?? "Not given"], ["Phone", `+${row.phone}`], ["Best time", row.best_time ?? "Any time"]],
        button: { label: "Open the admin console", href: "https://shulife.co.ke/admin/" },
      }),
    );
  });
  return { ok: true, school, saved: true };
}
