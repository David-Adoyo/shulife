/** Node-only startup: with a database, seed the demo school if asked and warm its copy. */
export async function loadFromPostgres() {
  if (!process.env.DATABASE_URL) return;
  const { withDb, syncSchool, demoOrgId } = await import("./lib/db");
  try {
    if (process.env.SHULIFE_SEED_DEMO === "1") {
      const { saveSchool } = await import("@shulife/db");
      const { createSchool } = await import("@shulife/demo");
      await withDb(async (c) => {
        const has = (await c.query(`select 1 from organisations where is_demo limit 1`)).rowCount;
        if (!has) await saveSchool(c, createSchool());
      });
    }
    const demo = await demoOrgId();
    if (demo) await syncSchool(demo);
    console.log("[shulife] connected to Postgres");
  } catch (e) {
    console.error("[shulife] could not reach Postgres at startup", e);
  }
}
