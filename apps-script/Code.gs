/**
 * Vivo47 Portal Operativo — Google Apps Script sync
 *
 * Bound to the response Sheet of the intake Google Form. Pushes rows into
 * the Supabase `members` table so the portal can read real intake data.
 *
 * SETUP
 * 1. Open the response Sheet → Extensions → Apps Script.
 * 2. Paste this file in as Code.gs (replace the default content).
 * 3. Project Settings (gear icon) → Script Properties → add:
 *      SUPABASE_URL          e.g. https://xxxxxxxx.supabase.co
 *      SUPABASE_SERVICE_KEY  the "service_role" key from
 *                            Supabase → Project Settings → API
 *    (Use the service_role key here, NOT the anon key — this script needs
 *    to insert new members, which the anon key is intentionally blocked
 *    from doing by the RLS policies in supabase/schema.sql. Never put the
 *    service_role key in the frontend app.)
 * 4. Reload the Sheet. A "Vivo47 Sync" menu appears — run
 *    "Vivo47 Sync → Sincronizar ahora" once to backfill existing rows.
 * 5. Run "Vivo47 Sync → Activar sincronización automática" once to install
 *    the triggers (on form submit, and every 15 min to pick up evaluation
 *    columns that get filled in after submission).
 *
 * COLUMN MAPPING
 * The Sheet's header row has typos/duplicates ("Enfoque" vs "Puntuación
 * Enfoque", "NIvel actual") that make matching by name fragile, so this
 * maps columns by position instead. Column order (0-indexed), as given:
 *   0  Marca temporal            15 Celular
 *   1  Nombre completo           16 (Columna 15 — unused)
 *   2  Genero                    17 Enfoque (label)
 *   3  Edad                      18 Puntuación Adeherencia
 *   4  Q1 objetivo               19 Puntuación Frecuencia
 *   5  Q2 meta90                 20 Puntuación Condición
 *   6  Q3 relacion               21 NIvel actual (condición level)
 *   7  Q4 dias                   22 Puntuación abandono
 *   8  Q5 condicion percibida    23 Puntuación Enfoque (score)
 *   9  Q6 mejorar                24 Categoría Nivel (nivel general)
 *   10 Q7 abandono               25 Categoría Riesgo (canonical risk)
 *   11 Q8 ayudaria               26 Comentarios (seed intake comment)
 *   12 Q9 confianza              27 (Column 24 — unused)
 *   13 nota futuro
 *   14 momentos
 * If your Sheet's column order ever changes, update COL below to match.
 */

const COL = {
  marcaTemporal: 0, name: 1, gender: 2, age: 3,
  objetivo: 4, meta90: 5, relacion: 6, dias: 7, condicionPerc: 8,
  mejorar: 9, abandono: 10, ayudaria: 11, confianza: 12,
  notaFuturo: 13, momentos: 14, phone: 15,
  enfoqueLabel: 17, adherenciaScore: 18, frecuenciaScore: 19,
  condicionScore: 20, condicionLevel: 21, abandonoScore: 22,
  enfoqueScore: 23, nivelGeneralLabel: 24, risk: 25, intakeComment: 26,
};

const BATCH_SIZE = 200;

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Vivo47 Sync')
    .addItem('Sincronizar ahora', 'syncAll')
    .addItem('Activar sincronización automática', 'installTriggers')
    .addToUi();
}

/** Wired to an installable "on form submit" trigger. */
function onFormSubmitTrigger(e) {
  syncAll();
}

function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('onFormSubmitTrigger')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();

  // Evaluation columns (Enfoque, Categoría Riesgo, etc.) may be filled in
  // by a coach after the row is created, so re-sync periodically too.
  ScriptApp.newTrigger('syncAll')
    .timeBased()
    .everyMinutes(15)
    .create();

  SpreadsheetApp.getUi().alert('Triggers activados: sincroniza al enviar el formulario y cada 15 minutos.');
}

function getConfig_() {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('SUPABASE_URL');
  const key = props.getProperty('SUPABASE_SERVICE_KEY');
  if (!url || !key) {
    throw new Error('Faltan SUPABASE_URL / SUPABASE_SERVICE_KEY en Script Properties (ver comentario al inicio de este archivo).');
  }
  return { url: url.replace(/\/+$/, ''), key };
}

function syncAll() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1); // drop header row

  const payloads = rows
    .map(rowToPayload_)
    .filter(p => p && p.name && p.marca_temporal);

  if (payloads.length === 0) return;

  const { url, key } = getConfig_();
  for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
    upsertBatch_(url, key, payloads.slice(i, i + BATCH_SIZE));
  }
}

function rowToPayload_(row) {
  const marcaRaw = row[COL.marcaTemporal];
  if (!marcaRaw) return null;
  const marcaTemporal = String(marcaRaw);
  const altaDate = toIsoDate_(marcaRaw);

  return {
    marca_temporal: marcaTemporal,
    name: str_(row[COL.name]),
    gender: str_(row[COL.gender]),
    age: intOrNull_(row[COL.age]),
    phone: str_(row[COL.phone]),
    alta_date: altaDate,

    objetivo: str_(row[COL.objetivo]),
    meta90: str_(row[COL.meta90]),
    relacion: str_(row[COL.relacion]),
    dias: str_(row[COL.dias]),
    condicion_perc: str_(row[COL.condicionPerc]),
    mejorar: str_(row[COL.mejorar]),
    abandono: str_(row[COL.abandono]),
    ayudaria: str_(row[COL.ayudaria]),
    confianza: intOrNull_(row[COL.confianza]),
    nota_futuro: str_(row[COL.notaFuturo]),
    momentos: str_(row[COL.momentos]),

    enfoque_label: str_(row[COL.enfoqueLabel]),
    enfoque_score: intOrNull_(row[COL.enfoqueScore]),
    adherencia_score: intOrNull_(row[COL.adherenciaScore]),
    frecuencia_score: intOrNull_(row[COL.frecuenciaScore]),
    condicion_score: intOrNull_(row[COL.condicionScore]),
    condicion_level: str_(row[COL.condicionLevel]),
    abandono_score: intOrNull_(row[COL.abandonoScore]),
    nivel_general_label: str_(row[COL.nivelGeneralLabel]),
    risk: normalizeRisk_(row[COL.risk]),
    intake_comment: str_(row[COL.intakeComment]),
  };
}

function str_(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function intOrNull_(v) {
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
}

function toIsoDate_(v) {
  const d = (v instanceof Date) ? v : new Date(v);
  if (isNaN(d.getTime())) return null;
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function normalizeRisk_(v) {
  const s = str_(v);
  if (!s) return null;
  const low = s.toLowerCase();
  if (low.startsWith('alto')) return 'Alto';
  if (low.startsWith('medio')) return 'Medio';
  if (low.startsWith('bajo')) return 'Bajo';
  return s;
}

function upsertBatch_(url, key, payloads) {
  const res = UrlFetchApp.fetch(`${url}/rest/v1/members?on_conflict=marca_temporal`, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    payload: JSON.stringify(payloads),
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  if (code >= 300) {
    throw new Error(`Supabase upsert falló (${code}): ${res.getContentText()}`);
  }
}
