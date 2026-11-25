import { getSchool, reports } from "@shulife/demo";
import { getSession, can } from "@/lib/session";

export const dynamic = "force-dynamic";

const csv = (v: string | number) => (typeof v === "number" ? String(v) : /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export async function GET() {
  const session = await getSession();
  if (!can.reports(session.role)) return new Response("Forbidden", { status: 403 });
  const r = reports(getSchool(), session.campusId);
  const rows = [["Grade", "Learners", "Billed (KES)", "Collected (KES)", "% collected"], ...r.byGrade.map((g) => [g.grade, g.learners, (g.billed / 100).toFixed(2), (g.paid / 100).toFixed(2), g.pct])];
  return new Response(rows.map((r) => r.map(csv).join(",")).join("\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="collection-by-grade.csv"' } });
}
