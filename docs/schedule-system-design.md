# Schedule System
### System Design Document (Alpha Version)

|              |                                            |
| :----------- | :----------------------------------------- |
| **Owner**    | Ambrose (builder)                          |
| **Approver** | Inaba / Management                         |
| **Target**   | Monday, 8 June 2026 (first day in use)     |
| **Status**   | Draft for approval. No build until approved. |
| **Version**  | 1.0                                        |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Where We Are Today](#2-where-we-are-today)
3. [The Core Problem](#3-the-core-problem)
4. [Goals and Non-Goals](#4-goals-and-non-goals)
5. [Problems, Demands, and Priorities](#5-problems-demands-and-priorities)
6. [How the System Thinks: The Model](#6-how-the-system-thinks-the-model)
7. [Who Does What: Roles](#7-who-does-what-roles)
8. [The Three Pages](#8-the-three-pages)
9. [Data Model](#9-data-model)
10. [Technical Architecture](#10-technical-architecture)
11. [Scope for the Alpha](#11-scope-for-the-alpha)
12. [Future Modifications and Roadmap](#12-future-modifications-and-roadmap)
13. [Rollout Plan](#13-rollout-plan)
14. [Risks and How We Handle Them](#14-risks-and-how-we-handle-them)
15. [Design Principles](#15-design-principles)

---

## 1. Executive Summary

The team's daily information lives in too many places (Google Docs, SharePoint, Microsoft Loop), and none of them is reliably maintained. As a result, management cannot easily see where people are or what they are doing, and members struggle with shifting schedules and unclear priorities.

This system replaces that scattered picture with **one shared place that shows who is doing what, where, when, and how important it is, for today.**

It is built as three simple pages backed by a single Google Sheet:

```
   CAPTURE              MANAGEMENT             OVERVIEW
 (members add        (managers define       (everyone sees
  their day)          the task list)         the calendar)
      \                    |                     /
       \                   |                    /
        \________  Google Sheet  ___________/
                 (one source of truth)
```

The promise to each person is small: about **30 seconds a day** to record their plan. The promise to management is large: a single screen that answers every "where" and "what" question at a glance.

---

## 2. Where We Are Today

Today the same information is spread across three tools, each with a gap:

```
  Google Docs            SharePoint              Microsoft Loop
 (Individual tasks)     (June Initiative)        (Tasks of the day)
        |                     |                        |
  not maintained,      dashboards exist but      check system is
  done tasks not       workstreams are not       weak, easy to
  removed              organized                 lose track
```

Nothing here is wrong on its own. The problem is that no single view brings them together, so the truth about "today" has to be reconstructed by hand, every day, by every person who needs it.

---

## 3. The Core Problem

The brief lists five problems. They look separate, but they share one root:

> **There is no single, trustworthy place that shows who is doing what, where, when, and how important it is, for today.**

This reframing is the most important decision in the whole document, because it keeps the system small. We are not building five features. We are building **one source of truth and one way to see it.** Any idea that does not help us *capture the truth* or *show the truth* stays out of the first version.

---

## 4. Goals and Non-Goals

| Goals (what we are solving)                              | Non-Goals (not now, on purpose)                       |
| :------------------------------------------------------ | :---------------------------------------------------- |
| Show where each person is, per day                      | Track real location automatically (no GPS)            |
| Show what each person is working on                     | Prove that work was actually done                     |
| Make priorities visible and consistent                  | Let software decide priorities for humans             |
| Give management one clear daily view                    | Replace the existing tools that serve other purposes  |
| Make daily input fast (about 30 seconds)                | Build a heavy, complex platform                       |

---

## 5. Problems, Demands, and Priorities

For each problem in the brief, here is the concrete thing the system will do, and how important it is for the first version.

| #  | Problem                          | Concrete demand the system meets                                            | Priority |
| :- | :------------------------------- | :-------------------------------------------------------------------------- | :------: |
| 1  | Don't know **where** people are  | Every time block records a place. The calendar shows location per person.   | **P0**   |
| 2  | Don't know **what** people do    | Every block records its task and an optional sub-task, shown on the calendar.| **P0**   |
| 3  | Schedules **change** suddenly    | Blocks can be edited, moved, or replaced in seconds.                         | **P1**   |
| 4  | **Priorities** are unclear       | Priority is set once on the task and flows down to every block.             | **P0**   |
| 5  | Tasks are **not organized**      | The Management page holds the one official task list to organize first.      | **P0**   |

> **P0** means non-negotiable for 8 June. **P1** means include if time allows, otherwise it follows shortly after.

---

## 6. How the System Thinks: The Model

### 6.1 Three levels of a task

Work is described at up to three levels. Each level has a clear owner.

```
  LEVEL 1   Initiative          "Ogasawara Project"
   (big task)                    set by Management
      |
      +--> LEVEL 2   Workstream   "Construction Planning"
            (breakdown)            set by Management
               |
               +--> LEVEL 3   Sub-task   "Draft the site layout"
                     (detail)            added by a Member, only if they want
```

A member who wants detail creates their own Level 3. A member who does not need detail simply picks an existing Level 2 and schedules it. **Detail is optional, never forced.**

### 6.2 One atom on the board

Everything that appears on the calendar is the same single thing: a **time block.**

```
  +-------------------------------------------+
  |  TIME BLOCK  (the one atom)               |
  |                                           |
  |  Person    : Kevin                        |
  |  Task      : Construction Planning (L2)   |
  |  Note      : Draft the site layout (L3)   |
  |  When      : 10:00, 2 hours               |
  |  Where     : Izumi                        |
  |  Priority  : High                         |
  +-------------------------------------------+
```

A **meeting** is not a new idea. It is simply one time block shared by several people.

```
  Solo work  =  one block, one person
  Meeting    =  one block, several people
```

This is what keeps the system consistent: there is only one kind of thing to learn.

### 6.3 Defaults flow downhill

To save typing, **priority and place are inherited** from the parent task. You can always override them for a single block.

```
  L1 Initiative      priority: High     place: Izumi
        |   (inherit)
        v
  L2 Workstream      priority: High     place: Izumi
        |   (inherit)
        v
  Time block         priority: High     place: Izumi
                     (member can change either one if needed)
```

---

## 7. Who Does What: Roles

```
  MANAGEMENT                         MEMBERS
  ----------                         -------
  Create Level 1 initiatives         Pick a task to work on
  Create Level 2 workstreams         (optionally) add a Level 3 detail
  Set priority and deadlines         Add a time block (when, where)
  Organize the task list             Edit their block when plans change

         \                                /
          \                              /
           Everyone reads the Calendar view
```

The rule is clean: **management defines the work, members schedule the work, and everyone sees the result.** There is no overlap and no confusion about who owns what.

---

## 8. The Three Pages

### 8.1 System map

```
   1. CAPTURE  ----writes time blocks---->  Google Sheet
      (members)                                  |
                                                 |
   2. MANAGEMENT  --writes task list-------->    |
      (managers)                                 |
                                                 v
   3. OVERVIEW / CALENDAR  <----reads-------  Google Sheet
      (everyone)
```

All three pages share one Google Sheet, so there is nothing to sync and never two versions of the truth.

### 8.2 Page 1: Capture (members, daily, about 30 seconds)

The everyday page. It works like a simple spreadsheet row list (the same feel as ClickUp). Each row is one time block, and a person can add several rows for the day in a few seconds. The PIN is entered once and remembered on the device, so the page opens already signed in.

```
  +------------------------------------------------------------------------------------+
  |  CAPTURE     Signed in as Kevin (PIN remembered)        Date: Thu 4 Jun     [ + ]  |
  +------------------------------------------------------------------------------------+
  |  Task                  | Detail (optional)   | Start | Dur | Place  | Priority |    |
  |------------------------|---------------------|-------|-----|--------|----------|----|
  |  Construction Plan.  v | Draft site layout   | 10:00 | 2h  | Izumi  | High   v |  x |
  |  Documentation       v | Update game docs    | 13:00 | 1h  | Main   | Medium v |  x |
  |  Ogasawara Prep      v | Pack equipment      | 14:30 | 2h  | Izumi  | High   v |  x |
  |  + Add row ...                                                                      |
  +------------------------------------------------------------------------------------+
  |  Auto-added:  09:00 Stand-up      17:30 Evening meeting            [  Save day  ]   |
  +------------------------------------------------------------------------------------+
```

Why a horizontal row list:
- A person sees their whole day on one line each, and can list three or more blocks at a glance.
- Adding a block is one new row, not a new screen. This is what keeps it close to 30 seconds.
- It reads like the calendar it feeds, so there is nothing new to learn.

Helpers that make it fast:
- The PIN loads the person's profile, so they never retype their name or role.
- Choosing a task in a row pre-fills that row's place and priority (shown in grey until changed).
- Start time and place are suggested from the person's recent entries.
- The daily anchors (09:00 stand-up and 17:30 evening meeting) are filled in automatically, so nobody types them.

### 8.3 Page 2: Management (managers)

The page where the official task list is built and kept in order.

```
  +-----------------------------------------------+
  |  MANAGEMENT: Task List              [ + New ] |
  |-----------------------------------------------|
  |  v Ogasawara Project        High   due 30 Jun |
  |       - Construction Planning   High          |
  |       - Documentation           Medium        |
  |  v June Initiative          High   due 15 Jun |
  |       - Dashboard setup         Medium        |
  |       - Data migration          Low           |
  |                                               |
  |  [ Edit ]  [ Set priority ]  [ Set place ]    |
  +-----------------------------------------------+
```

This is the "organize first" surface that the meeting insisted on. It is also where priorities are decided in one place, which is exactly management's stated job.

### 8.4 Page 3: Overview / Calendar (everyone)

The screen that answers every question at a glance: a grid of people across time for the day, colored by priority, with the place shown.

```
  +---------------------------------------------------------------+
  |  CALENDAR  -  Thursday, 4 June            [ < ]  Today  [ > ] |
  |---------------------------------------------------------------|
  |        | 09:00 | 10:00 | 11:00 | 12:00 | ... | 17:30          |
  |--------|-------|-------|-------|-------|-----|----------------|
  | Kevin  | Stand | [== Construction ==]  | ... | Evening mtg    |
  |        |  -up  |  (High, Izumi)        |     |                |
  |--------|-------|-----------------------|-----|----------------|
  | Martin | Stand | [= Docs =] (Med, HQ)  | ... | Evening mtg    |
  |--------|-------|-----------------------|-----|----------------|
  | Ambrose| Stand | [==== Ogasawara ====] | ... | Evening mtg    |
  +---------------------------------------------------------------+
     Legend:  High = red   Medium = amber   Low = grey
```

From this one screen: where everyone is, what they are doing, what is high priority, and who shares a meeting.

---

## 9. Data Model

The whole system uses three tabs in one Google Sheet. Simple, and visible to the team by design.

### 9.1 How the tabs relate

```
   PEOPLE  ----referenced by----+
                                |
   TASKS (self-linked tree) ----+----> ENTRIES (the time blocks)
     L1 -> L2 -> L3                       on the calendar
```

### 9.2 People

| Field        | Example         | Notes                          |
| :----------- | :-------------- | :----------------------------- |
| pin          | 4821            | 4 digits, used to sign in      |
| name         | Kevin           |                                |
| role         | Engineer        |                                |
| defaultPlace | Main Office     | suggested when scheduling      |

### 9.3 Tasks (the L1 / L2 tree)

| Field        | Example                | Notes                              |
| :----------- | :--------------------- | :--------------------------------- |
| id           | T-12                   |                                    |
| level        | 1 or 2                 | who owns it: management            |
| parentId     | T-04                   | empty for Level 1                  |
| title        | Construction Planning  |                                    |
| description  | ...                    |                                    |
| priority     | High                   | flows down to blocks               |
| deadline     | 2026-06-30             |                                    |
| defaultPlace | Izumi                  | flows down to blocks               |

### 9.4 Entries (the time blocks, including meetings)

| Field       | Example               | Notes                                  |
| :---------- | :-------------------- | :------------------------------------- |
| id          | E-330                 |                                        |
| person      | Kevin                 | from PIN                               |
| taskId      | T-12                  | the L1 or L2 it belongs to             |
| description | Draft the site layout | optional Level 3 detail                |
| date        | 2026-06-04            |                                        |
| start       | 10:00                 |                                        |
| duration    | 2h                    |                                        |
| place       | Izumi                 | default from task, overridable         |
| priority    | High                  | default from task, overridable         |
| attendees   | Kevin, Andra          | more than one name means a meeting     |

---

## 10. Technical Architecture

A custom Next.js application talks directly to Google Sheets. There is no separate database to run, and the team can always open the Sheet to see the raw data.

```
   Member / Manager
     (phone or laptop)
          |
          v
   +-----------------------+        +------------------------+
   |   Next.js App          | <----> |   Google Sheets API    |
   |   - 3 pages            |  read  |   - People             |
   |   - PIN sign-in       |  write |   - Tasks              |
   |   - defaults & hints  |        |   - Entries            |
   +-----------------------+        +------------------------+
                                     (single source of truth)
```

Key choices and the reason for each:

| Choice                         | Reason                                                          |
| :----------------------------- | :------------------------------------------------------------- |
| Next.js instead of Apps Script | The builder is comfortable with it and it is more flexible.    |
| Google Sheets as the database  | Fastest to ship, and the data stays visible to the whole team. |
| PIN as a lightweight sign-in   | Identifies the person quickly. It is identity, not security.   |
| Personal devices               | Each person uses their own phone or laptop, no shared kiosk.   |
| Manual meeting entry           | Keeps the first version simple. Calendar sync comes later.     |

---

## 11. Scope for the Alpha

We are honest about covering the essential part now and explaining the rest. As the meeting put it: cover the essential 30 percent well, and clearly state the remaining 70 percent so expectations are set.

```
  IN  (ready for 8 June)              DEFERRED (next sprints, on purpose)
  ---------------------              -----------------------------------
  PIN sign-in                         Outlook / calendar sync
  Management page (L1 + L2)           AI auto-scheduling and time-blocking
  Capture page (defaults + hints)     Automatic priority resolution
  Calendar / Overview                 Carry-over of unfinished tasks
  Meetings as shared blocks           Reports, weekly and history views
  Edit and delete a block             Real authentication and private data
```

The deferred list is written down so nothing feels forgotten. It is a plan, not an oversight. Each item is discussed in the next section.

---

## 12. Future Modifications and Roadmap

The alpha is built so these additions slot in later without redesigning anything. Each one below explains what it adds, why it waits, and why it stays feasible.

### 12.1 Outlook and calendar sync

Today meetings are typed in by hand. A later version can connect to Microsoft Outlook (or Google Calendar) so meetings appear automatically as time blocks.

- **Adds:** less manual entry and fewer missed meetings.
- **Why it waits:** real account-by-account integration, sign-in, and handling changes or cancellations add risk to the 8 June date.
- **Why it stays feasible:** a meeting is already modeled as an ordinary time block, so a synced meeting drops straight into the existing structure with no change to the model.

### 12.2 Auto-rescheduling and AI time-blocking

When a plan changes (for example an urgent meeting appears), the system could shift the affected blocks and propose a new plan, similar to apps like Motion. It could also suggest an order when tasks compete for the same time.

- **Adds:** the schedule repairs itself instead of being fixed by hand.
- **Why it waits:** this only helps once tasks are well organized and priorities are reliable. As the meeting stressed, intelligence on top of disorganized data makes things worse, not better.
- **Why it stays feasible:** the data captured now (task, priority, time, place) is exactly the input such a feature needs.

### 12.3 Carry-over of unfinished tasks

If a block is not finished, the system could offer to move it to the next day so nothing is silently dropped.

- **Adds:** unfinished work is never lost between days.
- **Why it waits:** small enough that it is likely a fast follow soon after launch rather than a far-future item.
- **Why it stays feasible:** it is a simple rule on existing entries (mark done or not done, then copy forward).

### 12.4 Analytics, week and history views

The alpha shows one day. Later we can add a week view, history, and simple reports, for example how much time went to each initiative, or where a person spent the week.

- **Adds:** insight and trends on top of the daily picture.
- **Why it waits:** it is read-only insight, valuable but not needed to make today visible.
- **Why it stays feasible:** all of this is already stored in the Entries tab, so these views are just different ways of reading existing data, not new data to capture.

### 12.5 Real authentication and privacy

The PIN is a lightweight sign-in, good for an internal team, but it is identity, not security. A later version can add proper accounts (for example company sign-on) and private fields if the system ever holds sensitive data such as HR or salary information.

- **Adds:** stronger access control and the ability to hold private data safely.
- **Why it waits:** not needed for an internal scheduling tool today, and it adds setup overhead.
- **Why it stays feasible:** the app can adopt a standard sign-in provider without changing the data model.

### Suggested order

```
  Soon after launch        Later                       When the need appears
  -----------------        -----                       ---------------------
  Carry-over of tasks      Week and history views      Outlook / calendar sync
                           Analytics and reports       Real authentication
                                                       AI auto-rescheduling
```

---

## 13. Rollout Plan

```
  Fri 5 Jun     Design approved by management
       |
  Fri - Sun     Build: Sheet setup, Capture page, Management page, Calendar
       |
  Mon 8 Jun     Go live. Short walkthrough for the team.
       |
  Week of 8th   Watch real use, fix friction, then start the deferred items
```

A new system only works if people actually use it. So go-live includes a short, clear explanation of why the first version does only what it does. That protects the team from confusion and protects the system from being abandoned.

---

## 14. Risks and How We Handle Them

| Risk                                         | How we handle it                                                  |
| :------------------------------------------- | :---------------------------------------------------------------- |
| People find it more work than the old way    | Keep daily input near 30 seconds with defaults and suggestions.   |
| The system is built but not adopted          | Explain it clearly at launch and keep it genuinely simple.        |
| Tasks are still disorganized underneath      | Management organizes the task list first, before anything else.   |
| Google Sheets limits (speed, many editors)   | Fine for one team now. Move to a real database later if needed.   |
| Trying to add intelligence too early         | Organize manually first. AI only helps once things are in order.  |

---

## 15. Design Principles

Three ideas guided every decision above.

> **Simple.** One input form, one calendar, one task list. Extra detail is opt-in. To add anything, we should be ready to remove something.

> **Consistent.** Everything on the board is the same time block. Meetings are just shared blocks. Priority and place follow one rule everywhere.

> **Easy.** A member's whole day is a few taps and a number. The system does the remembering, not the person.

---

*End of document. Prepared for management review ahead of the 8 June rollout.*
