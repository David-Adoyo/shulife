import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "./db";
import { supabaseConfigured } from "./supabase";
import type { Role } from "./session";

/**
 * Mobile app sign-in. With Supabase: the app sends the user's access token and the
 * role comes from memberships. In demo mode: a signed staff token from /api/mobile/login.
 * The mobile app serves directors and bursars only (§17 Stage 12).
 */
const SECRET = process.env.PARENT_TOKEN_SECRET ?? "demo-only-secret-change-me";
export type MobileUser = { role: Role; name: string };

export function signStaffToken(u: MobileUser, ttlDays = 7) {
  const body = Buffer.from(JSON.stringify({ ...u, exp: Date.now() + ttlDays * 86_400_000 })).toString("base64url");
  return `${body}.${createHmac("sha256", SECRET).update(`staff:${body}`).digest("base64url")}`;
}

export async function mobileUser(req: Request): Promise<MobileUser | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return null;
  if (supabaseConfigured()) {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data } = await sb.auth.getUser(token);
    if (!data.user) return null;
    const { rows } = (await getPool()?.query(`select role from memberships where user_id = $1 and archived_at is null and role in ('director','bursar') limit 1`, [data.user.id])) ?? { rows: [] };
    return rows[0] ? { role: rows[0].role, name: data.user.email ?? "Staff" } : null;
  }
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", SECRET).update(`staff:${body}`).digest("base64url");
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const u = JSON.parse(Buffer.from(body, "base64url").toString()) as MobileUser & { exp: number };
  return u.exp > Date.now() && (u.role === "director" || u.role === "bursar") ? { role: u.role, name: u.name } : null;
}

export const unauthorised = () => Response.json({ error: "Please sign in again" }, { status: 401 });
