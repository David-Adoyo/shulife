/**
 * Startup: with DATABASE_URL set, load the school from Postgres (seeding it with the
 * demo school first if SHULIFE_SEED_DEMO=1 and the database is empty).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { loadFromPostgres } = await import("./instrumentation-node");
    await loadFromPostgres();
  }
}
