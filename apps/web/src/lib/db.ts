import "server-only";
import { cache } from "react";
import pg from "pg";
import type { School } from "@shulife/demo";

/**
 * Data layer. Without DATABASE_URL the app runs on the in-memory demo school.
 * With it, every school lives in Postgres and each server keeps an in-memory copy per
 * school, checked against the school's change counter (org_versions) before each read.
 */
type Entry = { school: School; version: number };
const g = globalThis as unknown as {
  __shulifePool?: pg.Pool | null;
  __shulifeSchools?: Map<string, Entry>;
  __shulifeSyncs?: Map<string, Promise<void>>;
  __shulifeDemoOrg?: string | null;
};
const schools = (g.__shulifeSchools ??= new Map());
const syncs = (g.__shulifeSyncs ??= new Map());

function sslFor(url: string): pg.PoolConfig["ssl"] {
  if (process.env.DATABASE_SSL === "disable" || /@(localhost|127\.0\.0\.1)[:/]/.test(url)) return undefined;
  // Supabase presents its own CA; the connection is still encrypted.
  return { rejectUnauthorized: false };
}

export function getPool(): pg.Pool | null {
  if (g.__shulifePool === undefined) {
    const url = process.env.DATABASE_URL;
    g.__shulifePool = url ? new pg.Pool({ connectionString: url.replace(/[?&]sslmode=[^&]*/, ""), ssl: sslFor(url), max: 6, idleTimeoutMillis: 10_000 }) : null;
  }
  return g.__shulifePool;
}

