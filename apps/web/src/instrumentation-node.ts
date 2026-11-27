/** Node-only startup: load the school from Postgres (see instrumentation.ts). */
export async function loadFromPostgres() {
  if (!process.env.DATABASE_URL) return;
  const { withDb, syncSchool, orgId } = await import("./lib/db");
  if (process.env.SHULIFE_SEED_DEMO === "1") {
    const { firstOrgId, saveSchool } = await import("@shulife/db");
    const { createSchool } = await import("@shulife/demo");
    await withDb(async (c) => {
      if (!(await firstOrgId(c))) await saveSchool(c, createSchool());
    });
  }
  try {
    await syncSchool();
    console.log(orgId() ? "[shulife] school loaded from Postgres" : "[shulife] DATABASE_URL is set but the database has no school yet.");
  } catch (e) {
    console.error("[shulife] could not load the school from Postgres", e);
  }
}
