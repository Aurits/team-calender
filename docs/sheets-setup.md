# Google Sheets backend — setup

Cadence can run on **PostgreSQL** (default) or on a **Google Sheet** as the single
source of truth, exactly as the system-design doc intends ("the team can always
open the Sheet to see the raw data"). The Sheet is driven by a small **Apps Script
Web App** bound to it — so no Google service-account keys or OAuth live in the
Next.js app. The server just POSTs to one URL with a shared secret.

```
Browser → Next.js /api/* → getBackend()
                            ├── postgres → Prisma
                            └── sheets   → fetch(Apps Script /exec) → the Sheet (People / Tasks / Entries tabs)
```

Switch backends with a single env var: `DATA_BACKEND=postgres | sheets`.

## One-time setup

1. **Create the Sheet.** New Google Sheet (any name, e.g. "Cadence"). This is the database.

2. **Add the script.** In the Sheet: **Extensions → Apps Script**. Delete the
   placeholder, paste the entire contents of [`apps-script/Code.gs`](../apps-script/Code.gs),
   and Save. Make sure the runtime is **V8** (the default).

3. **Set the shared secret.** In the Apps Script editor: **Project Settings (gear)
   → Script Properties → Add script property**:
   - Property: `SHARED_SECRET`
   - Value: a long random string (e.g. `openssl rand -hex 24`)

   Keep this value — the Next.js app needs the same one.

4. **Seed the tabs.** In the editor, select the function **`setupAndSeed`** in the
   toolbar dropdown and click **Run**. Authorize the script when prompted (it only
   touches this spreadsheet). It formats, creates, and fills the `People`, `Tasks`,
   and `Entries` tabs (10 people incl. Demo / PIN `0000`, the task tree, and ~a week
   of entries). Re-running it overwrites those tabs.

5. **Deploy as a Web App.** **Deploy → New deployment → ⚙ → Web app**:
   - Description: `Cadence backend`
   - Execute as: **Me**
   - Who has access: **Anyone**  *(safe — every request is checked against `SHARED_SECRET`)*

   Click **Deploy**, authorize, and copy the **Web app URL** (ends in `/exec`).

   > Visiting that URL in a browser should return `{"data":{"status":"cadence apps script up"}}`.

6. **Point Next.js at it.** In `.env`:

   ```bash
   DATA_BACKEND="sheets"
   SHEETS_WEBAPP_URL="https://script.google.com/macros/s/XXXXXXXX/exec"
   SHEETS_SHARED_SECRET="the-same-secret-from-step-3"
   ```

7. **Run the app.** `npm run dev`, sign in with PIN `0000` (Demo). Edits on the
   Capture and Manage pages now read and write straight to the Sheet — open the
   Sheet and watch the rows change.

## Switching back to Postgres

Set `DATA_BACKEND="postgres"` (or remove it) and keep `DATABASE_URL` set. No code change.

## Overview tab (daily snapshot)

The leftmost **Overview** tab (it reuses the spreadsheet's default `Sheet1`) is a
clean, human-readable snapshot of **today** — names and task titles, no `p2`/`t1`
ids: a hero banner, live stat chips (people / blocks / high-priority / meetings),
today's schedule (time, person, task, place, color-coded priority, details), and a
"where people are today" block. Rich-text notes are de-HTML'd here (so `<strike>…`
becomes clean text, and a fully struck note renders as a real strikethrough cell).

It's **presentation only** — the app never reads it — and it's **rebuilt after every
write** (`saveDay`, `saveTasks`) plus on `setupAndSeed`. "Today" follows the Apps
Script project time zone, so set it to your team's zone: **Project Settings → Time
zone** (e.g. `Asia/Tokyo`) so the snapshot matches the dates the app saves.

## Formatting

`setupAndSeed()` also styles the three data tabs so the raw Sheet is pleasant to read:
a dark header band (Montserrat), monospace IDs/dates/times, hidden gridlines with
zebra striping, comfortable row heights, color-coded **priority** cells
(high/medium/low), and highlighted **initiative** (level-1) titles. The styling is
applied with column-level formatting and *conditional formatting rules*, so it
survives every data write automatically. To re-apply the look without reseeding
(e.g. after manual edits), run **`formatAllSheets_`** from the editor.

## Updating the script later

After editing `Code.gs`: **Save** → re-run **`setupAndSeed`** (or `formatAllSheets_`)
→ **Deploy → Manage deployments → edit (✏) → Version: New version → Deploy**. Using
*New version* keeps the *same* `/exec` URL; a brand-new deployment gives a new URL.

> The live web app runs the code from its deployed *version*, so script changes that
> affect `doPost` (saves) only take effect after you publish a new version.

## Notes & limits

- **Latency:** each call is an HTTPS round-trip to Google (~0.3–1s). Fine for one team.
- **Quotas:** Apps Script has daily URL-fetch/execution quotas — generous for
  internal use. If you outgrow them, flip `DATA_BACKEND` back to `postgres`.
- **Concurrency & consistency:** writes (`saveDay`, `saveTasks`) take a script lock,
  and write rows in place then trim the leftovers (overwrite-then-trim), so the sheet
  is never momentarily empty — a concurrent read sees either the old or new full data.
- **Data shape:** `assignees` and `attendees` are stored as JSON text; `date`
  (YYYY-MM-DD), `start` (HH:MM), `deadline`, and `pin` columns are kept as plain text
  (so a pin like `0000` keeps its leading zeros).
