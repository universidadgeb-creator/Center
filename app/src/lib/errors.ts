/** Maps raw Supabase/JS error messages to short, non-technical Spanish copy for staff-facing UI. */
export function friendlyError(raw: string | null): string {
  if (!raw) return '';
  const msg = raw.toLowerCase();
  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed')) {
    return 'No se pudo conectar con la base de datos. Revisa tu conexión e intenta de nuevo.';
  }
  return 'No se pudo guardar el cambio. Intenta de nuevo.';
}
