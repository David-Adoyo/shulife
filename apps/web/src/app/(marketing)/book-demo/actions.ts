"use server";

import { normalizeMsisdn } from "@shulife/core/phone";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
  const { error } = await sb.from("demo_requests").insert({
    school_name: school.slice(0, 160),
    role: String(formData.get("role") ?? "Other").slice(0, 60),
    learners_band: String(formData.get("learners") ?? "").slice(0, 40) || null,
    county: String(formData.get("county") ?? "").trim().slice(0, 60) || null,
    phone,
    best_time: String(formData.get("time") ?? "").slice(0, 40) || null,
  });
  if (error) {
    console.error("demo request failed", error);
    return { ok: false, error: "Sorry, something went wrong. Please try again in a moment." };
  }
  return { ok: true, school, saved: true };
}
