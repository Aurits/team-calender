import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/people — everyone, without PINs (never expose PINs to the client).
export async function GET() {
  const people = await prisma.person.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true, defaultPlace: true, tint: true },
  });
  return NextResponse.json(people);
}
