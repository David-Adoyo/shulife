import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase";

/** Links in Supabase emails (invite, password reset) land here and become a session. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") ?? (type === "invite" || type === "recovery" ? "/login/set-password/" : "/app/");
  if (token_hash && type) {
    const sb = await supabaseServer();
    const { error } = await sb.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/app/", url.origin));
  }
  return NextResponse.redirect(new URL("/login/?error=link", url.origin));
}
