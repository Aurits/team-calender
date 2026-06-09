import { NextResponse } from "next/server";
import { getBackend } from "@/lib/server/backend";

export const dynamic = "force-dynamic";

// POST /api/auth/pin  { pin } -> person (no pin) | 401
export async function POST(req: Request) {
  const { pin } = await req.json().catch(() => ({ pin: undefined }));
  if (typeof pin !== "string" || pin.length === 0) {
    return NextResponse.json({ error: "Missing PIN" }, { status: 400 });
  }
  const backend = await getBackend();
  const person = await backend.verifyPin(pin);
  if (!person) return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  return NextResponse.json(person);
}
