/** Canonical lead pipeline stages, taken from the team's "Center Julio" tracker. */
export const LEAD_STATUSES = [
  'Nuevo',
  '10% Contactado',
  '20% Contactado con respuesta',
  '50% Cita',
  '50% Reprogramar cita',
  '60% Tour/Precio',
  '80% Por confirmar',
  '100% Venta',
  '0% No le interesa',
  'Nunca contestó',
  'No existe',
  'Llamar después',
  'Pase invitado Easy Fit',
  'Tiene total pass',
  'Lead de renovación',
  'No venta / No interesa',
] as const;

export type LeadStatus = typeof LEAD_STATUSES[number];

/** Terminal stages — the lead is won, lost, or otherwise out of the active pipeline. */
const CLOSED_STATUSES: ReadonlySet<string> = new Set([
  '100% Venta',
  '0% No le interesa',
  'No existe',
  'Tiene total pass',
  'No venta / No interesa',
  'Nunca contestó',
]);

export function isClosedStatus(status: string | null | undefined): boolean {
  return !!status && CLOSED_STATUSES.has(status);
}

export function isWonStatus(status: string | null | undefined): boolean {
  return status === '100% Venta';
}

/** Of the closed statuses, the one true win — everything else closed is a lost sale. */
export function isPositiveClosed(status: string | null | undefined): boolean {
  return status === '100% Venta';
}

export function isNegativeClosed(status: string | null | undefined): boolean {
  return isClosedStatus(status) && !isPositiveClosed(status);
}

/**
 * Semantic color per pipeline stage, grouped by what the stage means for the RP's day:
 * gray = not worked yet, blue = in contact, amber = appointment/tour in motion,
 * green = won or already a member, red = dead, olive = special/other track.
 * Always paired with the visible status text (the select itself), never color-alone.
 */
export const LEAD_STATUS_COLORS: Record<string, string> = {
  'Nuevo': '#78716C',
  '10% Contactado': '#1D4ED8',
  '20% Contactado con respuesta': '#1D4ED8',
  'Llamar después': '#1D4ED8',
  '50% Cita': '#B45309',
  '50% Reprogramar cita': '#B45309',
  '60% Tour/Precio': '#B45309',
  '80% Por confirmar': '#B45309',
  '100% Venta': '#1E7A42',
  'Tiene total pass': '#1E7A42',
  '0% No le interesa': '#B42318',
  'Nunca contestó': '#B42318',
  'No existe': '#B42318',
  'No venta / No interesa': '#B42318',
  'Pase invitado Easy Fit': '#4D7C0F',
  'Lead de renovación': '#4D7C0F',
};

/** The 6 color families above, named — used to group the 16 statuses into a readable donut
 * (one slice per family) instead of 16 near-invisible slivers. */
export const STATUS_GROUPS: { label: string; color: string; statuses: string[] }[] = [
  { label: 'Sin trabajar', color: '#78716C', statuses: ['Nuevo'] },
  { label: 'En contacto', color: '#1D4ED8', statuses: ['10% Contactado', '20% Contactado con respuesta', 'Llamar después'] },
  { label: 'Cita / Tour', color: '#B45309', statuses: ['50% Cita', '50% Reprogramar cita', '60% Tour/Precio', '80% Por confirmar'] },
  { label: 'Ganado', color: '#1E7A42', statuses: ['100% Venta'] },
  /* "Tiene total pass" ya tenía un pase vigente por otro lado — no es una venta nueva, así que
   * isPositiveClosed lo excluye y el resto de la app (buckets, filtros) ya lo cuenta como
   * cerrado sin venta. Antes vivía en "Ganado" y la dona lo mostraba como inscripción junto con
   * las ventas reales, aunque en el resto del portal contaba distinto. */
  { label: 'Perdido', color: '#B42318', statuses: ['0% No le interesa', 'Nunca contestó', 'No existe', 'No venta / No interesa', 'Tiene total pass'] },
  { label: 'Especial', color: '#4D7C0F', statuses: ['Pase invitado Easy Fit', 'Lead de renovación'] },
];

export function leadStatusColor(status: string): string {
  return LEAD_STATUS_COLORS[status] ?? '#78716C';
}

/** "In contact, no appointment yet" sub-stages — splits the open pipeline (excluding Nuevo and
 * closed statuses) into "pendientes seguimiento" vs "en proceso" for the Leads totales breakdown. */
