"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Chevron, PageFrame, Pin, Plus, PriorityTag, X } from "@/components/ui";
import { clearPerson, useRequirePerson } from "@/lib/session";
import { childrenOf, getPerson, initiatives, placeChoices } from "@/lib/data";
import type { Priority } from "@/lib/types";

interface L2 { id: string; title: string; priority: Priority; place: string }
interface L1 {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  deadline?: string;
  place: string;
  children: L2[];
}

const fmtDeadline = (iso?: string) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" }) : null;

let seq = 100;
const buildTree = (): L1[] =>
  initiatives.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority,
    deadline: t.deadline,
    place: t.defaultPlace ?? "",
    children: childrenOf(t.id).map((c) => ({
      id: c.id,
      title: c.title,
      priority: c.priority,
      place: c.defaultPlace ?? t.defaultPlace ?? "",
    })),
  }));

export default function ManagePage() {
  const personId = useRequirePerson();
  const router = useRouter();
  const [tree, setTree] = useState<L1[]>(buildTree);
  const [open, setOpen] = useState<Record<string, boolean>>({ t1: true });
  const [addingL1, setAddingL1] = useState(false);

  if (!personId) return <div className="min-h-dvh" />;
  const person = getPerson(personId)!;

  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const totalWs = tree.reduce((n, t) => n + t.children.length, 0);

  return (
    <PageFrame
      here="manage"
      overline="Task list"
      title="Tasks"
      subtitle="The team's task list. Set the breakdown, priorities, and default places here."
      person={{ name: person.name, tint: person.tint }}
      onSignOut={() => {
        clearPerson();
        router.push("/");
      }}
      actions={
        <button onClick={() => setAddingL1((v) => !v)} className="btn btn-primary">
          <Plus width={16} height={16} /> New initiative
        </button>
      }
    >
      <div className="mb-5 flex gap-2 text-xs text-muted">
        <span className="rounded-full border border-hairline bg-surface px-3 py-1">{tree.length} initiatives</span>
        <span className="rounded-full border border-hairline bg-surface px-3 py-1">{totalWs} workstreams</span>
      </div>

      {addingL1 && (
        <div className="mb-4">
          <AddInitiative
            onCancel={() => setAddingL1(false)}
            onAdd={(d) => {
              setTree((t) => [...t, { ...d, id: `n${seq++}`, children: [] }]);
              setAddingL1(false);
            }}
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {tree.map((l1) => {
          const expanded = !!open[l1.id];
          return (
            <div key={l1.id} className="card overflow-hidden">
              <div className="flex items-start gap-3 p-4">
                <button
                  onClick={() => toggle(l1.id)}
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
                  aria-label={expanded ? "Collapse" : "Expand"}
                >
                  <Chevron className={`transition-transform ${expanded ? "" : "-rotate-90"}`} width={16} height={16} />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-semibold text-ink">{l1.title}</span>
                    <PriorityTag priority={l1.priority} />
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">L1</span>
                  </div>
                  {l1.description && <p className="mt-1 text-sm text-muted">{l1.description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ink-2">
                    {l1.place && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-hairline bg-surface px-2.5 py-1">
                        <Pin width={13} height={13} className="text-muted" />
                        {l1.place}
                      </span>
                    )}
                    {fmtDeadline(l1.deadline) && (
                      <span className="rounded-full border border-hairline bg-surface px-2.5 py-1">Due {fmtDeadline(l1.deadline)}</span>
                    )}
                    <span className="text-muted">{l1.children.length} workstream{l1.children.length === 1 ? "" : "s"}</span>
                  </div>
                </div>
              </div>

              {expanded && (
                <div className="border-t border-hairline bg-surface-2/60 px-4 py-3">
                  {l1.children.map((c) => (
                    <div key={c.id} className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface">
                      <span className="ml-2 h-1.5 w-1.5 rounded-full bg-hairline-2" />
                      <span className="text-sm text-ink">{c.title}</span>
                      <PriorityTag priority={c.priority} />
                      {c.place && <span className="text-xs text-muted">· {c.place}</span>}
                      <button
                        onClick={() =>
                          setTree((t) =>
                            t.map((x) => (x.id === l1.id ? { ...x, children: x.children.filter((y) => y.id !== c.id) } : x)),
                          )
                        }
                        className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-muted opacity-0 transition hover:bg-high-soft hover:text-high-ink group-hover:opacity-100"
                        aria-label="Remove workstream"
                      >
                        <X width={15} height={15} />
                      </button>
                    </div>
                  ))}
                  {l1.children.length === 0 && <div className="px-2 py-2 text-sm text-muted">No workstreams yet.</div>}

                  <AddWorkstream
                    parentPlace={l1.place}
                    onAdd={(d) => setTree((t) => t.map((x) => (x.id === l1.id ? { ...x, children: [...x.children, d] } : x)))}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageFrame>
  );
}

function AddInitiative({
  onAdd,
  onCancel,
}: {
  onAdd: (d: Omit<L1, "id" | "children">) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [deadline, setDeadline] = useState("");
  const [place, setPlace] = useState("Main Office");
  return (
    <div className="card p-4">
      <div className="mb-3 text-sm font-semibold text-ink">New initiative</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
          <span className="text-[11px] font-medium text-muted">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="field" placeholder="e.g. Sora Project" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted">Priority</span>
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="field">
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted">Deadline</span>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="field tnum" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted">Default place</span>
          <select value={place} onChange={(e) => setPlace(e.target.value)} className="field">
            {placeChoices.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onCancel} className="btn btn-ghost">Cancel</button>
        <button
          disabled={!title.trim()}
          onClick={() => onAdd({ title: title.trim(), priority, deadline: deadline || undefined, place })}
          className="btn btn-primary"
        >
          Add initiative
        </button>
      </div>
    </div>
  );
}

function AddWorkstream({ parentPlace, onAdd }: { parentPlace: string; onAdd: (d: L2) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-accent-hover hover:bg-accent-soft">
        <Plus width={16} height={16} /> Add workstream
      </button>
    );
  }
  const submit = () => {
    if (!title.trim()) return;
    onAdd({ id: `n${seq++}`, title: title.trim(), priority, place: parentPlace });
    setTitle("");
    setPriority("medium");
    setOpen(false);
  };
  return (
    <div className="mt-2 flex flex-wrap items-end gap-2 rounded-xl border border-hairline bg-surface p-3">
      <label className="flex min-w-[180px] flex-1 flex-col gap-1">
        <span className="text-[11px] font-medium text-muted">Workstream title</span>
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} className="field" placeholder="e.g. Site survey" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-medium text-muted">Priority</span>
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="field">
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </label>
      <button onClick={submit} disabled={!title.trim()} className="btn btn-primary">Add</button>
      <button onClick={() => setOpen(false)} className="btn btn-ghost">Cancel</button>
    </div>
  );
}
