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
  const factor = data?.totp?.[0];
  if (!factor) redirect("/login/mfa/?enrol=1");
  const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: factor.id, code: String(formData.get("code")).replace(/\D/g, "") });
  if (error) redirect("/login/mfa/?error=code");
  redirect("/app/");
}

export async function enrolTotp() {
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: "Shulife" });
  if (error || !data) redirect("/login/mfa/?error=enrol");
  return { qr: data.totp.qr_code, secret: data.totp.secret, factorId: data.id };
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect("/login/");
}
