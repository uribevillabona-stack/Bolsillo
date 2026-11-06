/**
 * Resumen de gastos hormiga en vivo para la fecha actual.
 */
import { useFirstHormigaAt, useHormigaExpensesSince } from '@/db/hooks';
import { DAY_MS, startOfDay, startOfMonth } from '@/lib/dates';

import { MAX_WINDOW_DAYS, summarizeHormigas } from './hormigas-stats';

export function useHormigaSummary(now: Date) {
  // Desde lo más antiguo entre el inicio del mes y el inicio de la ventana máxima.
  const windowStart = startOfDay(now).getTime() - (MAX_WINDOW_DAYS - 1) * DAY_MS;
  const from = Math.min(startOfMonth(now).getTime(), windowStart);
  const rows = useHormigaExpensesSince(from);
  const firstAt = useFirstHormigaAt();
  return summarizeHormigas(rows, now, firstAt);
}
