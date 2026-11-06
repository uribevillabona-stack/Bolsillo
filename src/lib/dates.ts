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

const WEEKDAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'] as const;
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

export const DAY_MS = 24 * 60 * 60 * 1000;

/** 00:00:00.000 del día de `date` (hora local). */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Primer instante del mes de `date`. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Primer instante del mes siguiente (límite exclusivo del mes). */
export function startOfNextMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

/** Mismo día y hora, `n` días antes. Respeta cambios de hora (usa calendario, no ms). */
export function daysAgo(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - n);
  return d;
}

/** ¿Los dos instantes caen el mismo día calendario? */
export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/**
 * Etiqueta corta de un día relativa a `now`: "Hoy", "Ayer", "lun 3 nov".
 * Se usa para agrupar movimientos y en el selector de fecha del registro.
 */
export function dayLabel(date: Date, now: Date): string {
  if (isSameDay(date, now)) return 'Hoy';
  if (isSameDay(date, daysAgo(now, 1))) return 'Ayer';
  const base = `${WEEKDAYS_SHORT[date.getDay()]} ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
  return date.getFullYear() === now.getFullYear() ? base : `${base} ${date.getFullYear()}`;
}

/** "7:42 a. m." (formato colombiano, 12 horas). */
export function timeLabel(date: Date): string {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${h < 12 ? 'a. m.' : 'p. m.'}`;
}
