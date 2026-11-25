import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSchool } from "@shulife/demo";
import { redirect } from "next/navigation";
import { supabaseConfigured, supabaseServer } from "./supabase";
import { getPool } from "./db";

/** The demo class teacher teaches Grade 4 East at Ruiru (looked up, so it works with database ids too). */
function teacherStreams() {
  const s = getSchool();
  const rui = s.campuses.find((c) => c.code === "RUI");
  return s.streams.filter((st) => st.campusId === rui?.id && st.gradeCode === "G4" && st.name === "East").map((st) => st.id);
}

/**
 * Demo session. Production uses Supabase Auth (email + password + TOTP) and
 * memberships; here a cookie picks the role so every view can be tried. The
 * permission rules below mirror the Postgres RLS policies (packages/db).
 */
export type Role = "director" | "head" | "bursar" | "front_office" | "class_teacher";

export const ROLES: { id: Role; label: string; who: string }[] = [
  { id: "director", label: "Director", who: "Wanjiku Kamau" },
  { id: "head", label: "Head teacher", who: "Peter Mwangi" },
  { id: "bursar", label: "Bursar", who: "Priya Shah" },
  { id: "front_office", label: "Front office", who: "Grace Achieng" },
  { id: "class_teacher", label: "Class teacher", who: "Joseph Otieno · Grade 4 East" },
];

export type Session = { role: Role; name: string; campusId: string | null; streamIds: string[] };

const MFA_ROLES: Role[] = ["director", "head", "bursar"];

/**
 * With Supabase configured: the signed-in user's membership decides role and scope,
 * and director, head and bursar roles must have passed TOTP (AAL2) (§13).
 */
async function supabaseSession(): Promise<Session> {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) redirect("/login/");
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is required with Supabase Auth");
  const { rows } = await pool.query(
    `select role, campus_ids, stream_ids from memberships where user_id = $1 and archived_at is null and role <> 'sponsor'
     order by array_position(array['director','head','bursar','front_office','class_teacher','transport']::app.role[], role) limit 1`,
    [data.user.id],
  );
  if (!rows[0]) redirect("/login/?error=no-access");
  const role = rows[0].role as Role;
  if (MFA_ROLES.includes(role)) {
    const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") redirect("/login/mfa/");
  }
  const c = await cookies();
  const campus = c.get("demo_campus")?.value;
  const allowed: string[] | null = rows[0].campus_ids;
  return {
    role,
    name: (data.user.user_metadata?.full_name as string) ?? data.user.email ?? "Staff",
    campusId: allowed?.length === 1 ? allowed[0] : campus && campus !== "all" && (!allowed || allowed.includes(campus)) ? campus : null,
    streamIds: rows[0].stream_ids ?? [],
  };
}

export async function getSession(): Promise<Session> {
  if (supabaseConfigured()) return supabaseSession();
  const c = await cookies();
  const role = (ROLES.find((r) => r.id === c.get("demo_role")?.value)?.id ?? "director") as Role;
  const campus = c.get("demo_campus")?.value;
  return {
    role,
    name: ROLES.find((r) => r.id === role)!.who,
    campusId: campus && campus !== "all" ? campus : null,
    streamIds: role === "class_teacher" ? teacherStreams() : [],
  };
}

/** What each role may do (§2). The UI hides what a role cannot do — no dead buttons. */
export const can = {
  seeMoney: (r: Role) => r !== "class_teacher",
  editFees: (r: Role) => r === "director" || r === "bursar",
  review: (r: Role) => r === "director" || r === "bursar",
  manualReceipt: (r: Role) => r === "director" || r === "bursar",
  sendNotice: (r: Role) => r !== "bursar",
  approveWaiver: (r: Role) => r === "director" || r === "head",
  reports: (r: Role) => r === "director" || r === "head" || r === "bursar",
  settings: (r: Role) => r === "director",
};

/* ---------- Parent links: signed, expiring, no password (§4.5) ---------- */

const SECRET = process.env.PARENT_TOKEN_SECRET ?? "demo-only-secret-change-me";

export function signParentToken(familyId: string, ttlDays = 30, now = Date.now()) {
  const exp = Math.floor(now / 1000) + ttlDays * 86_400;
  const body = `${familyId}.${exp}`;
  const sig = createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${Buffer.from(body).toString("base64url")}.${sig}`;
}

export function verifyParentToken(token: string, now = Date.now()): string | null {
  const [b, sig] = token.split(".");
  if (!b || !sig) return null;
  const body = Buffer.from(b, "base64url").toString();
  const expected = createHmac("sha256", SECRET).update(body).digest("base64url");
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const [familyId, exp] = body.split(".");
  if (!familyId || Number(exp) * 1000 < now) return null;
  return familyId;
}
