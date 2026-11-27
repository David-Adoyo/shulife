"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { supabaseConfigured, supabaseServer } from "@/lib/supabase";
import { isShulifeAdmin, supabaseAdmin } from "@/lib/supabase-admin";
import { withDb } from "@/lib/db";

export type CreateSchoolState = { ok: boolean; message: string } | null;

async function adminUser() {
  if (!supabaseConfigured()) return null;
  const { data } = await (await supabaseServer()).auth.getUser();
  return data.user && (await isShulifeAdmin(data.user.id)) ? data.user : null;
}

/**
 * Shulife staff add a school: the organisation, an invitation for its director and the
 * Supabase invite email. The director then signs in and is taken through setup.
 */
export async function createSchool(_: CreateSchoolState, formData: FormData): Promise<CreateSchoolState> {
  const admin = await adminUser();
  if (!admin) return { ok: false, message: "Only Shulife admins can add schools." };
  const sb = supabaseAdmin();
  if (!sb) return { ok: false, message: "Supabase is not configured." };
  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ");
  const directorName = String(formData.get("directorName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (name.length < 3 || name.length > 120) return { ok: false, message: "Enter the school’s name." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, message: "Enter the director’s email address." };

  const org = await withDb(async (c) => {
    await c.query("begin");
    try {
      const o = (await c.query(`insert into organisations (name, created_by) values ($1, $2) returning id`, [name, admin.id])).rows[0].id as string;
      await c.query(`insert into staff_invitations (org_id, email, role, invited_by) values ($1, $2, 'director', $3)`, [o, email, admin.id]);
      await c.query(`insert into audit_log (org_id, actor, action, entity, entity_id, detail) values ($1, $2, 'school.created', 'organisations', $4, $3)`, [o, admin.id, JSON.stringify({ name, director: email }), o]);
      await c.query("commit");
      return o;
    } catch (e) {
      await c.query("rollback");
      throw e;
    }
  });
  if (!org) return { ok: false, message: "The database is not connected." };

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const { error } = await sb.auth.admin.inviteUserByEmail(email, { redirectTo: `${origin}/login/set-password/`, data: directorName ? { full_name: directorName } : undefined });
  revalidatePath("/admin/");
  if (error) {
    // Someone who already has a Shulife account doesn't get an invite email: give them access now.
    if (/already been registered/i.test(error.message)) {
      const { data } = await sb.from("profiles").select("id").eq("email", email).maybeSingle();
      if (data) {
        await sb.from("memberships").upsert({ org_id: org, user_id: data.id, role: "director", created_by: admin.id }, { onConflict: "org_id,user_id,role" });
        await sb.from("staff_invitations").update({ accepted_by: data.id, accepted_at: new Date().toISOString() }).eq("org_id", org).eq("email", email).is("accepted_at", null);
        return { ok: true, message: `${name} added. ${email} already has an account and is now its director; they can switch to it after signing in.` };
      }
    }
    return { ok: false, message: `${name} was added, but the invitation email could not be sent: ${error.message}` };
  }
  return { ok: true, message: `${name} added. ${email} has been emailed an invitation to set it up.` };
}
