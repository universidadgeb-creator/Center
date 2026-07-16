// One-off script: bulk-imports the "Center Junio" / "Center Julio" tabs from
// "Prospectos Center.xlsx" (repo root) directly into Supabase, bypassing the
// UI's intake-only importer. Not part of the app build — delete after use.
//
// Usage (run from app/):
//   node scripts/bulk-import-leads.mjs            (dry run — prints a preview, inserts nothing)
//   node scripts/bulk-import-leads.mjs --commit    (actually inserts into Supabase)

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const envLocal = readFileSync(path.join(repoRoot, 'app', '.env.local'), 'utf8');
const SUPABASE_URL = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const SUPABASE_ANON_KEY = envLocal.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();

const COMMIT = process.argv.includes('--commit');

// ---- canonical lists (mirrors app/src/lib/leadStatus.ts) ----
const LEAD_STATUSES = [
  'Nuevo', '10% Contactado', '20% Contactado con respuesta', '50% Cita', '50% Reprogramar cita',
  '60% Tour/Precio', '80% Por confirmar', '100% Venta', '0% No le interesa', 'Nunca contestó',
  'No existe', 'Llamar después', 'Pase invitado Easy Fit', 'Tiene total pass', 'Lead de renovación',
  'No venta / No interesa',
];
const PLAN_OPTIONS = ['Anual', 'Mensual'];
const TIPO_ALTA_OPTIONS = ['Alta', 'Certificado', 'Membresía', 'Reactivación', 'Anualidad VIP'];
const LEAD_ESTRATEGIAS = [
  'FB', 'IG', 'WHATSAPP', 'RECOMENDADO', 'REACTIVACION', 'VENTAS CORPORATIVAS',
  'ESPECTACULAR', 'PAGINA WEB', 'PASE DE INVITADO', 'VALLA MOVIL', 'VOLANTEO',
];
const KNOWN_RPS = ['Marce', 'Rodo'];

// ---- explicit status overrides agreed with the user (2026-07-15) ----
// "NO CONTESTA" merges into "Nunca contestó"; "NO VENTA / NO INTERESA" is its
// own new canonical status, not merged into "0% No le interesa".
const STATUS_OVERRIDES = {
  'NO CONTESTA': 'Nunca contestó',
  'VENTA': '100% Venta',
  'CITA': '50% Cita',
  'PERFIL EASY FIT': 'Pase invitado Easy Fit',
};

function norm(s) {
  return String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

function matchFromList(value, options, overrides = {}) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (overrides[raw.toUpperCase()]) return overrides[raw.toUpperCase()];
  const target = norm(raw);
  return options.find(o => norm(o) === target) ?? null;
}

function parseSheetDate(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value ?? '').trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); // DD/MM/YYYY
  if (!m) return null;
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function parseBool(value) {
  const t = String(value ?? '').trim().toUpperCase();
  return t === 'SI' || t === 'SÍ' || t === 'TRUE' || t === '1';
}

