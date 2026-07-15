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
] as const;

export type LeadStatus = typeof LEAD_STATUSES[number];

/** Terminal stages — the lead is won, lost, or otherwise out of the active pipeline. */
const CLOSED_STATUSES: ReadonlySet<string> = new Set([
  '100% Venta',
  '0% No le interesa',
  'No existe',
  'Tiene total pass',
]);

export function isClosedStatus(status: string | null | undefined): boolean {
  return !!status && CLOSED_STATUSES.has(status);
}

export function isWonStatus(status: string | null | undefined): boolean {
  return status === '100% Venta';
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
  'Pase invitado Easy Fit': '#4D7C0F',
  'Lead de renovación': '#4D7C0F',
};

export function leadStatusColor(status: string): string {
  return LEAD_STATUS_COLORS[status] ?? '#78716C';
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
