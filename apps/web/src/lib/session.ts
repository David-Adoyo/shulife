import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

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

export async function getSession(): Promise<Session> {
  const c = await cookies();
  const role = (ROLES.find((r) => r.id === c.get("demo_role")?.value)?.id ?? "director") as Role;
  const campus = c.get("demo_campus")?.value;
  return {
    role,
    name: ROLES.find((r) => r.id === role)!.who,
    campusId: campus && campus !== "all" ? campus : null,
    streamIds: role === "class_teacher" ? ["RUI-G4-East"] : [],
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
