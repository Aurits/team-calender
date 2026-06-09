import { NextResponse } from "next/server";
import { getBackend } from "@/lib/server/backend";
import type { Initiative } from "@/lib/tasks";

export const dynamic = "force-dynamic";

// GET /api/tasks — the initiative tree, ordered by position.
export async function GET() {
  const backend = await getBackend();
  return NextResponse.json(await backend.getTasks());
}

// PUT /api/tasks — save the whole tree. IDs are preserved, so entries that
// reference tasks keep their links.
export async function PUT(req: Request) {
  const tree = (await req.json()) as Initiative[];
  const backend = await getBackend();
  await backend.saveTasks(tree);
  return NextResponse.json({ ok: true });
}
