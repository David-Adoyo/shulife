import { createSchool } from "./seed";
import type { School } from "./types";

export * from "./types";
export * from "./seed";
export * from "./pipeline";
export * from "./queries";

/**
 * One demo school per server process. Mutations (resolving the review queue,
 * recording cash) live until the process restarts — production uses Postgres.
 */
const g = globalThis as unknown as { __shulifeDemo?: School };
export function getSchool(): School {
  g.__shulifeDemo ??= createSchool();
  return g.__shulifeDemo;
}
/** Used when the school is loaded from Postgres at startup. */
export function setSchool(s: School) {
  g.__shulifeDemo = s;
}
export function resetSchool() {
  g.__shulifeDemo = createSchool();
  return g.__shulifeDemo;
}
export * from "./jobs";