function parseMonto(value) {
  const s = String(value ?? '').trim();
  if (!s) return null;
  const n = Number(s.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function text(value) {
  const s = String(value ?? '').trim();
  return s || null;
}

function rp(value) {
  const raw = String(value ?? '').trim();
  const found = KNOWN_RPS.find(r => r.toUpperCase() === raw.toUpperCase());
  return found ?? text(value);
}

const workbookBuffer = readFileSync(path.join(repoRoot, 'Prospectos Center.xlsx'));
const workbook = XLSX.read(workbookBuffer, { type: 'buffer', cellDates: false });

function sheetRows(sheetName, headerRowIdx) {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  const header = rows[headerRowIdx];
  return rows.slice(headerRowIdx + 1).map(r => {
    const o = {};
    header.forEach((h, i) => { o[h] = r[i]; });
    return o;
  });
}

function fromJunio(row) {
  const nombre = text(row['Nombre']);
  if (!nombre) return null;
  const statusRaw = row['SATATUS NUEVO'];
  return {
    nombre,
    telefono: text(row['Teléfono']),
    correo: null,
    estrategia: matchFromList(row['Estrategia '], LEAD_ESTRATEGIAS),
    promocion: text(row['Promoción']),
    rp: rp(row['Nombre RP']),
    fecha_asignacion: parseSheetDate(row['Fecha']) ?? '2026-06-01',
    comentarios: text(row['Comentario / Notas']),
    status: matchFromList(statusRaw, LEAD_STATUSES, STATUS_OVERRIDES) ?? 'Nuevo',
    _statusRaw: text(statusRaw),
    tour: parseBool(row['Tour']),
    fecha_cita: parseSheetDate(row['Fecha de cita (INVENTARIO)']),
    plan: matchFromList(row['Tipo de Plan'], PLAN_OPTIONS),
    tipo_alta: matchFromList(row['TIpo de alta'], TIPO_ALTA_OPTIONS, { VIP: 'Anualidad VIP' }),
    monto_sin_iva: parseMonto(row['Monto sin IVA MM']),
    monto_con_iva: parseMonto(row['Monto con IVA']),
    fecha_cierre: parseSheetDate(row['Fecha de cierre']),
    app_downloaded: parseBool(row['APP Descargada']),
  };
}

function fromJulio(row) {
  const nombre = text(row['Nombre']);
  if (!nombre) return null;
  const statusRaw = row['Status'];
  return {
    nombre,
    telefono: text(row['Teléfono']),
    correo: text(row['Correo Electrónico']),
    estrategia: matchFromList(row['Estrategia '], LEAD_ESTRATEGIAS),
    promocion: text(row['Promoción']),
    rp: rp(row['Nombre RP']),
    fecha_asignacion: parseSheetDate(row['Fecha de asignación']) ?? '2026-07-01',
    comentarios: text(row['Comentario / Notas']),
    status: matchFromList(statusRaw, LEAD_STATUSES, STATUS_OVERRIDES) ?? 'Nuevo',
    _statusRaw: text(statusRaw),
    tour: parseBool(row['Tour']),
    fecha_cita: parseSheetDate(row['FECHA DE TOUR']),
    plan: matchFromList(row['PLAN'], PLAN_OPTIONS),
    tipo_alta: matchFromList(row['TIpo de alta'], TIPO_ALTA_OPTIONS, { VIP: 'Anualidad VIP' }),
    monto_sin_iva: parseMonto(row['Monto sin IVA MM']),
    monto_con_iva: parseMonto(row['Monto con IVA']),
    fecha_cierre: parseSheetDate(row['Fecha de cierre']),
    app_downloaded: parseBool(row['APP Descargada']),
  };
}

const junioLeads = sheetRows('Center Junio', 0).map(fromJunio).filter(Boolean);
const julioLeads = sheetRows('Center Julio ', 2).map(fromJulio).filter(Boolean);
const allLeads = [...junioLeads, ...julioLeads];

// ---- preview ----
function statusBreakdown(leads) {
  const m = new Map();
  for (const l of leads) m.set(l.status, (m.get(l.status) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

console.log(`Junio: ${junioLeads.length} leads · Julio: ${julioLeads.length} leads · Total: ${allLeads.length}`);
console.log('\n--- Status resultante (junio+julio) ---');
for (const [status, count] of statusBreakdown(allLeads)) console.log(`  ${status}: ${count}`);

console.log('\n--- Muestra (3 primeros de cada mes) ---');
for (const l of [...junioLeads.slice(0, 3), ...julioLeads.slice(0, 3)]) {
  const { _statusRaw, ...clean } = l;
  console.log(JSON.stringify(clean));
}

if (!COMMIT) {
  console.log('\n(Dry run — no se insertó nada. Corre con --commit para insertar de verdad.)');
  process.exit(0);
}

// ---- actual insert, batched ----
const BATCH_SIZE = 200;
let inserted = 0;
for (let i = 0; i < allLeads.length; i += BATCH_SIZE) {
  const batch = allLeads.slice(i, i + BATCH_SIZE).map(({ _statusRaw, ...clean }) => clean);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(batch),
  });
  if (!res.ok) {
    console.error(`Error en lote ${i}-${i + batch.length}:`, res.status, await res.text());
    process.exit(1);
  }
  inserted += batch.length;
  console.log(`Insertados ${inserted}/${allLeads.length}...`);
}

console.log(`\nListo. Se insertaron ${inserted} leads.`);
