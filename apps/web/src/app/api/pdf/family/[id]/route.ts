import { getSchool } from "@shulife/demo";
import { can, getSession } from "@/lib/session";
import { familyStatement } from "../../statement";

export const dynamic = "force-dynamic";

/** Staff statement download (roles that may see money only). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!can.seeMoney(session.role)) return new Response("Forbidden", { status: 403 });
  return (await familyStatement(getSchool(), (await params).id)) ?? new Response("Not found", { status: 404 });
}
