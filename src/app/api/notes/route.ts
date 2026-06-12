import { NextResponse } from "next/server";
import { getBackend } from "@/lib/server/backend";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const personId = searchParams.get("personId");
  const date = searchParams.get("date");
  if (!personId || !date) return NextResponse.json({ error: "Missing personId or date" }, { status: 400 });

  const backend = await getBackend();
  const content = await backend.getNote(personId, date);
  return NextResponse.json({ content });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !body.personId || !body.date) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const backend = await getBackend();
  await backend.saveNote(body.personId, body.date, body.content || "");
  return NextResponse.json({ ok: true });
}
