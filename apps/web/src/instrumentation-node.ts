/** Node-only startup: load the school from Postgres (see instrumentation.ts). */
export async function loadFromPostgres() {
  if (!process.env.DATABASE_URL) return;
  const { getPool, setOrgId } = await import("./lib/db");
  const { firstOrgId, loadSchool, saveSchool } = await import("@shulife/db");
  const { createSchool, setSchool, DEMO_TODAY } = await import("@shulife/demo");
  const client = await getPool()!.connect();
  try {
    let org = await firstOrgId(client);
    if (!org && process.env.SHULIFE_SEED_DEMO === "1") org = await saveSchool(client, createSchool());
    if (!org) {
      console.warn("[shulife] DATABASE_URL is set but the database has no school yet. Set SHULIFE_SEED_DEMO=1 to load the demo school.");
      return;
    }
    const today = process.env.SHULIFE_TODAY === "now" ? new Date().toISOString() : DEMO_TODAY;
    setSchool(await loadSchool(client, org, { today }));
    setOrgId(org);
    console.log("[shulife] school loaded from Postgres");
  } finally {
    client.release();
  }
}
