import { NextResponse } from "next/server";
import { getBackend } from "@/lib/server/backend";

export const dynamic = "force-dynamic";

// GET /api/people — everyone, without PINs (never expose PINs to the client).
export async function GET() {
  const backend = await getBackend();
  return NextResponse.json(await backend.getPeople());
}
