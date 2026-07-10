-- Vivo47 Portal Operativo — Supabase schema
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).

create extension if not exists "pgcrypto";

-- =========================================================================
-- members
-- One row per gym member. Intake fields (objetivo..momentos, evaluation
-- scores, risk) are populated by the Google Apps Script sync from the
-- Form response Sheet and are treated as read-only from the portal.
-- Operational fields (member_no, rp, app_downloaded, sportlab, keepgoing)
-- are entered/edited by staff directly in the portal.
-- =========================================================================
create table if not exists members (
  id uuid primary key default gen_random_uuid(),

  -- dedupe key: the Sheet's "Marca temporal" (submission timestamp) as text,
  -- used by the Apps Script sync to upsert without creating duplicates.
  marca_temporal text unique,

  -- form-derived identity fields
  name text not null,
  gender text,
  age int,
  phone text,
  alta_date date,

  -- operational fields — managed by staff in the portal, not from the Form
  member_no text,
  rp text,
  app_downloaded boolean not null default false,
  sportlab boolean not null default false,
  keepgoing boolean not null default false,

  -- intake Q&A (from Form)
  objetivo text,
  meta90 text,
  relacion text,
  dias text,
  condicion_perc text,
  mejorar text,
  abandono text,
  ayudaria text,
  confianza int,
  nota_futuro text,
  momentos text,

  -- evaluation scores (from Sheet's computed columns)
  enfoque_label text,
  enfoque_score int,
  adherencia_score int,
  frecuencia_score int,
  condicion_score int,
  condicion_level text,
  abandono_score int,
  nivel_general_label text,

  -- canonical risk used across all 3 screens ('Alto' | 'Medio' | 'Bajo')
  risk text,

  -- seed note captured at intake time (Sheet's "Comentarios" column);
  -- shown as the first entry in the member's staff comment history.
  intake_comment text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists members_rp_idx on members (rp);
create index if not exists members_risk_idx on members (risk);
create index if not exists members_name_idx on members (lower(name));

-- =========================================================================
-- comments
-- Staff comment history, shown on the Vista Socio screen. Seeded rows from
-- intake_comment are NOT duplicated here — they render from members
-- directly; this table only holds comments added after intake.
-- =========================================================================
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  staff text not null,
  comment_date text not null,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_member_id_idx on comments (member_id);

-- =========================================================================
-- updated_at trigger
-- =========================================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists members_set_updated_at on members;
create trigger members_set_updated_at
  before update on members
  for each row execute function set_updated_at();

-- =========================================================================
-- Row Level Security
--
-- No auth in this delivery — the portal talks to Supabase with the public
-- anon key. To limit blast radius given real member PII (phone numbers,
-- personal notes), the anon role is scoped as tightly as RLS + column
-- grants allow:
--   - members: anon can SELECT everything, but can only UPDATE the
--     operational columns (member_no, rp, app_downloaded, sportlab,
--     keepgoing). No INSERT/DELETE — those are Apps Script's job via the
--     service_role key, which bypasses RLS entirely.
--   - comments: anon can SELECT and INSERT (adding a staff note), no
--     UPDATE/DELETE.
--
-- This is a mitigation, not real security: the anon key is public by
-- design in a client-side app, so anyone with the portal URL can still
-- read member data and add comments. Add Supabase Auth when you're ready
-- to restrict this to actual staff logins.
-- =========================================================================
alter table members enable row level security;
alter table comments enable row level security;

drop policy if exists members_select_anon on members;
create policy members_select_anon on members for select to anon using (true);

drop policy if exists members_update_anon on members;
create policy members_update_anon on members for update to anon using (true) with check (true);

revoke update on members from anon;
grant update (member_no, rp, app_downloaded, sportlab, keepgoing) on members to anon;
grant select on members to anon;

drop policy if exists comments_select_anon on comments;
create policy comments_select_anon on comments for select to anon using (true);

drop policy if exists comments_insert_anon on comments;
create policy comments_insert_anon on comments for insert to anon with check (true);

grant select, insert on comments to anon;
