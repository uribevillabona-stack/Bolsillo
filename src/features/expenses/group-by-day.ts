/**
 * Agrupa movimientos por día para la lista (lógica pura).
 * Espera las filas ordenadas de la más reciente a la más antigua.
 */
import { dayLabel, startOfDay } from '@/lib/dates';

import type { MovementLike } from './month-totals';

export interface DayGroup<T> {
  /** Inicio del día (ms): clave estable. */
  key: number;
  label: string;
  /** Total de salidas del día (gastos y transferencias enviadas). */
  spent: number;
  items: T[];
}

export function groupByDay<T extends MovementLike>(rows: readonly T[], now: Date): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];
  for (const row of rows) {
    const key = startOfDay(new Date(row.occurredAt)).getTime();
    let group = groups.at(-1);
    if (!group || group.key !== key) {
      group = { key, label: dayLabel(new Date(row.occurredAt), now), spent: 0, items: [] };
      groups.push(group);
    }
    group.items.push(row);
    if (row.type === 'expense' || row.type === 'transfer_out') group.spent += row.amount;
  }
  return groups;
}

/** Monto con signo para mostrar: las salidas en negativo. */
export function signedAmount(row: Pick<MovementLike, 'type' | 'amount'>): number {
  return row.type === 'expense' || row.type === 'transfer_out' ? -row.amount : row.amount;
}
