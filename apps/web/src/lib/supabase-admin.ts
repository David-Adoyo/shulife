import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client with the secret (service-role) key. Bypasses RLS, so
 * every caller must check the user's permission first. Never import this in client code.
 */
const g = globalThis as unknown as { __sbAdmin?: SupabaseClient | null };
export function supabaseAdmin(): SupabaseClient | null {
  if (g.__sbAdmin === undefined) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    g.__sbAdmin = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  }
  return g.__sbAdmin;
}

const ORDER = ["director", "head", "bursar", "front_office", "class_teacher", "transport"];
/** All of a user's school memberships (sponsors excluded), highest role first. */
export async function membershipsFor(userId: string) {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("SUPABASE_SECRET_KEY is required with Supabase Auth");
  const { data, error } = await sb.from("memberships").select("org_id, role, campus_ids, stream_ids, organisations(name)").eq("user_id", userId).is("archived_at", null).neq("role", "sponsor");
  if (error) throw error;
  return (data ?? [])
    .map((m) => ({ ...m, orgName: ((m.organisations as unknown as { name: string } | null)?.name ?? "School") as string }))
    .sort((a, b) => ORDER.indexOf(a.role) - ORDER.indexOf(b.role));
}

/**
 * The membership to use: in the school the user last chose (the shulife_org cookie) if
 * they belong to it, otherwise their highest-ranking one.
 */
export async function membershipFor(userId: string, preferredOrg?: string | null) {
  const all = await membershipsFor(userId);
  return (preferredOrg && all.find((m) => m.org_id === preferredOrg)) || all[0] || null;
}

export async function isShulifeAdmin(userId: string) {
  const sb = supabaseAdmin();
  if (!sb) return false;
  const { data } = await sb.from("shulife_admins").select("user_id").eq("user_id", userId).maybeSingle();
  return Boolean(data);
}
