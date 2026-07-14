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
