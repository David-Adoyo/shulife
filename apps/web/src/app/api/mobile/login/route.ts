import { signStaffToken } from "@/lib/mobile-auth";
import { supabaseConfigured } from "@/lib/supabase";

/** Demo sign-in for the mobile app: pick the director or bursar. (Supabase sign-in happens in the app.) */
export async function POST(req: Request) {
  if (supabaseConfigured()) return Response.json({ error: "Sign in with your email and password" }, { status: 400 });
  const { role } = (await req.json().catch(() => ({}))) as { role?: string };
  if (role !== "director" && role !== "bursar") return Response.json({ error: "Choose director or bursar" }, { status: 400 });
  const name = role === "director" ? "Wanjiku Kamau" : "Priya Shah";
  return Response.json({ token: signStaffToken({ role, name }), name, role, school: "Mlima Academy" });
}
