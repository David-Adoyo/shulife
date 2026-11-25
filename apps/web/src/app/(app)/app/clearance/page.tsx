import { formatDate, gradeName, isoDateNairobi, teacherView } from "@shulife/core";
import { clearanceForStream, clearanceInput, getSchool } from "@shulife/demo";
import { Card, PageTitle, Pill } from "@/components/app/ui";
import { can, getSession } from "@/lib/session";

export const metadata = { title: "Clearance" };

const COLUMNS = [
  ["cleared", "Cleared"],
  ["on_plan", "On plan"],
  ["not_cleared", "Not cleared"],
  ["overridden", "Overridden"],
] as const;

export default async function Clearance({ searchParams }: { searchParams: Promise<{ stream?: string }> }) {
  const session = await getSession();
  const s = getSchool();
  const event = s.events.find((e) => e.kind === "exam")!;
  const teacher = session.role === "class_teacher";
  const streams = teacher ? s.streams.filter((st) => session.streamIds.includes(st.id)) : s.streams.filter((st) => !session.campusId || st.campusId === session.campusId);
  const { stream } = await searchParams;
  const current = streams.find((st) => st.id === stream) ?? streams[0];
  const board = clearanceForStream(s, current.id);
  // Teachers get a list built only from names and status — no money fields exist in it at all.
  const list = teacher ? teacherView(s.learners.filter((l) => l.streamId === current.id).map((l) => clearanceInput(s, l.id)), { thresholdPct: s.org.clearancePct }, isoDateNairobi(new Date(s.today)), [current.id]) : null;

  return (
    <>
      <PageTitle title="Clearance" sub={`${event.name} · ${formatDate(new Date(event.date))} · cleared at ${s.org.clearancePct}% paid, or on a plan in good standing`} />
      {!teacher && (
        <form className="mb-5 flex flex-wrap items-center gap-2">
          <label htmlFor="stream" className="text-sm font-semibold text-navy-900">
            Class
          </label>
          <select id="stream" name="stream" defaultValue={current.id} className="h-10 rounded-lg border border-cream-200 bg-white px-3">
            {streams.map((st) => (
              <option key={st.id} value={st.id}>
                {gradeName(st.gradeCode)} {st.name} · {st.campusId === "c-rui" ? "Ruiru" : "Syokimau"}
              </option>
            ))}
          </select>
          <button className="h-10 rounded-lg bg-navy-900 px-4 text-sm font-semibold text-cream-50">Show</button>
        </form>
      )}
      <p className="mb-5 rounded-xl bg-navy-100 px-4 py-3 text-sm text-navy-900">
        {teacher ? "You can see whether each learner is cleared. Amounts are never shown to teachers." : "A week before the event, families who aren’t cleared get a private, polite message with options. Teachers see status only."}
      </p>

      {list ? (
        <Card title={`${gradeName(current.gradeCode)} ${current.name} · ${list.length} learners`}>
          <ul className="divide-y divide-cream-200">
            {list.map((l) => (
              <li key={l.learnerId} className="flex items-center justify-between py-3">
                <span className="font-semibold text-navy-900">{l.name}</span>
                <Pill kind={l.status} />
              </li>
            ))}
          </ul>
          <a href="#" className="mt-4 inline-block rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-cream-50">
            Download class list (PDF)
          </a>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {COLUMNS.map(([k, label]) => (
            <Card key={k} className="!p-4">
              <div className="mb-3 flex items-center justify-between">
                <Pill kind={k} label={label} />
                <span className="text-sm font-bold text-navy-900">{board[k].length}</span>
              </div>
              <ul className="flex flex-wrap gap-2">
                {board[k].map((l) => (
                  <li key={l.learnerId} className="rounded-full bg-cream-100 px-3 py-1 text-xs font-semibold text-navy-900">
                    {l.name}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
      {can.approveWaiver(session.role) && <p className="mt-4 text-sm text-ink-600">Heads and bursars can override a learner’s status with a reason; every override is recorded.</p>}
    </>
  );
}
