import { gradeName, isoDateNairobi, teacherView } from "@shulife/core";
import { clearanceInput, getSchool } from "@shulife/demo";
import { getSession } from "@/lib/session";
import { clearancePdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ stream: string }> }) {
  const { stream } = await params;
  const session = await getSession();
  if (session.role === "class_teacher" && !session.streamIds.includes(stream)) return new Response("Forbidden", { status: 403 });
  const s = getSchool();
  const st = s.streams.find((x) => x.id === stream);
  if (!st) return new Response("Not found", { status: 404 });
  const event = s.events.find((e) => e.kind === "exam")!;
  const rows = teacherView(s.learners.filter((l) => l.streamId === stream && l.status === "active").map((l) => clearanceInput(s, l.id)), { thresholdPct: s.org.clearancePct }, isoDateNairobi(new Date(s.today)), [stream]);
  const pdf = await clearancePdf({ school: s.org.name, campus: s.campuses.find((c) => c.id === st.campusId)!.name, className: `${gradeName(st.gradeCode)} ${st.name}`, event: event.name, date: event.date, rows: rows.map((r) => ({ name: r.name, status: r.status })) });
  return new Response(new Uint8Array(pdf), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="clearance-${stream}.pdf"` } });
}
