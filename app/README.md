# Vivo47 — Portal operativo

React + TypeScript + Vite frontend for the Vivo47 Center internal operations
portal. Talks directly to Supabase (Postgres + auto REST API) — no custom
backend to run or host.

See `../SETUP.md` at the repo root for full setup: creating the Supabase
project, running the schema, configuring the Google Apps Script sync, and
deploying to Vercel.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

## Structure

- `src/screens/` — the 3 screens: `Concentrado.tsx`, `VistaRp.tsx`, `VistaSocio.tsx`
- `src/hooks/` — `useMembers` (list + live updates + mutations), `useComments`
- `src/lib/` — Supabase client, shared types, style/color helpers ported from the design
- `src/components/TopNav.tsx` — the 3-tab header
