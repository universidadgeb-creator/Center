const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function monthKey(dateIso: string | null): string | null {
  return dateIso && dateIso.length >= 7 ? dateIso.slice(0, 7) : null;
}

export function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m || !MONTH_NAMES[m - 1]) return ym;
  const label = `${MONTH_NAMES[m - 1]} ${y}`;
  return label.charAt(0).toUpperCase() + label.slice(1);
}
