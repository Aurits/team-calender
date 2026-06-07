"use client";

import { useState } from "react";
import { Button, Card, PageHeader, Pill, PriorityTag } from "@/components/ui";
import { ChevronIcon, PinIcon, PlusIcon, XIcon } from "@/components/icons";
import { childrenOf, initiatives, placeChoices } from "@/lib/data";
import type { Priority } from "@/lib/types";

interface L2 {
  id: string;
  title: string;
  priority: Priority;
  place: string;
}
interface L1 {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  deadline?: string;
  place: string;
  children: L2[];
}

const fieldCls =
  "w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none";

const fmtDeadline = (iso?: string) =>
  iso
    ? new Date(iso + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" })
    : null;

let seq = 100;

function buildTree(): L1[] {
  return initiatives.map((t) => ({
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
}

export default function ManagePage() {
  const [tree, setTree] = useState<L1[]>(buildTree);
  const [open, setOpen] = useState<Record<string, boolean>>({ t1: true });
  const [addingL1, setAddingL1] = useState(false);

  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const addInitiative = (data: Omit<L1, "id" | "children">) =>
    setTree((t) => [...t, { ...data, id: `n${seq++}`, children: [] }]);

  const addWorkstream = (l1: string, data: L2) =>
    setTree((t) => t.map((x) => (x.id === l1 ? { ...x, children: [...x.children, data] } : x)));

  const removeWorkstream = (l1: string, l2: string) =>
    setTree((t) =>
      t.map((x) => (x.id === l1 ? { ...x, children: x.children.filter((c) => c.id !== l2) } : x)),
    );

  const totalWs = tree.reduce((n, t) => n + t.children.length, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Manage"
        subtitle="The team's task list. Set the breakdown, priorities, and default places here."
        actions={
          <Button variant="primary" icon={<PlusIcon />} onClick={() => setAddingL1((v) => !v)}>
            New initiative
          </Button>
        }
      />

      <div className="flex gap-2 text-xs text-muted">
        <Pill>{tree.length} initiatives</Pill>
        <Pill>{totalWs} workstreams</Pill>
      </div>

      {addingL1 && (
        <AddInitiativeForm
          onCancel={() => setAddingL1(false)}
          onAdd={(d) => {
            addInitiative(d);
            setAddingL1(false);
          }}
        />
      )}

      <div className="flex flex-col gap-3">
        {tree.map((l1) => {
          const expanded = !!open[l1.id];
          return (
            <Card key={l1.id} className="overflow-hidden">
              {/* L1 header */}
              <div className="flex items-start gap-3 p-4">
                <button
                  onClick={() => toggle(l1.id)}
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
                  aria-label={expanded ? "Collapse" : "Expand"}
                >
                  <ChevronIcon
                    className={`transition-transform ${expanded ? "" : "-rotate-90"}`}
                    width={16}
                    height={16}
                  />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{l1.title}</span>
                    <PriorityTag priority={l1.priority} />
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">
                      L1
                    </span>
                  </div>
                  {l1.description && (
                    <p className="mt-1 text-sm text-muted">{l1.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {l1.place && (
                      <Pill>
                        <PinIcon width={13} height={13} className="text-muted" />
                        {l1.place}
                      </Pill>
                    )}
                    {fmtDeadline(l1.deadline) && (
                      <Pill>Due {fmtDeadline(l1.deadline)}</Pill>
                    )}
                    <span className="text-[11px] text-muted">
                      {l1.children.length} workstream{l1.children.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </div>

              {/* L2 children */}
              {expanded && (
                <div className="border-t border-hairline bg-surface-2/50 px-4 py-3">
                  <div className="flex flex-col">
                    {l1.children.map((c) => (
                      <div
                        key={c.id}
                        className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface"
                      >
                        <span className="ml-2 h-1.5 w-1.5 rounded-full bg-hairline-strong" />
                        <span className="text-sm text-ink">{c.title}</span>
                        <PriorityTag priority={c.priority} />
                        {c.place && (
                          <span className="text-xs text-muted">· {c.place}</span>
                        )}
                        <button
                          onClick={() => removeWorkstream(l1.id, c.id)}
                          className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-muted opacity-0 transition hover:bg-high-soft hover:text-high-ink group-hover:opacity-100"
                          aria-label="Remove workstream"
                        >
                          <XIcon width={15} height={15} />
                        </button>
                      </div>
                    ))}
                    {l1.children.length === 0 && (
                      <div className="px-2 py-2 text-sm text-muted">No workstreams yet.</div>
                    )}
                  </div>

                  <AddWorkstream parentPlace={l1.place} onAdd={(d) => addWorkstream(l1.id, d)} />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------- inline forms ----------------------------- */

function AddInitiativeForm({
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
    <Card className="p-4">
      <div className="mb-3 text-sm font-semibold text-ink">New initiative</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
          <span className="text-[11px] font-medium text-muted">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldCls} placeholder="e.g. Sora Project" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted">Priority</span>
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={fieldCls}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted">Deadline</span>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={`${fieldCls} tnum`} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted">Default place</span>
          <select value={place} onChange={(e) => setPlace(e.target.value)} className={fieldCls}>
            {placeChoices.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={!title.trim()}
          onClick={() => onAdd({ title: title.trim(), priority, deadline: deadline || undefined, place })}
        >
          Add initiative
        </Button>
      </div>
    </Card>
  );
}

function AddWorkstream({
  parentPlace,
  onAdd,
}: {
  parentPlace: string;
  onAdd: (d: L2) => void;
}) {
  const [openForm, setOpenForm] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  if (!openForm) {
    return (
      <button
        onClick={() => setOpenForm(true)}
        className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-accent hover:bg-accent-soft"
      >
        <PlusIcon width={16} height={16} />
        Add workstream
      </button>
    );
  }

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ id: `n${seq++}`, title: title.trim(), priority, place: parentPlace });
    setTitle("");
    setPriority("medium");
    setOpenForm(false);
  };

  return (
    <div className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-hairline bg-surface p-3">
      <label className="flex min-w-[180px] flex-1 flex-col gap-1">
        <span className="text-[11px] font-medium text-muted">Workstream title</span>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className={fieldCls}
          placeholder="e.g. Site survey"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-medium text-muted">Priority</span>
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={fieldCls}>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </label>
      <Button variant="primary" onClick={submit} disabled={!title.trim()}>
        Add
      </Button>
      <Button variant="ghost" onClick={() => setOpenForm(false)}>
        Cancel
      </Button>
    </div>
  );
}
