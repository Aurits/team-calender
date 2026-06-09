import { NextResponse } from "next/server";
import { getBackend } from "@/lib/server/backend";

export const dynamic = "force-dynamic";

// GET /api/entries?date=YYYY-MM-DD — every entry on a date (all people + meetings).
export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });
  const backend = await getBackend();
  return NextResponse.json(await backend.getEntries(date));
}
