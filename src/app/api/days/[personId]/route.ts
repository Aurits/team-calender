import { NextResponse } from "next/server";
import { getBackend } from "@/lib/server/backend";
import type { Entry } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/days/:personId?date=YYYY-MM-DD — a person's own entries for a date.
export async function GET(req: Request, { params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  const date = new URL(req.url).searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });
  const backend = await getBackend();
  return NextResponse.json(await backend.getDay(personId, date));
}

// PUT /api/days/:personId  { date, entries } — replace that person's entries for the date.
// Only touches entries the person OWNS, so meetings they merely attend are untouched.
export async function PUT(req: Request, { params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  const body = (await req.json()) as { date: string; entries: Entry[] };
  const { date, entries } = body;
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });
  const backend = await getBackend();
  await backend.saveDay(personId, date, entries ?? []);
  return NextResponse.json({ ok: true });
}
