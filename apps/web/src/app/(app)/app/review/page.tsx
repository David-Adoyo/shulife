import { redirect } from "next/navigation";
import { school } from "@/lib/db";
import { formatDate, formatTime } from "@shulife/core";
import { reviewQueue } from "@shulife/demo";
import { Card, Empty, KSh, PageTitle } from "@/components/app/ui";
import { Icon } from "@/components/icons";
import { can, getSession } from "@/lib/session";
import { resolveCard } from "../../actions";
import { ReviewKeys } from "@/components/app/review-keys";

export const metadata = { title: "Review queue" };

export default async function Review() {
  const session = await getSession();
  if (!can.review(session.role)) redirect("/app/");
  const s = await school();
  const queue = reviewQueue(s).filter((p) => !session.campusId || p.campusId === session.campusId);
  const card = queue[0];

  return (
    <>
      <PageTitle title="Review queue" sub={queue.length ? `${queue.length} left, about ${Math.max(1, Math.round(queue.length * 0.25))} minutes` : "All caught up"} />
      {!card ? (
        <Empty title="Every payment is matched" body="New payments Shulife isn’t sure about will appear here, with the most likely families and the reasons." icon={Icon.Check} />
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_1fr]">
          <Card>
            <ReviewKeys count={card.suggestions.length} />
            <div className="rounded-xl bg-navy-900 p-5 text-cream-50">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-4xl">
                  <KSh cents={card.amount} className="[&_span]:text-cream-100/70" />
                </p>
                <p className="text-sm text-cream-100/70">
                  {formatDate(new Date(card.paidAt))} {formatTime(new Date(card.paidAt))} · {card.channel === "c2b" ? "M-Pesa" : card.channel}
                </p>
              </div>
              <p className="mt-2 text-sm text-cream-100/80">
                Reference <span className="font-mono text-gold-300">“{card.billRef || "(blank)"}”</span> · from {card.phoneLast3 ? `07•• ••• ${card.phoneLast3}` : "bank"} · {card.payerName ?? ""}
              </p>
            </div>

            <ol className="mt-5 space-y-3">
              {card.suggestions.map((sg, i) => {
                const fam = s.families.find((f) => f.id === sg.familyId)!;
                const kids = s.learners.filter((l) => l.familyId === fam.id);
                return (
                  <li key={sg.familyId}>
                    <form action={resolveCard} className={`flex flex-wrap items-center gap-4 rounded-xl p-4 ring-1 ${i === 0 ? "bg-gold-200/40 ring-gold-400" : "ring-cream-200"}`}>
                      <input type="hidden" name="paymentId" value={card.id} />
                      <input type="hidden" name="familyId" value={sg.familyId} />
                      <kbd className="inline-flex size-9 items-center justify-center rounded-lg bg-navy-900 font-mono text-cream-50">{i + 1}</kbd>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-navy-900">
                          {fam.displayName} <span className="rounded bg-cream-100 px-1.5 py-0.5 font-mono text-xs font-normal text-navy-900">{fam.code}</span> <span className="font-normal text-ink-600">· {kids.map((k) => `${k.firstName} (${k.admissionNumber})`).join(", ")}</span>
                        </p>
                        <ul className="mt-1 text-sm text-ink-600">
                          {sg.reasons.map((r) => (
                            <li key={r}>• {r}</li>
                          ))}
                        </ul>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-navy-100">
                            <div className="h-full rounded-full bg-gold-500" style={{ width: `${sg.score}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-navy-900">{sg.score}</span>
                        </div>
                      </div>
                      <button data-key={i + 1} className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-cream-50">
                        Assign and split
                      </button>
                    </form>
                  </li>
                );
              })}
            </ol>
            {card.suggestions.length === 0 && <p className="mt-4 text-sm text-ink-600">No likely families. If this isn’t a payment for your school, mark it as not ours.</p>}
            <div className="mt-5 flex flex-wrap gap-2 border-t border-cream-200 pt-4">
              <form action={resolveCard}>
                <input type="hidden" name="paymentId" value={card.id} />
                <button data-key="n" className="rounded-full px-4 py-2 text-sm font-semibold text-navy-900 ring-1 ring-cream-200">
                  <kbd className="mr-1 font-mono">N</kbd> Not ours
                </button>
              </form>
              <a href={`/app/families/?q=${encodeURIComponent(card.billRef ?? "")}`} className="rounded-full px-4 py-2 text-sm font-semibold text-navy-900 ring-1 ring-cream-200">
                <kbd className="mr-1 font-mono">F</kbd> Find another family
              </a>
            </div>
          </Card>

          <Card title={`Up next (${queue.length - 1})`}>
            <ul className="divide-y divide-cream-200 text-sm">
              {queue.slice(1, 12).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block font-mono text-xs text-ink-600">“{p.billRef || "(blank)"}”</span>
                    <span className="text-ink-600">{formatDate(new Date(p.paidAt))}</span>
                  </span>
                  <KSh cents={p.amount} className="text-navy-900" />
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-ink-600">Each decision teaches Shulife the payer’s phone, so the same payer is recognised next time.</p>
          </Card>
        </div>
      )}
    </>
  );
}
