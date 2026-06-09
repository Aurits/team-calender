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
   touches this spreadsheet). It creates and fills the `People`, `Tasks`, and
   `Entries` tabs (10 people incl. Demo / PIN `0000`, the task tree, and ~a week of
   entries). Re-running it overwrites those tabs.

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

## Notes & limits

- **Updating the script later:** after editing `Code.gs`, do **Deploy → Manage
  deployments → edit (✏) → Version: New version → Deploy** to keep the *same* URL.
  Creating a brand-new deployment gives a new URL.
- **Latency:** each call is an HTTPS round-trip to Google (~0.3–1s). Fine for one team.
- **Quotas:** Apps Script has daily URL-fetch/execution quotas — generous for
  internal use. If you outgrow them, flip `DATA_BACKEND` back to `postgres`.
- **Concurrency:** writes (`saveDay`, `saveTasks`) take a script lock, so two
  people saving at once won't corrupt the tabs.
- **Data shape:** `assignees` and `attendees` are stored as JSON text in their
  cells; `date` (YYYY-MM-DD) and `start` (HH:MM) columns are kept as plain text.
