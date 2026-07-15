import * as XLSX from 'xlsx';
import type { LeadInsert } from './types';

/** Column headers for the bulk-upload template — intake data only (see LEADS_PIZARRA plan:
 * status/tour/montos/cierre get filled in later directly in the Pizarra, not at bulk-upload time). */
const TEMPLATE_HEADERS = ['Nombre', 'Teléfono', 'Correo Electrónico', 'Estrategia', 'Promoción', 'RP', 'Fecha de asignación (AAAA-MM-DD)'];

export function downloadLeadsTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  XLSX.writeFile(wb, 'plantilla_leads_vivo47.xlsx');
}

function normalizeDate(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : undefined;
  }
  return undefined;
}

function text(value: unknown): string {
  return String(value ?? '').trim();
}

export interface ParsedLeadsWorkbook {
  leads: LeadInsert[];
  skipped: number;
  total: number;
}

/** Parses an uploaded .xlsx built from the template above. Rows without a Nombre are skipped
 * (can't create a lead without one) — everything else is optional. */
export async function parseLeadsWorkbook(file: File): Promise<ParsedLeadsWorkbook> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const leads: LeadInsert[] = [];
  let skipped = 0;

  for (const row of rows) {
    const nombre = text(row['Nombre']);
    if (!nombre) {
      skipped += 1;
      continue;
    }
    leads.push({
      nombre,
      telefono: text(row['Teléfono']) || undefined,
      correo: text(row['Correo Electrónico']) || undefined,
      estrategia: text(row['Estrategia']) || undefined,
      promocion: text(row['Promoción']) || undefined,
      rp: text(row['RP']) || undefined,
      fecha_asignacion: normalizeDate(row['Fecha de asignación (AAAA-MM-DD)']),
    });
  }

  return { leads, skipped, total: rows.length };
}
