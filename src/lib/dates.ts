/**
 * Fechas en español de Colombia, sin depender de los datos de `Intl` de
 * Hermes (varían por versión de Android).
 */
const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

/** "noviembre" */
export function monthName(date: Date): string {
  return MONTHS[date.getMonth()]!;
}

/** Clave de mes para presupuestos: "2026-11". */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Días que faltan para terminar el mes, contando hoy. */
export function daysLeftInMonth(date: Date): number {
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return last - date.getDate() + 1;
}

/** "faltan 26 días" · "falta 1 día" → se dice "último día" para sonar natural. */
export function daysLeftLabel(date: Date): string {
  const days = daysLeftInMonth(date);
  return days === 1 ? 'último día del mes' : `faltan ${days} días`;
}
