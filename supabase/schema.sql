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
  -- distinct from `rp` (who sold the membership): the coach/account exec who
  -- follows up with the member post-sale, assigned from Portal Admin once the
  -- Form response lands in Concentrado · Socios.
  ejecutivo text,
  app_downloaded boolean not null default false,
  sportlab boolean not null default false,
  keepgoing boolean not null default false,
  performance_day boolean not null default false,

  -- true once staff has reviewed a newly-synced intake row in Concentrado.
  -- Defaults to false so every new Form submission shows up as "Pendiente";
  -- intentionally left out of the Apps Script upsert payload so re-syncs
  -- (e.g. the 15-min evaluation-column pass) never reset it back to false.
  reviewed boolean not null default false,

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

-- safe to re-run against an already-deployed table (e.g. adding `reviewed`
-- to a database created before this column existed)
alter table members add column if not exists reviewed boolean not null default false;
alter table members add column if not exists ejecutivo text;
alter table members add column if not exists performance_day boolean not null default false;

create index if not exists members_rp_idx on members (rp);
create index if not exists members_risk_idx on members (risk);
create index if not exists members_name_idx on members (lower(name));
create index if not exists members_alta_date_idx on members (alta_date);

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
-- leads
-- Sales pipeline for prospects who have not yet become a member — this IS
-- the RP's workspace (Concentrado · Leads column on the home page), not a
-- separate capture portal. Mirrors the "Center <mes>" tabs of the team's
-- Prospectos Center spreadsheet, including tracking APP downloaded at the
-- lead stage. Once a lead closes (status = '100% Venta') and Portal Admin
-- assigns a member_no to the matching members row (created separately by
-- the Google Form intake sync), the two are linked via member_id — at
-- that point app_downloaded is pulled from the lead onto the member.
--
-- `status` is free text rather than an enum so new pipeline stages can be
-- added without a migration. Canonical values in use today (see
-- app/src/lib/leadStatus.ts for the authoritative list):
--   Nuevo, 10% Contactado, 20% Contactado con respuesta, 50% Cita,
--   50% Reprogramar cita, 60% Tour/Precio, 80% Por confirmar, 100% Venta,
--   0% No le interesa, Nunca contestó, No existe, Llamar después,
--   Pase invitado Easy Fit, Tiene total pass, Lead de renovación
-- =========================================================================
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),

  fecha_asignacion date not null default current_date,
  estrategia text,
  promocion text,
  rp text,
  nombre text not null,
  telefono text,
  correo text,
  comentarios text,

  status text not null default 'Nuevo',
  tour boolean not null default false,
  fecha_cita date,
  app_downloaded boolean not null default false,
  plan text,
  tipo_alta text,
  monto_sin_iva numeric(10, 2),
  monto_con_iva numeric(10, 2),

  fecha_cierre date,
  member_id uuid references members(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- safe to re-run against an already-deployed table
alter table leads add column if not exists app_downloaded boolean not null default false;
alter table leads add column if not exists promocion text;
alter table leads add column if not exists plan text;
alter table leads add column if not exists tipo_alta text;
alter table leads add column if not exists monto_sin_iva numeric(10, 2);
alter table leads add column if not exists monto_con_iva numeric(10, 2);

create index if not exists leads_rp_idx on leads (rp);
create index if not exists leads_status_idx on leads (status);
create index if not exists leads_fecha_asignacion_idx on leads (fecha_asignacion);

-- =========================================================================
-- rps / promotions
-- Managed option lists for the Leads Pizarra's RP and Promoción selects — staff
-- add new values from the portal ("+ dar de alta") instead of a developer
-- editing code, so everyone sees the same shared list in real time.
-- =========================================================================
create table if not exists rps (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  color text not null,
  created_at timestamptz not null default now()
);

insert into rps (name) values ('Marce'), ('Rodo')
on conflict (name) do nothing;

insert into promotions (label, color) values
  ('50% Daypass', '#B42318'),
  ('Otro', '#C4791A'),
  ('Anualidad -$2000', '#946200'),
  ('Mensaje masivo', '#15803D'),
  ('Copy write ventas corp', '#0891B2'),
  ('Copy write ciudadela', '#1D4ED8'),
  ('Copy write reactivación', '#9D174D'),
  ('Copy write crm', '#4D7C0F')
on conflict (label) do nothing;

-- =========================================================================
-- lead_goals
-- Editable monthly targets shown at the top of Concentrado · Leads. Goals
-- change often, so they're a simple editable number per RP per month
-- (rp = '' holds the "General" / team-wide goal — NOT null, since null
-- wouldn't collide with itself under the unique(month, rp) constraint).
-- =========================================================================
create table if not exists lead_goals (
  id uuid primary key default gen_random_uuid(),
  month text not null, -- 'YYYY-MM'
  rp text not null default '', -- '' = meta general del equipo
  meta_altas int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (month, rp)
);

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

drop trigger if exists leads_set_updated_at on leads;
create trigger leads_set_updated_at
  before update on leads
  for each row execute function set_updated_at();

drop trigger if exists lead_goals_set_updated_at on lead_goals;
create trigger lead_goals_set_updated_at
  before update on lead_goals
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
--   - leads: anon can SELECT, INSERT (new lead) and UPDATE (follow-up,
--     including linking member_id) — RPs manage the whole pipeline
--     directly in Concentrado · Leads. No DELETE.
--   - lead_goals: anon can SELECT, INSERT and UPDATE (goals are edited
--     inline at the top of Concentrado · Leads). No DELETE.
--
-- This is a mitigation, not real security: the anon key is public by
-- design in a client-side app, so anyone with the portal URL can still
-- read member data and add comments. Add Supabase Auth when you're ready
-- to restrict this to actual staff logins.
-- =========================================================================
alter table members enable row level security;
alter table comments enable row level security;
alter table leads enable row level security;
alter table lead_goals enable row level security;
alter table rps enable row level security;
alter table promotions enable row level security;

drop policy if exists members_select_anon on members;
create policy members_select_anon on members for select to anon using (true);

drop policy if exists members_update_anon on members;
create policy members_update_anon on members for update to anon using (true) with check (true);

revoke update on members from anon;
grant update (member_no, rp, ejecutivo, app_downloaded, sportlab, keepgoing, performance_day, reviewed) on members to anon;
grant select on members to anon;

drop policy if exists comments_select_anon on comments;
create policy comments_select_anon on comments for select to anon using (true);

drop policy if exists comments_insert_anon on comments;
create policy comments_insert_anon on comments for insert to anon with check (true);

grant select, insert on comments to anon;

drop policy if exists leads_select_anon on leads;
create policy leads_select_anon on leads for select to anon using (true);

drop policy if exists leads_insert_anon on leads;
create policy leads_insert_anon on leads for insert to anon with check (true);

drop policy if exists leads_update_anon on leads;
create policy leads_update_anon on leads for update to anon using (true) with check (true);

grant select, insert, update on leads to anon;

drop policy if exists lead_goals_select_anon on lead_goals;
create policy lead_goals_select_anon on lead_goals for select to anon using (true);

drop policy if exists lead_goals_insert_anon on lead_goals;
create policy lead_goals_insert_anon on lead_goals for insert to anon with check (true);

drop policy if exists lead_goals_update_anon on lead_goals;
create policy lead_goals_update_anon on lead_goals for update to anon using (true) with check (true);

grant select, insert, update on lead_goals to anon;

drop policy if exists rps_select_anon on rps;
create policy rps_select_anon on rps for select to anon using (true);

drop policy if exists rps_insert_anon on rps;
create policy rps_insert_anon on rps for insert to anon with check (true);

grant select, insert on rps to anon;

drop policy if exists promotions_select_anon on promotions;
create policy promotions_select_anon on promotions for select to anon using (true);

drop policy if exists promotions_insert_anon on promotions;
create policy promotions_insert_anon on promotions for insert to anon with check (true);

grant select, insert on promotions to anon;
