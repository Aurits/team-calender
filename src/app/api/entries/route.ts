import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toEntry } from "@/lib/serialize";

export const dynamic = "force-dynamic";

// GET /api/entries?date=YYYY-MM-DD — every entry on a date (all people + meetings).
export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });
  const entries = await prisma.entry.findMany({ where: { date }, orderBy: { start: "asc" } });
  return NextResponse.json(entries.map(toEntry));
}