/** Run a step with a pooled client. */
export async function withDb<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T | null> {
  const pool = getPool();
  if (!pool) return null;
  const c = await pool.connect();
  try {
    return await fn(c);
  } finally {
    c.release();
  }
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const today = async () => (process.env.SHULIFE_TODAY === "now" ? new Date().toISOString() : (await import("@shulife/demo")).DEMO_TODAY);

async function loadInto(c: pg.PoolClient, org: string) {
  const { loadSchool, orgVersion } = await import("@shulife/db");
  const version = await orgVersion(c, org);
  const s = await loadSchool(c, org, { today: await today() });
  schools.set(org, { school: s, version });
}

/** A real school runs on today's date; the demo stays on its fixed date. */
function touch(s: School) {
  if (!s.org.isDemo) s.today = new Date().toISOString();
  return s;
}

/** Re-read a school from Postgres (after a failed write, so memory never drifts from the database). */
export async function reloadFromDb(org: string) {
  await withDb((c) => loadInto(c, org));
}

/** Make this server's copy of `org` current: one cheap version query, a reload only if it changed. */
export async function syncSchool(org: string): Promise<void> {
  if (!getPool()) return;
  const running = syncs.get(org);
  if (running) return running;
  const p = (async () => {
    await withDb(async (c) => {
      const { orgVersion } = await import("@shulife/db");
      if ((await orgVersion(c, org)) !== schools.get(org)?.version) await loadInto(c, org);
    });
  })().finally(() => syncs.delete(org));
  syncs.set(org, p);
  return p;
}

/** The demo school's id in the database (used for the public demo and legacy demo callbacks). */
export async function demoOrgId(): Promise<string | null> {
  if (g.__shulifeDemoOrg !== undefined) return g.__shulifeDemoOrg;
  const id = await withDb(async (c) => (await c.query(`select id from organisations where is_demo order by created_at limit 1`)).rows[0]?.id ?? null);
  return (g.__shulifeDemoOrg = id ?? null);
}

/** The signed-in staff member's school, once per request. */
export const currentOrgId = cache(async (): Promise<string | null> => {
  if (!getPool()) return null;
  const { supabaseConfigured, supabaseServer } = await import("./supabase");
  if (supabaseConfigured()) {
    const { data } = await (await supabaseServer()).auth.getUser();
    if (data.user) {
      const { membershipFor } = await import("./supabase-admin");
      const { cookies } = await import("next/headers");
      const m = await membershipFor(data.user.id, (await cookies()).get("shulife_org")?.value);
      if (m) return m.org_id as string;
    }
    return null;
  }
  // Local development without Supabase sign-in: act as SHULIFE_DEV_ORG, else the demo school.
  return process.env.SHULIFE_DEV_ORG ?? demoOrgId();
});

async function resolveOrg(org?: string | null): Promise<string> {
  const id = org ?? (await currentOrgId());
  if (!id) throw new Error("No school for this request");
  return id;
}

/**
 * The school for this request: the given org, or the signed-in staff member's school.
 * Without a database, the in-memory demo school.
 */
export async function school(org?: string | null): Promise<School> {
  if (!getPool()) return (await import("@shulife/demo")).getSchool();
  const id = await resolveOrg(org);
  await syncSchool(id);
  const e = schools.get(id);
  if (!e) throw new Error("School not found");
  return touch(e.school);
}

/* ---------- Finding the school behind a public link or callback ---------- */

export async function orgForFamily(familyId: string): Promise<string | null> {
  if (!getPool() || !UUID_RE.test(familyId)) return null;
  return withDb(async (c) => (await c.query(`select org_id from families where id = $1`, [familyId])).rows[0]?.org_id ?? null);
}

export async function orgForReceipt(code: string): Promise<string | null> {
  if (!getPool()) return null;
  return withDb(async (c) => (await c.query(`select org_id from receipts where verify_code = $1 or number = $1 limit 1`, [code])).rows[0]?.org_id ?? null);
}

export async function orgForStream(streamId: string): Promise<string | null> {
  if (!getPool() || !UUID_RE.test(streamId)) return null;
  return withDb(async (c) => (await c.query(`select org_id from streams where id = $1`, [streamId])).rows[0]?.org_id ?? null);
}

/** A real school's Paybill callback: /api/webhooks/mpesa/<campus id>/<callback secret>/… */
export async function campusForCallback(campusId: string, secret: string): Promise<{ org: string; campusId: string } | null> {
  if (!getPool() || !UUID_RE.test(campusId)) return null;
  return withDb(async (c) => {
    const r = await c.query(`select org_id from payment_integrations where campus_id = $1 and provider = 'mpesa_paybill' and callback_secret = $2`, [campusId, secret]);
    return r.rows[0] ? { org: r.rows[0].org_id as string, campusId } : null;
  });
}

/** All schools (for the daily job). */
export async function allOrgIds(): Promise<string[]> {
  return (await withDb(async (c) => (await c.query(`select id from organisations where archived_at is null order by created_at`)).rows.map((r) => r.id as string))) ?? [];
}

/* ---------- Writes ---------- */

const isUniqueViolation = (e: unknown) => (e as { code?: string })?.code === "23505";

/**
 * Run a write against a fresh copy of a school, one at a time on this server and, through
 * a per-school advisory lock, one at a time across servers. `fn` changes the school in
 * memory and writes the change to Postgres. On a receipt-number clash, reload and retry.
 */
export async function writeStep<T>(fn: (s: School) => Promise<T>, org?: string | null): Promise<T> {
  if (!getPool()) {
    const s = (await import("@shulife/demo")).getSchool();
    return serial(() => fn(s));
  }
  const id = await resolveOrg(org);
  return serial(() => withSchoolLock(id, () => attempt(id, fn)));
}

async function withSchoolLock<T>(org: string, run: () => Promise<T>): Promise<T> {
  const lock = await getPool()!.connect();
  try {
    await lock.query("begin");
    await lock.query("select pg_advisory_xact_lock(hashtextextended($1, 42))", [org]);
    return await run();
  } finally {
    await lock.query("commit").catch(() => undefined);
    lock.release();
  }
}

async function attempt<T>(org: string, fn: (s: School) => Promise<T>): Promise<T> {
  for (let n = 0; ; n++) {
    await syncSchool(org);
    const entry = schools.get(org);
    if (!entry) throw new Error("School not found");
    const before = entry.version;
    try {
      const result = await fn(touch(entry.school));
      // Keep this copy if nobody else wrote meanwhile (our write bumped the counter once).
      const { orgVersion } = await import("@shulife/db");
      const after = await withDb((c) => orgVersion(c, org));
      if (after !== null && (after === before || after === before + 1) && schools.get(org) === entry) entry.version = after;
      return result;
    } catch (e) {
      if (n < 8 && isUniqueViolation(e)) {
        await new Promise((r) => setTimeout(r, 15 + Math.random() * 60 * (n + 1)));
        await reloadFromDb(org);
        continue;
      }
      throw e;
    }
  }
}

/** Forget a school's cached copy (after setup steps rewrite it). */
export function invalidate(org: string) {
  schools.delete(org);
}

/** One write at a time on this server. */
let chain: Promise<unknown> = Promise.resolve();
export function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
}

/** The school behind a parent link (null if the family isn't known). Demo mode: the demo school. */
export async function schoolForFamily(familyId: string): Promise<School | null> {
  if (!getPool()) return school();
  const org = await orgForFamily(familyId);
  return org ? school(org) : null;
}

/** The school that issued a receipt (null if no school did). */
export async function schoolForReceipt(code: string): Promise<School | null> {
  if (!getPool()) return school();
  const org = await orgForReceipt(code);
  return org ? school(org) : null;
}
