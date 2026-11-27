import { redirect } from "next/navigation";
import { school } from "@/lib/db";
import { formatDate, gradeName } from "@shulife/core";

import { Card, PageTitle } from "@/components/app/ui";
import { InviteForm } from "@/components/app/invite-form";
import { getSession, ROLES } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabaseConfigured } from "@/lib/supabase";
import { revokeInvite } from "./actions";

export const metadata = { title: "Team" };

const label = (r: string) => ROLES.find((x) => x.id === r)?.label ?? r.replace("_", " ");

export default async function Team() {
  const session = await getSession();
  if (session.role !== "director") redirect("/app/");
  const s = await school();
  const streams = s.streams.map((st) => ({ id: st.id, label: `${gradeName(st.gradeCode)} ${st.name} · ${s.campuses.find((c) => c.id === st.campusId)?.name.replace(/^.*, /, "")}` }));
  const sb = supabaseConfigured() ? supabaseAdmin() : null;
  const members = sb && session.orgId ? ((await sb.from("memberships").select("user_id, role, created_at").eq("org_id", session.orgId).is("archived_at", null)).data ?? []) : [];
  const profiles = sb && members.length ? ((await sb.from("profiles").select("id, email, full_name").in("id", members.map((m) => m.user_id))).data ?? []) : [];
  const invites = sb && session.orgId ? ((await sb.from("staff_invitations").select("id, email, role, created_at, expires_at").eq("org_id", session.orgId).is("accepted_at", null).is("revoked_at", null)).data ?? []) : [];

  return (
    <>
      <PageTitle title="Team" sub="Invite staff by email. Directors, heads and bursars confirm every sign-in with an authenticator code." />
      {!sb ? (
        <Card>
          <p className="text-ink-600">Inviting staff needs Supabase sign-in. Add your Supabase keys (see .env.example) and this page will list your team and send invitations.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          <Card title="Invite someone">
            <InviteForm streams={streams} />
          </Card>
          <Card title={`Staff (${members.length})`}>
            <ul className="divide-y divide-cream-200 text-sm">
              {members.map((m) => {
                const p = profiles.find((x) => x.id === m.user_id);
                return (
                  <li key={m.user_id + m.role} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <span className="font-semibold text-navy-900">{p?.full_name || p?.email || m.user_id}</span>
                    <span className="text-ink-600">
                      {label(m.role)} · since {formatDate(new Date(m.created_at))}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card title={`Pending invitations (${invites.length})`}>
            <ul className="divide-y divide-cream-200 text-sm">
              {invites.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span className="text-navy-900">
                    {i.email} · {label(i.role)}
                  </span>
                  <form action={revokeInvite} className="flex items-center gap-3">
                    <span className="text-xs text-ink-600">expires {formatDate(new Date(i.expires_at))}</span>
                    <input type="hidden" name="id" value={i.id} />
                    <button className="rounded-full px-3 py-1 text-xs font-semibold text-due ring-1 ring-cream-200">Revoke</button>
                  </form>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </>
  );
}
