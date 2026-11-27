import "server-only";
import { redirect } from "next/navigation";
import { currentOrgId, getPool, school } from "@/lib/db";
import { getSession } from "@/lib/session";
import { supabaseConfigured } from "@/lib/supabase";

/** Setup is for the school's director, on a connected database. */
export async function setupContext() {
  if (!getPool()) redirect("/app/onboarding/");
  const session = await getSession();
  if (session.role !== "director") redirect("/app/");
  const org = session.orgId ?? (supabaseConfigured() ? null : await currentOrgId());
  if (!org) redirect("/login/");
  const actor = session.userId ?? "00000000-0000-4000-a000-000000000001";
  return { session, org, actor, s: await school(org) };
}
