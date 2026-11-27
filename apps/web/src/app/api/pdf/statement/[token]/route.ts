
import { verifyParentToken } from "@/lib/session";
import { school } from "@/lib/db";
import { familyStatement } from "../../statement";

export const dynamic = "force-dynamic";

/** Parent statement download (signed link only). */
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const familyId = verifyParentToken((await params).token);
  if (!familyId) return new Response("Link expired", { status: 404 });
  return (await familyStatement((await school()), familyId)) ?? new Response("Not found", { status: 404 });
}
