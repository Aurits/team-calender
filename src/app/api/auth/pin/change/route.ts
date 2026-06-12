import { NextResponse } from "next/server";
import { getBackend } from "@/lib/server/backend";

export const dynamic = "force-dynamic";

// POST /api/auth/pin/change  { oldPin, newPin } -> { ok: true } | 401 | 400
export async function POST(req: Request) {
  const { oldPin, newPin } = await req.json().catch(() => ({ oldPin: undefined, newPin: undefined }));
  
  if (typeof oldPin !== "string" || oldPin.length === 0 || typeof newPin !== "string" || newPin.length === 0) {
    return NextResponse.json({ error: "Missing PINs" }, { status: 400 });
  }

  const backend = await getBackend();
  const person = await backend.verifyPin(oldPin);
  
  if (!person) {
    return NextResponse.json({ error: "Incorrect old PIN" }, { status: 401 });
  }
  
  await backend.updatePin(person.id, newPin);
  return NextResponse.json({ ok: true });
}
