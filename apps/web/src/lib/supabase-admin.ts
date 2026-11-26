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
/** The user's highest-ranking school membership (sponsors excluded). */
export async function membershipFor(userId: string) {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("SUPABASE_SECRET_KEY is required with Supabase Auth");
  const { data, error } = await sb.from("memberships").select("org_id, role, campus_ids, stream_ids").eq("user_id", userId).is("archived_at", null).neq("role", "sponsor");
  if (error) throw error;
  return (data ?? []).sort((a, b) => ORDER.indexOf(a.role) - ORDER.indexOf(b.role))[0] ?? null;
}

export async function isShulifeAdmin(userId: string) {
  const sb = supabaseAdmin();
  if (!sb) return false;
  const { data } = await sb.from("shulife_admins").select("user_id").eq("user_id", userId).maybeSingle();
  return Boolean(data);
}
