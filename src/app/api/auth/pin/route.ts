import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/auth/pin  { pin } -> person (no pin) | 401
export async function POST(req: Request) {
  const { pin } = await req.json().catch(() => ({ pin: undefined }));
  if (typeof pin !== "string" || pin.length === 0) {
    return NextResponse.json({ error: "Missing PIN" }, { status: 400 });
  }
  const person = await prisma.person.findUnique({
    where: { pin },
    select: { id: true, name: true, role: true, defaultPlace: true, tint: true },
  });
  if (!person) return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  return NextResponse.json(person);
}
