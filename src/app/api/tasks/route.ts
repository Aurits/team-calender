import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Initiative } from "@/lib/tasks";
import type { Priority } from "@/lib/types";

export const dynamic = "force-dynamic";

type DbTask = {
  id: string;
  level: number;
  parentId: string | null;
  title: string;
  description: string | null;
  priority: string;
  deadline: string | null;
  place: string;
  assignees: string[];
  position: number;
};

const toNode = (t: DbTask) => ({
  id: t.id,
  title: t.title,
  description: t.description ?? undefined,
  priority: t.priority as Priority,
  deadline: t.deadline ?? undefined,
  place: t.place,
  assignees: t.assignees,
});

// GET /api/tasks — the initiative tree, ordered by position.
export async function GET() {
  const tasks = (await prisma.task.findMany({ orderBy: { position: "asc" } })) as DbTask[];
  const tree: Initiative[] = tasks
    .filter((t) => t.level === 1)
    .map((t) => ({
      ...toNode(t),
      children: tasks.filter((c) => c.parentId === t.id).map(toNode),
    }));
  return NextResponse.json(tree);
}

// PUT /api/tasks — save the whole tree: upsert every node, prune anything removed.
// IDs are preserved, so entries that reference tasks keep their links.
export async function PUT(req: Request) {
  const tree = (await req.json()) as Initiative[];

  const flat: DbTask[] = [];
  tree.forEach((init, i) => {
    flat.push({
      id: init.id,
      level: 1,
      parentId: null,
      title: init.title,
      description: init.description ?? null,
      priority: init.priority,
      deadline: init.deadline ?? null,
      place: init.place,
      assignees: init.assignees ?? [],
      position: i,
    });
    (init.children ?? []).forEach((c, j) => {
      flat.push({
        id: c.id,
        level: 2,
        parentId: init.id,
        title: c.title,
        description: c.description ?? null,
        priority: c.priority,
        deadline: c.deadline ?? null,
        place: c.place,
        assignees: c.assignees ?? [],
        position: j,
      });
    });
  });

  const keep = flat.map((f) => f.id);
  await prisma.$transaction([
    ...flat.map((f) =>
      prisma.task.upsert({
        where: { id: f.id },
        create: f,
        update: f,
      }),
    ),
    prisma.task.deleteMany({ where: { id: { notIn: keep } } }),
  ]);

  return NextResponse.json({ ok: true });
}
