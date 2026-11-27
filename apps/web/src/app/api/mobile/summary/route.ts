import { dashboard } from "@shulife/demo";
import { school } from "@/lib/db";
import { mobileUser, unauthorised } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await mobileUser(req);
  if (!user) return unauthorised();
  const d = dashboard((await school(user.orgId)));
  return Response.json({
    user,
    term: d.term.name,
    pct: d.pct,
    collected: d.collected,
    billed: d.billed,
    collectedToday: d.collectedToday,
    paymentsToday: d.paymentsToday,
    outstanding: d.outstanding,
    autoMatchRate: d.autoMatchRate,
    review: d.attention.review,
    heat: d.heat.map((h) => ({ grade: h.gradeName, streams: h.streams.map((s) => ({ name: s.name, pct: s.pct })) })),
    feed: d.feed.map((f) => ({ id: f.id, at: f.at, amount: f.amount, family: f.familyName, learners: f.learners, badge: f.badge })),
    projection: { total: d.projection.total, notes: d.projection.notes },
  });
}
