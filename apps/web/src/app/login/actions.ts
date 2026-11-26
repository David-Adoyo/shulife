"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";

export async function signIn(formData: FormData) {
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword({ email: String(formData.get("email")), password: String(formData.get("password")) });
  if (error) redirect("/login/?error=credentials");
  redirect("/app/");
}

export async function verifyTotp(formData: FormData) {
  const sb = await supabaseServer();
  const { data } = await sb.auth.mfa.listFactors();
  // A factor being set up is not yet in `totp` (verified only), so look in `all`.
  const wanted = String(formData.get("factorId") ?? "");
  const factor = data?.all?.find((f) => f.factor_type === "totp" && (wanted ? f.id === wanted : f.status === "verified"));
  if (!factor) redirect("/login/mfa/?enrol=1");
  const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: factor.id, code: String(formData.get("code")).replace(/\D/g, "") });
  if (error) redirect(`/login/mfa/?error=code${wanted ? "&enrol=1" : ""}`);
  redirect("/app/");
}

export async function enrolTotp() {
  const sb = await supabaseServer();
  // Clear half-finished set-ups so reloading this page never piles up factors.
  const { data: existing } = await sb.auth.mfa.listFactors();
  for (const f of existing?.all ?? []) if (f.factor_type === "totp" && f.status !== "verified") await sb.auth.mfa.unenroll({ factorId: f.id });
  const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: `Shulife ${new Date().toISOString().slice(0, 16)}` });
  if (error || !data) redirect("/login/mfa/?error=enrol");
  return { qr: data.totp.qr_code, secret: data.totp.secret, factorId: data.id };
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect("/login/");
}

export async function setPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) redirect("/login/set-password/?error=short");
  if (password !== String(formData.get("confirm") ?? "")) redirect("/login/set-password/?error=match");
  const sb = await supabaseServer();
  const fullName = String(formData.get("full_name") ?? "").trim().slice(0, 120);
  const { data, error } = await sb.auth.updateUser({ password, data: { full_name: fullName } });
  if (error || !data.user) redirect("/login/set-password/?error=save");
  await sb.from("profiles").update({ full_name: fullName }).eq("id", data.user.id);
  // Directors, heads and bursars set up their authenticator next; the app enforces it.
  redirect("/login/mfa/?enrol=1");
}
