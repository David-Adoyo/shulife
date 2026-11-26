"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getSession, type Role } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ROLES: Role[] = ["director", "head", "bursar", "front_office", "class_teacher"];
export type InviteState = { ok: boolean; message: string } | null;

/** Director invites a staff member: record the invitation, then Supabase emails the link. */
export async function inviteStaff(_: InviteState, formData: FormData): Promise<InviteState> {
  const session = await getSession();
  if (session.role !== "director" || !session.orgId || !session.userId) return { ok: false, message: "Only directors can invite staff." };
  const sb = supabaseAdmin();
  if (!sb) return { ok: false, message: "Supabase is not configured." };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role")) as Role;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, message: "Enter a valid email address." };
  if (!ROLES.includes(role)) return { ok: false, message: "Choose a role." };
  const streamId = String(formData.get("stream") ?? "");
  const { error } = await sb.from("staff_invitations").insert({ org_id: session.orgId, email, role, invited_by: session.userId, stream_ids: role === "class_teacher" && streamId ? [streamId] : null });
  if (error) return { ok: false, message: error.code === "23505" ? "That person already has a pending invitation for this role." : "Could not save the invitation." };
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const { error: mailError } = await sb.auth.admin.inviteUserByEmail(email, { redirectTo: `${origin}/login/set-password/` });
  revalidatePath("/app/team/");
  if (mailError) {
    // Existing Supabase users don't get a new invite email; their membership is added when they next sign in is not automatic, so add it now.
    if (/already been registered/i.test(mailError.message)) {
      const { data } = await sb.from("profiles").select("id").eq("email", email).maybeSingle();
      if (data) {
        await sb.from("memberships").upsert({ org_id: session.orgId, user_id: data.id, role, created_by: session.userId, stream_ids: role === "class_teacher" && streamId ? [streamId] : null }, { onConflict: "org_id,user_id,role" });
        await sb.from("staff_invitations").update({ accepted_by: data.id, accepted_at: new Date().toISOString() }).eq("org_id", session.orgId).eq("email", email).is("accepted_at", null);
        return { ok: true, message: `${email} already had an account and now has access.` };
      }
    }
    return { ok: false, message: `Invitation saved, but the email could not be sent: ${mailError.message}` };
  }
  return { ok: true, message: `Invitation sent to ${email}.` };
}

export async function revokeInvite(formData: FormData) {
  const session = await getSession();
  const sb = supabaseAdmin();
  if (session.role !== "director" || !sb || !session.orgId) return;
  await sb.from("staff_invitations").update({ revoked_at: new Date().toISOString() }).eq("id", String(formData.get("id"))).eq("org_id", session.orgId);
  revalidatePath("/app/team/");
}
