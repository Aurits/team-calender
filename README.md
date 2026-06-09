# Cadence — Team Schedule

One shared place that shows **who is doing what, where, when, and how important — for today.**

Cadence replaces the scattered picture across Google Docs / SharePoint / Microsoft
Loop with three simple pages backed by a single source of truth. Full background and
rationale live in [`docs/schedule-system-design.md`](docs/schedule-system-design.md).

## The three pages

| Route | Who | What |
| :--- | :--- | :--- |
| `/` | Members | **Capture** — PIN sign-in, then a fast row-list to record the day. Picking a task pre-fills place & priority; overlapping blocks are flagged. |
| `/calendar` | Everyone | **Overview** — a read-only team grid (people × time), colored by priority, with a live "now" line and shared daily anchors. |
| `/manage` | Managers | **Tasks** — build and order the initiative → workstream tree, set priorities/places/assignees. Autosaves. |

The one atom everywhere is a **time block** (`Entry`). A **meeting is just a block with
more than one attendee.** Priority and place inherit from the task down to the block.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · a **swappable data backend**.

## Architecture

The UI talks only to `/api/*` routes; those delegate to a single `Backend` interface,
so storage is a one-env-var swap:

```
Browser → Next.js /api/* → getBackend()
                            ├── postgres → Prisma            (DATA_BACKEND=postgres, default)
                            └── sheets   → Apps Script Web App → Google Sheet   (DATA_BACKEND=sheets)
```

- **Postgres** — fast local/hosted database via Prisma. Good for development.
- **Google Sheets** — the spec's intended source of truth ("the team can always open
  the Sheet to see the raw data"). Driven by an Apps Script Web App **bound to the Sheet**,
  so **no Google service-account keys or OAuth live in this app** — the server just POSTs
  to one URL with a shared secret. See [`docs/sheets-setup.md`](docs/sheets-setup.md).

Switch any time with `DATA_BACKEND=postgres|sheets`. Confirm which is live at
[`/api/health`](#which-backend-is-live) or via the small badge in the corner of the app.

## Getting started (Postgres)

1. **Install & configure.**
   ```bash
   npm install
   cp .env.example .env
   ```
   Set `DATA_BACKEND="postgres"` and `DATABASE_URL` in `.env`.

2. **Create the schema and seed demo data.**
   ```bash
   npm run db:push   # apply the Prisma schema
   npm run db:seed   # 10 people (Demo = PIN 0000), the task tree, ~a week of entries
   ```

3. **Run.**
   ```bash
   npm run dev
   ```
   Open <http://localhost:3000> and sign in with PIN **`0000`** (Demo User).

## Getting started (Google Sheets)

The code is ready; the Google side is a one-time manual setup (no credentials in this
repo). Follow [`docs/sheets-setup.md`](docs/sheets-setup.md): create a Sheet → paste
[`apps-script/Code.gs`](apps-script/Code.gs) → set a `SHARED_SECRET` → run
`setupAndSeed()` → deploy as a Web App → put the `/exec` URL + secret in `.env` and set
`DATA_BACKEND="sheets"`.

## Which backend is live

- A small pill in the bottom-right of the app shows **Postgres** or **Sheets** (red "offline" if the backend can't be reached).
- Or hit the endpoint directly:
  ```bash
  curl http://localhost:3000/api/health
  # {"backend":"postgres","ok":true,"people":10}
  ```

## Scripts

| Command | Does |
| :--- | :--- |
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Apply the Prisma schema to the database |
| `npm run db:seed` | Seed the database (Postgres) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset the database |

> The Sheets backend is seeded separately by running `setupAndSeed()` inside Apps Script.

## Project structure

```
src/
  app/
    page.tsx              Capture (/)
    calendar/page.tsx     Overview (/calendar)
    manage/page.tsx       Tasks (/manage)
    api/                  people · auth/pin · tasks · entries · days/[personId] · health
  components/
    ui.tsx                Shared UI kit
    BackendBadge.tsx      Live backend indicator
  lib/
    server/
      backend.ts          Backend interface + getBackend() env switch + tree helpers
      prisma-backend.ts   Postgres implementation
      sheets-backend.ts   Google Sheets implementation (calls the Apps Script)
    api.ts people.tsx tasks.ts data.ts types.ts serialize.ts session.ts theme.ts prisma.ts
apps-script/Code.gs       The Google Sheets Web App (doPost dispatch + setupAndSeed)
prisma/schema.prisma      Postgres schema
prisma/seeder.ts          Postgres seeder
docs/                     Design doc, brief, meeting notes, Sheets setup guide
```

## Data model

`Person` (PIN) → `Task` tree (L1 initiative / L2 workstream, self-referential) →
`Entry` (the time block). On the Sheets backend these are the three tabs
**People / Tasks / Entries**; `assignees` and `attendees` are stored as JSON text.

## Roadmap

Deferred by design for the alpha (see the design doc §11–12): Outlook/calendar sync,
AI auto-rescheduling, task carry-over, week/history/analytics views, and real
authentication (the PIN is identity, not security).
