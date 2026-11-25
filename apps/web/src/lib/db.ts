import "server-only";
import pg from "pg";

/** Postgres pool when DATABASE_URL is set; otherwise the app runs on the in-memory demo school. */
const g = globalThis as unknown as { __shulifePool?: pg.Pool | null; __shulifeOrg?: string };

export function getPool(): pg.Pool | null {
  if (g.__shulifePool === undefined) g.__shulifePool = process.env.DATABASE_URL ? new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 }) : null;
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

/** Re-read the school from Postgres (after a failed write, so memory never drifts from the database). */
export async function reloadFromDb() {
  const org = orgId();
  if (!org) return;
  const { loadSchool } = await import("@shulife/db");
  const { setSchool, getSchool } = await import("@shulife/demo");
  const today = getSchool().today;
  await withDb(async (c) => setSchool(await loadSchool(c, org, { today })));
}

/**
 * Payments are processed one at a time per server — the in-process equivalent of a
 * single queue consumer (pgmq in production) — so each payment's in-memory update and
 * its database write happen together, in order.
 */
let chain: Promise<unknown> = Promise.resolve();
export function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
}
