"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AssigneePicker,
  Avatar,
  Chevron,
  Grip,
  LoadingScreen,
  NoteArea,
  PageFrame,
  Pencil,
  Pin,
  Plus,
  PriorityTag,
  Select,
  Spinner,
  Trash,
} from "@/components/ui";
import { clearPerson, useRequirePerson } from "@/lib/session";
import { usePeople } from "@/lib/people";
import { placeChoices, priorityMeta } from "@/lib/data";
import { taskStore, type Initiative, type TaskNode } from "@/lib/tasks";
import type { Priority } from "@/lib/types";

const prioOpts = (["high", "medium", "low"] as const).map((p) => ({
  value: p,
  label: (
    <span className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${priorityMeta[p].dot}`} />
      {priorityMeta[p].label}
    </span>
  ),
}));
const placeOpts = placeChoices.map((p) => ({ value: p, label: p }));

const fmtDeadline = (iso?: string) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" }) : null;

type Fields = Omit<TaskNode, "id">;
const newId = () => "n" + Math.random().toString(36).slice(2, 9);

/* ----------------------------- small bits ------------------------------ */

function AvatarStack({ ids }: { ids: string[] }) {
  const { getPerson } = usePeople();
  if (!ids.length) return null;
  return (
    <div className="flex items-center -space-x-2">
      {ids.map((id) => {
        const p = getPerson(id);
        return p ? (
          <span key={id} className="rounded-full ring-2 ring-surface">
            <Avatar name={p.name} tint={p.tint} size="sm" />
          </span>
        ) : null;
      })}
    </div>
  );
}

function IconBtn({
  onClick,
  label,
  danger,
  children,
}: {
  onClick: (e: React.MouseEvent) => void;
  label: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors ${
        danger ? "hover:bg-high-soft hover:text-high-ink" : "hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/* ------------------------------- TaskForm ------------------------------ */

function TaskForm({
  initial,
  heading,
  submitLabel,
  defaultPlace,
  taken = [],
  onSubmit,
  onCancel,
}: {
  initial?: Partial<TaskNode>;
  heading: string;
  submitLabel: string;
  defaultPlace?: string;
  taken?: string[];
  onSubmit: (f: Fields) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [place, setPlace] = useState(initial?.place || defaultPlace || "Main Office");
  const [assignees, setAssignees] = useState<string[]>(initial?.assignees ?? []);
  const [description, setDescription] = useState(initial?.description ?? "");

  const dup = title.trim() !== "" && taken.includes(title.trim().toLowerCase());

  return (
    <div className="card p-4">
      <div className="mb-3 text-sm font-semibold text-ink">{heading}</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
          <span className="overline">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`field ${dup ? "border-high-line" : ""}`}
            placeholder="e.g. Sora Project"
          />
          {dup && <span className="text-[11px] text-high-ink">A task with this name already exists.</span>}
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="overline">Priority</span>
          <Select value={priority} onChange={(v) => setPriority(v as Priority)} options={prioOpts} />
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="overline">Deadline</span>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="field tnum" />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="overline">Place</span>
          <Select value={place} onChange={(v) => setPlace(v)} options={placeOpts} />
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        <span className="overline">Team</span>
        <AssigneePicker value={assignees} onChange={setAssignees} />
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        <span className="overline">Description</span>
        <NoteArea value={description} onChange={setDescription} bullets={false} placeholder="What is this about?" />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onCancel} className="btn btn-ghost">Cancel</button>
        <button
          disabled={!title.trim() || dup}
          onClick={() =>
            onSubmit({
              title: title.trim(),
              priority,
              deadline: deadline || undefined,
              place,
              assignees,
              description: description.trim() || undefined,
            })
          }
          className="btn btn-primary"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------- Page --------------------------------- */

export default function ManagePage() {
  const personId = useRequirePerson();
  const router = useRouter();
  const { getPerson } = usePeople();
  const [tree, setTree] = useState<Initiative[] | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({ t1: true });
  const [addingL1, setAddingL1] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [addingWs, setAddingWs] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [drag, setDrag] = useState<{ id: string; l1?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const skipSave = useRef(true);
  useEffect(() => {
    taskStore
      .load()
      .then((t) => {
        skipSave.current = true;
        setTree(t);
      })
      .catch(() => setTree([]));
  }, []);
  useEffect(() => {
    if (tree === null) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    setSaving(true);
    taskStore
      .save(tree)
      .catch((e) => console.error("Couldn't save tasks", e))
      .finally(() => setSaving(false));
  }, [tree]);

  if (!personId || tree === null) return <LoadingScreen label="Loading tasks…" />;
  const person = getPerson(personId);
  if (!person) return <LoadingScreen />;

  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const addInitiative = (f: Fields) => {
    setTree((t) => [...(t ?? []), { ...f, id: newId(), children: [] }]);
    setAddingL1(false);
  };
  const updateInitiative = (id: string, f: Fields) =>
    setTree((t) => (t ?? []).map((x) => (x.id === id ? { ...x, ...f } : x)));
  const deleteInitiative = (id: string) => setTree((t) => (t ?? []).filter((x) => x.id !== id));
  const addWorkstream = (l1: string, f: Fields) =>
    setTree((t) => (t ?? []).map((x) => (x.id === l1 ? { ...x, children: [...x.children, { ...f, id: newId() }] } : x)));
  const updateWorkstream = (l1: string, ws: string, f: Fields) =>
    setTree((t) =>
      (t ?? []).map((x) => (x.id === l1 ? { ...x, children: x.children.map((c) => (c.id === ws ? { ...c, ...f } : c)) } : x)),
    );
  const deleteWorkstream = (l1: string, ws: string) =>
    setTree((t) => (t ?? []).map((x) => (x.id === l1 ? { ...x, children: x.children.filter((c) => c.id !== ws) } : x)));
  const setAssignees = (id: string, v: string[]) =>
    setTree((t) => (t ?? []).map((x) => (x.id === id ? { ...x, assignees: v } : x)));

  const moveInitiative = (dragId: string, targetId: string) =>
    setTree((t) => {
      const list = t ?? [];
      const from = list.findIndex((x) => x.id === dragId);
      const to = list.findIndex((x) => x.id === targetId);
      if (from < 0 || to < 0 || from === to) return list;
      const next = [...list];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
  const moveWorkstream = (l1: string, dragId: string, targetId: string) =>
    setTree((t) =>
      (t ?? []).map((x) => {
        if (x.id !== l1) return x;
        const from = x.children.findIndex((c) => c.id === dragId);
        const to = x.children.findIndex((c) => c.id === targetId);
        if (from < 0 || to < 0 || from === to) return x;
        const next = [...x.children];
        const [m] = next.splice(from, 1);
        next.splice(to, 0, m);
        return { ...x, children: next };
      }),
    );

  const totalWs = tree.reduce((n, t) => n + t.children.length, 0);
  const q = query.trim().toLowerCase();
  const visible = q
    ? tree.filter(
        (l1) => l1.title.toLowerCase().includes(q) || l1.children.some((c) => c.title.toLowerCase().includes(q)),
      )
    : tree;
  const otherTitles = (exceptId?: string) =>
    tree.filter((x) => x.id !== exceptId).map((x) => x.title.toLowerCase());

  return (
    <PageFrame
      here="manage"
      wide
      overline="Task list"
      title="Tasks"
      subtitle="The team's task list. Drag to reorder; set priorities, places, and who's on each piece of work."
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
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-hairline bg-surface px-3 py-1 text-xs text-muted">
          {tree.length} initiatives
        </span>
        <span className="rounded-full border border-hairline bg-surface px-3 py-1 text-xs text-muted">
          {totalWs} workstreams
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="field ml-auto max-w-[220px]"
        />
      </div>

      {addingL1 && (
        <div className="mb-4">
          <TaskForm
            heading="New initiative"
            submitLabel="Add initiative"
            taken={otherTitles()}
            onSubmit={addInitiative}
            onCancel={() => setAddingL1(false)}
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {visible.map((l1) =>
          editing === l1.id ? (
            <TaskForm
              key={l1.id}
              heading="Edit initiative"
              submitLabel="Save"
              initial={l1}
              taken={otherTitles(l1.id)}
              onSubmit={(f) => {
                updateInitiative(l1.id, f);
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <div key={l1.id} className={`card ${drag?.id === l1.id ? "opacity-50" : ""}`}>
              {/* header (also the initiative drop target) */}
              <div
                onClick={() => toggle(l1.id)}
                onDragOver={(e) => {
                  if (drag && !drag.l1) e.preventDefault();
                }}
                onDrop={() => {
                  if (drag && !drag.l1) moveInitiative(drag.id, l1.id);
                  setDrag(null);
                }}
                className="group flex cursor-pointer select-none items-start gap-2 p-4"
              >
                <span
                  draggable={!query.trim()}
                  onDragStart={(e) => {
                    setDrag({ id: l1.id });
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", l1.id);
                  }}
                  onDragEnd={() => setDrag(null)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5 flex h-6 w-4 shrink-0 cursor-grab items-center justify-center text-hairline-2 transition-colors group-hover:text-muted active:cursor-grabbing"
                  aria-label="Drag to reorder"
                >
                  <Grip width={14} height={14} />
                </span>
                <span className="mt-0.5 flex h-6 w-5 shrink-0 items-center justify-center rounded-md text-muted">
                  <Chevron className={`transition-transform ${open[l1.id] ? "" : "-rotate-90"}`} width={16} height={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-semibold text-ink">{l1.title}</span>
                    <PriorityTag priority={l1.priority} />
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">L1</span>
                  </div>
                  {l1.description && (
                    <div className="mt-1 text-sm text-muted" dangerouslySetInnerHTML={{ __html: l1.description }} />
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ink-2">
                    {l1.place && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-hairline bg-surface px-2.5 py-1">
                        <Pin width={13} height={13} className="text-muted" />
                        {l1.place}
                      </span>
                    )}
                    {fmtDeadline(l1.deadline) && (
                      <span className="rounded-full border border-hairline bg-surface px-2.5 py-1">
                        Due {fmtDeadline(l1.deadline)}
                      </span>
                    )}
                    <span className="text-muted">
                      {l1.children.length} workstream{l1.children.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <AvatarStack ids={l1.assignees} />
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <IconBtn
                    label="Edit initiative"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(l1.id);
                    }}
                  >
                    <Pencil width={15} height={15} />
                  </IconBtn>
                  <IconBtn
                    label="Delete initiative"
                    danger
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete “${l1.title}” and its workstreams?`)) deleteInitiative(l1.id);
                    }}
                  >
                    <Trash width={15} height={15} />
                  </IconBtn>
                </div>
              </div>

              {/* expanded */}
              {open[l1.id] && (
                <div className="rounded-b-2xl border-t border-hairline bg-surface-2/60 px-4 py-3">
                  <div className="mb-3">
                    <div className="overline mb-1.5">Team</div>
                    <div className="max-w-xs">
                      <AssigneePicker value={l1.assignees} onChange={(v) => setAssignees(l1.id, v)} />
                    </div>
                  </div>

                  {l1.children.map((c) =>
                    editing === c.id ? (
                      <div key={c.id} className="mb-2">
                        <TaskForm
                          heading="Edit workstream"
                          submitLabel="Save"
                          initial={c}
                          defaultPlace={l1.place}
                          taken={l1.children.filter((x) => x.id !== c.id).map((x) => x.title.toLowerCase())}
                          onSubmit={(f) => {
                            updateWorkstream(l1.id, c.id, f);
                            setEditing(null);
                          }}
                          onCancel={() => setEditing(null)}
                        />
                      </div>
                    ) : (
                      <div
                        key={c.id}
                        onDragOver={(e) => {
                          if (drag?.l1 === l1.id) e.preventDefault();
                        }}
                        onDrop={() => {
                          if (drag?.l1 === l1.id) moveWorkstream(l1.id, drag.id, c.id);
                          setDrag(null);
                        }}
                        className={`group rounded-lg px-2 py-2 hover:bg-surface ${drag?.id === c.id ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            draggable={!query.trim()}
                            onDragStart={(e) => {
                              setDrag({ id: c.id, l1: l1.id });
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("text/plain", c.id);
                            }}
                            onDragEnd={() => setDrag(null)}
                            className="flex h-6 w-4 shrink-0 cursor-grab items-center justify-center text-hairline-2 transition-colors group-hover:text-muted active:cursor-grabbing"
                            aria-label="Drag to reorder"
                          >
                            <Grip width={13} height={13} />
                          </span>
                          <span className="text-sm text-ink">{c.title}</span>
                          <PriorityTag priority={c.priority} />
                          {c.place && <span className="text-xs text-muted">· {c.place}</span>}
                          {fmtDeadline(c.deadline) && (
                            <span className="text-xs text-muted">· Due {fmtDeadline(c.deadline)}</span>
                          )}
                          <AvatarStack ids={c.assignees} />
                          <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <IconBtn label="Edit workstream" onClick={() => setEditing(c.id)}>
                              <Pencil width={14} height={14} />
                            </IconBtn>
                            <IconBtn
                              label="Delete workstream"
                              danger
                              onClick={() => {
                                if (window.confirm(`Delete “${c.title}”?`)) deleteWorkstream(l1.id, c.id);
                              }}
                            >
                              <Trash width={14} height={14} />
                            </IconBtn>
                          </div>
                        </div>
                        {c.description && (
                          <div
                            className="ml-8 mt-1 text-xs text-muted"
                            dangerouslySetInnerHTML={{ __html: c.description }}
                          />
                        )}
                      </div>
                    ),
                  )}
                  {l1.children.length === 0 && (
                    <div className="px-2 py-2 text-sm text-muted">No workstreams yet.</div>
                  )}

                  {addingWs === l1.id ? (
                    <div className="mt-2">
                      <TaskForm
                        heading="New workstream"
                        submitLabel="Add workstream"
                        defaultPlace={l1.place}
                        taken={l1.children.map((x) => x.title.toLowerCase())}
                        onSubmit={(f) => {
                          addWorkstream(l1.id, f);
                          setAddingWs(null);
                        }}
                        onCancel={() => setAddingWs(null)}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingWs(l1.id)}
                      className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-accent-hover hover:bg-accent-soft"
                    >
                      <Plus width={16} height={16} /> Add workstream
                    </button>
                  )}
                </div>
              )}
            </div>
          ),
        )}
      </div>

      {visible.length === 0 && (
        <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
          <div className="text-sm font-medium text-ink">
            {tree.length === 0 ? "No initiatives yet" : `No initiatives match “${query}”`}
          </div>
          <p className="max-w-sm text-sm text-muted">
            {tree.length === 0
              ? "Create your first initiative to start organizing the team's work."
              : "Try a different search."}
          </p>
          {tree.length === 0 && (
            <button onClick={() => setAddingL1(true)} className="btn btn-primary mt-2">
              <Plus width={16} height={16} /> New initiative
            </button>
          )}
        </div>
      )}
    </PageFrame>
  );
}
