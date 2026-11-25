/**
 * Notice audiences (§6.5, §7.9). Deliberately there is no "debtors" audience:
 * fee reminders only ever go through the reminder engine.
 */
export type Audience =
  | { kind: "whole_school" }
  | { kind: "campus"; campusIds: string[] }
  | { kind: "grade"; gradeCodes: string[] }
  | { kind: "stream"; streamIds: string[] }
  | { kind: "route"; routeIds: string[] }
  | { kind: "boarding"; value: "day" | "boarder" }
  | { kind: "custom"; guardianIds: string[] };

export type AudienceLearner = { id: string; campusId: string; gradeCode: string; streamId: string; routeId: string | null; boarding: "day" | "boarder"; status: string; guardianIds: string[] };
export type AudienceGuardian = { id: string; receivesNotices: boolean };

export function resolveAudience(audiences: Audience[], learners: AudienceLearner[], guardians: AudienceGuardian[]): string[] {
  const ok = new Map(guardians.map((g) => [g.id, g.receivesNotices]));
  const out = new Set<string>();
  const active = learners.filter((l) => l.status === "active");
  for (const a of audiences) {
    if (a.kind === "custom") {
      a.guardianIds.forEach((g) => ok.get(g) && out.add(g));
      continue;
    }
    const match = (l: AudienceLearner) =>
      a.kind === "whole_school" ||
      (a.kind === "campus" && a.campusIds.includes(l.campusId)) ||
      (a.kind === "grade" && a.gradeCodes.includes(l.gradeCode)) ||
      (a.kind === "stream" && a.streamIds.includes(l.streamId)) ||
      (a.kind === "route" && l.routeId !== null && a.routeIds.includes(l.routeId)) ||
      (a.kind === "boarding" && l.boarding === a.value);
    for (const l of active.filter(match)) l.guardianIds.forEach((g) => ok.get(g) && out.add(g));
  }
  return [...out].sort();
}

/** Delivered and read progress for the Read-Receipt Meter. */
export function readReceiptStats(messages: { status: "queued" | "sent" | "delivered" | "read" | "failed"; channel: "whatsapp" | "sms" | "email" }[]) {
  const total = messages.length;
  const delivered = messages.filter((m) => m.status === "delivered" || m.status === "read").length;
  const read = messages.filter((m) => m.status === "read").length;
  const failed = messages.filter((m) => m.status === "failed").length;
  return { total, delivered, read, failed, unreadWhatsapp: messages.filter((m) => m.channel === "whatsapp" && m.status !== "read" && m.status !== "failed").length };
}