const SEGUIMIENTO_STATUSES: ReadonlySet<string> = new Set([
  '10% Contactado', '20% Contactado con respuesta', 'Llamar después',
]);

export type LeadCategory = 'todos' | 'nuevos' | 'seguimiento' | 'proceso' | 'positivos' | 'negativos';

/** Single source of truth for the 5-way partition used by both the Leads totales breakdown
 * and the table category filters — every status falls into exactly one bucket. */
export function matchesLeadCategory(status: string, category: LeadCategory): boolean {
  switch (category) {
    case 'nuevos': return status === 'Nuevo';
    case 'seguimiento': return !isClosedStatus(status) && status !== 'Nuevo' && SEGUIMIENTO_STATUSES.has(status);
    case 'proceso': return !isClosedStatus(status) && status !== 'Nuevo' && !SEGUIMIENTO_STATUSES.has(status);
    case 'positivos': return isPositiveClosed(status);
    case 'negativos': return isNegativeClosed(status);
    default: return true;
  }
}

export const LEAD_CATEGORY_FILTERS: { key: LeadCategory; label: string; hue?: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'nuevos', label: 'Nuevos' },
  { key: 'seguimiento', label: 'Pendientes seguimiento', hue: '#1D4ED8' },
  { key: 'proceso', label: 'En proceso' },
  { key: 'positivos', label: 'Cerrados positivos' },
  { key: 'negativos', label: 'Cerrados negativos' },
];

export interface LeadBuckets {
  nuevos: number;
  pendientesSeguimiento: number;
  enProceso: number;
  cerradosPositivos: number;
  cerradosNegativos: number;
  total: number;
}

export function computeLeadBuckets<T extends { status: string }>(leads: T[]): LeadBuckets {
  return {
    nuevos: leads.filter(l => matchesLeadCategory(l.status, 'nuevos')).length,
    pendientesSeguimiento: leads.filter(l => matchesLeadCategory(l.status, 'seguimiento')).length,
    enProceso: leads.filter(l => matchesLeadCategory(l.status, 'proceso')).length,
    cerradosPositivos: leads.filter(l => matchesLeadCategory(l.status, 'positivos')).length,
    cerradosNegativos: leads.filter(l => matchesLeadCategory(l.status, 'negativos')).length,
    total: leads.length,
  };
}

/** Row copy (label, color, hover explanation) for rendering the Leads totales breakdown —
 * kept alongside the bucket logic so Concentrado de Leads and Portal RP never drift. */
export function leadBucketRows(buckets: LeadBuckets): { key: string; label: string; count: number; hue: string; title: string }[] {
  return [
    { key: 'nuevos', label: 'Nuevos', count: buckets.nuevos, hue: '#78716C', title: 'Leads que aún no han sido contactados.' },
    { key: 'seguimiento', label: 'Pendientes seguimiento', count: buckets.pendientesSeguimiento, hue: '#1D4ED8', title: 'Leads ya contactados, en espera de agendar cita o tour.' },
    { key: 'proceso', label: 'En proceso', count: buckets.enProceso, hue: '#B45309', title: 'Leads con cita o tour en curso, aún sin cerrar.' },
    { key: 'positivos', label: 'Cerrados positivos', count: buckets.cerradosPositivos, hue: '#1E7A42', title: 'Leads que se convirtieron en venta (100% Venta).' },
    { key: 'negativos', label: 'Cerrados negativos', count: buckets.cerradosNegativos, hue: '#B42318', title: 'Leads cerrados sin venta.' },
  ];
}

/** Membership plan lengths — fixed list, no "add new" button requested for this one. */
export const PLAN_OPTIONS = ['Anual', 'Mensual'] as const;

/** Membership signup types shown in the Pizarra — fixed list, no "add new" button requested. */
export const TIPO_ALTA_OPTIONS = [
  'Alta',
  'Certificado',
  'Membresía',
  'Reactivación',
  'Anualidad VIP',
] as const;

/** Canonical acquisition channels, taken from the team's tracker. */
export const LEAD_ESTRATEGIAS = [
  'FB',
  'IG',
  'WHATSAPP',
  'RECOMENDADO',
  'REACTIVACION',
  'VENTAS CORPORATIVAS',
  'ESPECTACULAR',
  'PAGINA WEB',
  'PASE DE INVITADO',
  'VALLA MOVIL',
  'VOLANTEO',
] as const;
