import "server-only";
import pg from "pg";
import type { School } from "@shulife/demo";

/** Postgres pool when DATABASE_URL is set; otherwise the app runs on the in-memory demo school. */
const g = globalThis as unknown as { __shulifePool?: pg.Pool | null; __shulifeOrg?: string; __shulifeVersion?: number; __shulifeSync?: Promise<void> | null };

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
export const orgId = () => g.__shulifeOrg ?? null;
export const setOrgId = (id: string) => (g.__shulifeOrg = id);

/** Run a write-through step with a pooled client. */
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

async function loadInto(c: pg.PoolClient, org: string) {
  const { loadSchool, orgVersion } = await import("@shulife/db");
  const { setSchool, DEMO_TODAY } = await import("@shulife/demo");
  const version = await orgVersion(c, org);
  const today = process.env.SHULIFE_TODAY === "now" ? new Date().toISOString() : DEMO_TODAY;
  setSchool(await loadSchool(c, org, { today }));
  g.__shulifeVersion = version;
}

/** Re-read the school from Postgres (after a failed write, so memory never drifts from the database). */
export async function reloadFromDb() {
  const org = orgId();
  if (!org) return;
  await withDb((c) => loadInto(c, org));
}

/**
 * Vercel runs several server instances, each with its own copy of the school in memory.
 * Before reading, compare this copy's version with the database's change counter and
 * reload if another instance has written since. One cheap query per request.
 */
export async function syncSchool(): Promise<void> {
  if (!getPool()) return;
  if (g.__shulifeSync) return g.__shulifeSync;
  g.__shulifeSync = (async () => {
    await withDb(async (c) => {
      let org = orgId();
      if (!org) {
        const { firstOrgId } = await import("@shulife/db");
        org = await firstOrgId(c);
        if (!org) return;
        setOrgId(org);
      }
      const { orgVersion } = await import("@shulife/db");
      if ((await orgVersion(c, org)) !== g.__shulifeVersion) await loadInto(c, org);
    });
  })().finally(() => (g.__shulifeSync = null));
  return g.__shulifeSync;
}

/** The current school, fresh from the database when one is connected. */
export async function school(): Promise<School> {
  await syncSchool();
  const { getSchool } = await import("@shulife/demo");
  return getSchool();
}

const isUniqueViolation = (e: unknown) => (e as { code?: string })?.code === "23505";

/**
 * Run a write against a fresh copy of the school, one at a time on this server.
 * `fn` gets the school, changes it in memory and writes the change to Postgres.
 * If another server took the same receipt number first, reload and try again.
 * If no other server wrote in the meantime, keep this copy instead of reloading it.
 */
export function writeStep<T>(fn: (s: School) => Promise<T>): Promise<T> {
  return serial(() => withSchoolLock(() => attempt(fn)));
}

/**
 * Servers take turns writing to a school: a transaction-scoped advisory lock on a
 * dedicated connection (works through Supabase's transaction pooler), held while this
 * server refreshes its copy, applies the change and writes it.
 */
async function withSchoolLock<T>(run: () => Promise<T>): Promise<T> {
  const pool = getPool();
  if (!pool) return run();
  await syncSchool(); // learn the org id on a cold start
  const org = orgId();
  if (!org) return run();
  const lock = await pool.connect();
  try {
    await lock.query("begin");
    await lock.query("select pg_advisory_xact_lock(hashtextextended($1, 42))", [org]);
    return await run();
  } finally {
    await lock.query("commit").catch(() => undefined);
    lock.release();
  }
}

async function attempt<T>(fn: (s: School) => Promise<T>): Promise<T> {
  {
    const { getSchool } = await import("@shulife/demo");
    for (let attempt = 0; ; attempt++) {
      await syncSchool();
      const s = getSchool();
      const before = g.__shulifeVersion;
      try {
        const result = await fn(s);
        const org = orgId();
        if (org && before !== undefined) {
          const { orgVersion } = await import("@shulife/db");
          const after = await withDb((c) => orgVersion(c, org));
          if (after !== null && (after === before || after === before + 1) && getSchool() === s) g.__shulifeVersion = after;
        }
        return result;
      } catch (e) {
        if (attempt < 8 && isUniqueViolation(e)) {
          await new Promise((r) => setTimeout(r, 15 + Math.random() * 60 * (attempt + 1)));
          await reloadFromDb();
          continue;
        }
        throw e;
      }
    }
  }
}

/**
 * Payments are processed one at a time per server, so each payment's in-memory update
 * and its database write happen together, in order.
 */
let chain: Promise<unknown> = Promise.resolve();
export function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
}
