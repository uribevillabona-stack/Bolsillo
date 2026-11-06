/**
 * Estadísticas de gastos hormiga (lógica pura, sin base de datos ni UI).
 *
 * Proyección anual: ritmo diario × 365, donde el ritmo se mide en una
 * ventana móvil que termina hoy. La ventana mide los días con historia,
 * acotados entre 7 y 30:
 *  - Máximo 30: refleja el comportamiento reciente, no el de hace meses.
 *  - Mínimo 7: con 1 o 2 días de datos el ritmo sería puro ruido.
 *  - Si hay menos de 30 días de historia, dividir entre 30 subestimaría:
 *    alguien que lleva 3 días tomando tinto no "toma tinto 3 de cada 30 días".
 */
import { DAY_MS, startOfDay, startOfMonth } from '@/lib/dates';

export interface HormigaRow {
  amount: number;
  occurredAt: number;
  categoryId: number | null;
  categoryName: string | null;
  categoryIcon: string | null;
}

export interface HormigaCategoryStat {
  categoryId: number | null;
  name: string;
  icon: string | null;
  /** Veces registradas este mes. */
  monthCount: number;
  /** Total de este mes. */
  monthTotal: number;
  /** Proyección a un año al ritmo de la ventana reciente (redondeada a miles). */
  annualProjection: number;
}

export interface HormigaSummary {
  monthTotal: number;
  monthCount: number;
  annualProjection: number;
  /** Días de la ventana usada para el ritmo (7–30). */
  windowDays: number;
  categories: HormigaCategoryStat[];
}

export const MIN_WINDOW_DAYS = 7;
export const MAX_WINDOW_DAYS = 30;

/** Redondea a miles: "$ 456.000" se lee mejor que "$ 455.833". */
export function roundToThousands(value: number): number {
  return Math.round(value / 1000) * 1000;
}

/**
 * Días de la ventana de ritmo. `firstRecordAt` es el primer gasto hormiga de
 * toda la historia (no solo del mes).
 */
export function windowDays(now: Date, firstRecordAt: number | null): number {
  if (firstRecordAt === null) return MAX_WINDOW_DAYS;
  const history =
    Math.floor(
      (startOfDay(now).getTime() - startOfDay(new Date(firstRecordAt)).getTime()) / DAY_MS,
    ) + 1;
  return Math.min(MAX_WINDOW_DAYS, Math.max(MIN_WINDOW_DAYS, history));
}

/**
 * @param rows gastos hormiga de al menos los últimos 30 días y del mes actual.
 * @param firstRecordAt primer gasto hormiga registrado (o null si no hay).
 */
export function summarizeHormigas(
  rows: readonly HormigaRow[],
  now: Date,
  firstRecordAt: number | null,
): HormigaSummary {
  const monthStart = startOfMonth(now).getTime();
  const days = windowDays(now, firstRecordAt);
  // La ventana incluye hoy completo: desde las 00:00 de hace (days - 1) días.
  const windowStart = startOfDay(now).getTime() - (days - 1) * DAY_MS;
  const nowMs = now.getTime();

  const byKey = new Map<string, HormigaCategoryStat & { windowTotal: number }>();
  let monthTotal = 0;
  let monthCount = 0;
  let windowTotal = 0;

  for (const row of rows) {
    if (row.occurredAt > nowMs) continue; // fechas futuras: no cuentan aún
    const key = String(row.categoryId ?? 'none');
    let stat = byKey.get(key);
    if (!stat) {
      stat = {
        categoryId: row.categoryId,
        name: row.categoryName ?? 'Sin categoría',
        icon: row.categoryIcon,
        monthCount: 0,
        monthTotal: 0,
        annualProjection: 0,
        windowTotal: 0,
      };
      byKey.set(key, stat);
    }
    if (row.occurredAt >= monthStart) {
      stat.monthCount += 1;
      stat.monthTotal += row.amount;
      monthCount += 1;
      monthTotal += row.amount;
    }
    if (row.occurredAt >= windowStart) {
      stat.windowTotal += row.amount;
      windowTotal += row.amount;
    }
  }

  const project = (total: number) => roundToThousands((total / days) * 365);

  const categories = [...byKey.values()]
    .map(({ windowTotal: wt, ...stat }) => ({ ...stat, annualProjection: project(wt) }))
    .filter((c) => c.monthCount > 0 || c.annualProjection > 0)
    .sort((a, b) => b.monthTotal - a.monthTotal || b.annualProjection - a.annualProjection);

  return {
    monthTotal,
    monthCount,
    annualProjection: project(windowTotal),
    windowDays: days,
    categories,
  };
}

/**
 * Frase con la voz de la app para la categoría que más pesa.
 * "A este ritmo, $ 456.000 al año en tinto y café."
 */
export function projectionSentence(
  stat: Pick<HormigaCategoryStat, 'name' | 'annualProjection'>,
  format: (n: number) => string,
): string {
  return `A este ritmo, ${format(stat.annualProjection)} al año en ${stat.name.toLowerCase()}.`;
}
