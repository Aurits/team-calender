import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toEntry } from "@/lib/serialize";
import type { Entry } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/days/:personId?date=YYYY-MM-DD — a person's own entries for a date.
export async function GET(req: Request, { params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  const date = new URL(req.url).searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });
  const entries = await prisma.entry.findMany({
    where: { personId, date },
    orderBy: { start: "asc" },
  });
  return NextResponse.json(entries.map(toEntry));
}

// PUT /api/days/:personId  { date, entries } — replace that person's entries for the date.
// Only touches entries the person OWNS, so meetings they merely attend are untouched.
export async function PUT(req: Request, { params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  const body = (await req.json()) as { date: string; entries: Entry[] };
  const { date, entries } = body;
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });

  await prisma.$transaction([
    prisma.entry.deleteMany({ where: { personId, date } }),
    prisma.entry.createMany({
      data: entries.map((e) => ({
        personId,
        taskId: e.taskId,
        note: e.note ?? null,
        date,
        start: e.start,
        durationMins: e.durationMins,
        place: e.place,
        priority: e.priority,
        attendees: e.attendees ?? [],
      })),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
