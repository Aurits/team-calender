# Schedule System — Design (Alpha)

**Owner:** Ambrose · **Reviewer/Approver:** Inaba (management) · **Target rollout:** Mon 8 June 2026
**Status:** Draft for approval — *no build until approved.*

---

## 1. The core problem

All five problems in the brief are one problem:

> There is no single, trustworthy place that says **who is doing what, where, when, and how important** — for today.

So we don't build five features. We build **one source of truth and one view of it.** Anything that doesn't help *capture the truth* or *show the truth* is out of the alpha.

---

## 2. Problems → concrete demand → priority

| # | Problem (from brief) | Concrete demand | Priority |
|---|---|---|---|
| 1 | Don't know **where** people are | Every time block records a `place`; calendar shows location per person/time | **P0** |
| 2 | Don't know **what** people are doing | Every block records the task + optional sub-task; visible on calendar | **P0** |
| 3 | Schedules **change** suddenly | Blocks are editable; a person can move/replace a block in seconds | **P1** |
| 4 | **Priorities** unclear | Priority is set once at the task level and **cascades** to blocks (overridable) | **P0** |
| 5 | Tasks **not organized** | Management page holds the canonical task tree (the "organize first" surface) | **P0** |

*P0 = non-negotiable for 8 June. P1 = include if time allows; otherwise fast-follow.*

---

## 3. The model — three levels, one atom

```
L1  Initiative      "Ogasawara Project"        ← Management creates
 └ L2  Workstream     "Construction planning"    ← Management creates
     └ L3  Sub-task     "Draft site layout"       ← Member creates (optional, for granularity)
```

- **The scheduled time block IS the Level 3.** Creating an L3 = adding a block with your own description under an L2. Scheduling an L2 directly = a block whose description defaults to the L2's name. **One atom on the board either way.**
- **A meeting is the same atom shared by several people.** Not a separate concept.
- **Defaults cascade:** `priority` + `place` flow L1 → L2 → block, overridable at each step.
- **Creation rule per role:** management owns L1/L2; members optionally add L3. No approval queue.

**Entities (Google Sheets tabs):** `People` (PIN, name, role, default place) · `Tasks` (id, level, parentId, title, description, priority, deadline, defaultPlace) · `Entries` (id, person, taskId, description, date, start, duration, place, priority, attendees).

---

## 4. The three pages

| Page | Audience | Job |
|---|---|---|
| **1. Capture** (daily, ~30s) | Members | PIN → pick task (L2/L1 or own L3) → time + duration + place + priority → save |
| **2. Management** | Managers | Build the L1/L2 task tree; set priority, deadline, default place |
| **3. Overview / Calendar** | Everyone | People × time grid for the day; colored by priority, place labeled |

All three read/write the **same Sheet** — one source of truth, no sync.

Friction reducers on Capture: profile loads from PIN · priority + place pre-fill from the parent task · time/place **suggested from recent entries** · daily anchors (09:00 stand-up, 17:30 evening meeting) auto-filled.

---

## 5. Scope — the honest 30% vs the explained 70%

**In (8 June):** PIN login · Management page (L1+L2) · Capture page (with defaults/suggestions) · Calendar/Overview · meetings as multi-person blocks · edit/delete a block.

**Deferred (next sprints, on purpose):** Outlook/calendar sync · AI auto-rescheduling & time-blocking · automatic priority resolution · carry-over of unfinished tasks · analytics & week/history views · real authentication & private (HR/salary) data.

> The alpha covers the essential 30%. The 70% is deferred deliberately, not forgotten — listed above so expectations are clear.

---

## 6. Technical approach

- **Custom Next.js app** (not Apps Script) ↔ **Google Sheets API** as the data store.
- **PIN = lightweight login**, remembered per-device. Identity, not security. No passwords/accounts. No sensitive data in scope.
- Personal devices (each person on their own phone/laptop), manual meeting entry for alpha.

---

## 7. Principles we held to

**Simple** — one input form, one calendar, one task tree; granularity is opt-in.
**Consistent** — everything on the board is the same atom; defaults follow one cascade rule; one creation rule per role.
**Easy** — a member's whole day is "3 taps + a number," mostly defaults and suggestions.
