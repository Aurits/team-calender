import { NextResponse } from "next/server";
import { getBackend } from "@/lib/server/backend";

export const dynamic = "force-dynamic";

// GET /api/health — which backend is configured, and whether it actually responds.
export async function GET() {
  const backend = await getBackend();
  try {
    const people = await backend.getPeople(); // light probe: confirms the backend is reachable
    return NextResponse.json({ backend: backend.name, ok: true, people: people.length });
  } catch (e) {
    return NextResponse.json({
      backend: backend.name,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
