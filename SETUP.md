# Setup — Vivo47 Portal Operativo

Everything here is free tier: Supabase (database + API) and GitHub Pages
(hosting) both have no-cost plans that comfortably cover a single gym's
member data. Total cost: $0/month.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → sign up (free) → **New project**.
2. Pick a name (e.g. `vivo47-portal`), a database password (save it somewhere — you likely won't need it again, but keep it), and a region close to Mexico (e.g. `us-west-1` or `us-east-1`).
3. Wait ~2 minutes for it to provision.
4. Open **SQL Editor** (left sidebar) → **New query** → paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) → **Run**.
   - This creates the `members` and `comments` tables and locks down the public API key to only the operations the portal needs (see the comments at the bottom of that file for exactly what it can and can't do).
5. Go to **Project Settings → API**. You'll need two values from here:
   - **Project URL** (e.g. `https://xxxxxxxx.supabase.co`)
   - **anon / public** key — goes in the frontend (safe to expose in client code)
   - **service_role** key — goes in the Apps Script only, **never** in the frontend. It bypasses all the access restrictions in `schema.sql`.

## 2. Connect the Google Form/Sheet sync

1. Open the response Sheet for your intake Google Form.
2. **Extensions → Apps Script**.
3. Delete the default `Code.gs` content and paste in [`apps-script/Code.gs`](./apps-script/Code.gs) instead.
4. Click the gear icon (**Project Settings**) → scroll to **Script Properties** → **Add script property** twice:
   - `SUPABASE_URL` → your Project URL from step 1
   - `SUPABASE_SERVICE_KEY` → the **service_role** key from step 1
5. Go back to the Sheet and reload it. A new menu **"Vivo47 Sync"** appears next to Extensions.
6. Click **Vivo47 Sync → Sincronizar ahora**. The first run will ask you to authorize the script (it needs to read the Sheet and call an external URL) — approve it. This does a one-time import of every existing row into Supabase.
7. Click **Vivo47 Sync → Activar sincronización automática** once. This installs two triggers:
   - Runs automatically every time the Form is submitted (new members appear in the portal right away).
   - Re-runs every 15 minutes, so if a coach fills in the evaluation columns (Enfoque, Categoría Riesgo, etc.) after the member submits the form, that gets picked up too.

If your Sheet's columns ever get reordered or new questions get inserted, update the `COL` mapping at the top of `apps-script/Code.gs` to match — it maps by column position, not by header text, since a few of your headers have typos/duplicates.

## 3. Run the frontend locally (optional, to test before deploying)

```bash
cd app
npm install
cp .env.example .env.local
# edit .env.local: paste your Project URL and anon key from step 1
npm run dev
```

Open the printed localhost URL — Concentrado should show your real members once the sync in step 2 has run.

## 4. Deploy to GitHub Pages

A workflow at `.github/workflows/deploy.yml` builds the app and publishes it
to GitHub Pages automatically on every push to `main`. You just need to
point it at your Supabase project and flip on Pages once:

1. Push this repo to GitHub (if it isn't already there).
2. **Settings → Secrets and variables → Actions → New repository secret**, add two:
   - `VITE_SUPABASE_URL` → your Project URL from step 1
   - `VITE_SUPABASE_ANON_KEY` → your anon key from step 1
   - (These get baked into the build. The anon key is meant to be public in a client-side app — see the note below — so this isn't protecting a secret, it's just the standard way to hand a build-time value to the workflow.)
3. **Settings → Pages** → under **Build and deployment → Source**, choose **GitHub Actions**.
4. Push to `main` (or go to the **Actions** tab and run "Deploy portal to GitHub Pages" manually via **Run workflow**).
5. Once the run finishes, the URL shows up in **Settings → Pages** — something like `https://<your-username>.github.io/<repo-name>/`.

Every subsequent push to `main` that touches `app/` redeploys automatically. No build step to run locally, no separate hosting account.

## Notes and tradeoffs

- **No login screen.** Anyone with the URL can open the portal, view all member data (including phone numbers and personal intake answers), and add comments. The database is locked down so that key can't delete data or touch intake fields, but it can still read everything and edit the operational fields (RP, member no., APP/SPORTLAB/KEEP GOING). If this becomes a concern, Supabase Auth (email/password or magic link) can be added later without restructuring anything — ask when you're ready.
- **"No. de Socio" is manual.** Since it comes from your CRM rather than the Form, it's an editable text field in the Concentrado table, not read-only as first sketched.
- **RP names are free text, not a fixed list.** There's no hardcoded roster of reps — the RP filter/comparison views are built from whatever names staff have typed in so far. Typing a new name in the Concentrado table's RP field adds that rep going forward.
- **"Exportar tabla"** in Concentrado downloads the currently filtered/sorted table as a CSV (the original mockup left this as a placeholder button; it's wired up for real here).
