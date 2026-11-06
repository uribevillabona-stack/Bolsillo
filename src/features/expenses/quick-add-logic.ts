/**
 * Reglas del registro rápido (lógica pura).
 */
import { daysAgo } from '@/lib/dates';

/** Opciones de fecha del registro rápido: los gastos hormiga casi siempre son de hoy o ayer. */
export const DAY_OPTIONS = [
  { daysAgo: 0, label: 'Hoy' },
  { daysAgo: 1, label: 'Ayer' },
  { daysAgo: 2, label: 'Anteayer' },
] as const;

export function nextDayOption(current: number): number {
  return (current + 1) % DAY_OPTIONS.length;
}

/** Instante del gasto: la hora actual, movida N días atrás. */
export function occurredAtFor(dayOptionIndex: number, now: Date): number {
  const option = DAY_OPTIONS[dayOptionIndex] ?? DAY_OPTIONS[0];
  return daysAgo(now, option.daysAgo).getTime();
}

export const NOTE_MAX = 140;

/** Texto del snackbar al guardar: "Tinto · $ 2.500 guardado". */
export function savedMessage(label: string | null, formattedAmount: string): string {
  return label ? `${label} · ${formattedAmount} guardado` : `${formattedAmount} guardado`;
}
