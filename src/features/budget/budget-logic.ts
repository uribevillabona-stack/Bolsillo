/**
 * Presupuesto por categoría (lógica pura, probada).
 *
 * "Alerta suave": al 80 % se avisa una vez, con lo que queda y para cuántos
 * días; al 100 %, otra vez. Nunca bloquea un gasto ni regaña.
 */

/** Umbrales de aviso, en porcentaje del tope. */
export const ALERT_THRESHOLDS = [80, 100] as const;
export type AlertThreshold = (typeof ALERT_THRESHOLDS)[number];

export type BudgetStatus = 'ok' | 'near' | 'over';

/** Movimientos que cuentan como gasto contra un tope. */
const OUTFLOW = new Set(['expense', 'transfer_out']);

export interface SpendRow {
  type: string;
  amount: number;
  categoryId: number | null;
}

/** Gasto por categoría (solo egresos). */
export function spentByCategory(rows: readonly SpendRow[]): Map<number, number> {
  const out = new Map<number, number>();
  for (const r of rows) {
    if (!OUTFLOW.has(r.type) || r.categoryId === null) continue;
    out.set(r.categoryId, (out.get(r.categoryId) ?? 0) + r.amount);
  }
  return out;
}

export function statusFor(spent: number, limit: number): BudgetStatus {
  if (spent >= limit) return 'over';
  if (spent * 100 >= limit * ALERT_THRESHOLDS[0]) return 'near';
  return 'ok';
}

export interface BudgetInput {
  id: number;
  categoryId: number;
  limitAmount: number;
  categoryName: string;
  categoryIcon: string;
}

export interface BudgetLine extends BudgetInput {
  spent: number;
  /** spent / limit (puede pasar de 1). */
  ratio: number;
  /** Lo que queda (0 si ya se pasó). */
  remaining: number;
  /** Cuánto se pasó (0 si no). */
  overBy: number;
  status: BudgetStatus;
}

/** Líneas de presupuesto, las más apretadas primero. */
export function budgetLines(
  budgets: readonly BudgetInput[],
  spent: ReadonlyMap<number, number>,
): BudgetLine[] {
  return budgets
    .map((b) => {
      const s = spent.get(b.categoryId) ?? 0;
      return {
        ...b,
        spent: s,
        ratio: b.limitAmount > 0 ? s / b.limitAmount : 0,
        remaining: Math.max(0, b.limitAmount - s),
        overBy: Math.max(0, s - b.limitAmount),
        status: statusFor(s, b.limitAmount),
      };
    })
    .sort((a, b) => b.ratio - a.ratio || a.categoryName.localeCompare(b.categoryName));
}

/** Porcentaje entero para mostrar: nunca dice "100 %" si aún no llegó. */
export function percentLabel(spent: number, limit: number): string {
  if (limit <= 0) return '0 %';
  const pct = Math.floor((spent * 100) / limit);
  return `${pct} %`;
}

/**
 * Umbral a avisar ahora: el más alto alcanzado que no se haya mostrado.
 * Si un solo gasto salta del 70 % al 105 %, se avisa el 100 % (no los dos).
 */
export function pendingAlert(
  spent: number,
  limit: number,
  alreadyShown: ReadonlySet<number>,
): AlertThreshold | null {
  if (limit <= 0) return null;
  for (let i = ALERT_THRESHOLDS.length - 1; i >= 0; i--) {
    const t = ALERT_THRESHOLDS[i]!;
    if (spent * 100 >= limit * t) return alreadyShown.has(t) ? null : t;
  }
  return null;
}

/**
 * Plata por día para lo que queda del mes, redondeada hacia abajo a
 * cientos (mejor quedarse corto que pasarse).
 */
export function dailyAllowance(remaining: number, daysLeft: number): number {
  if (remaining <= 0 || daysLeft <= 0) return 0;
  return Math.floor(remaining / daysLeft / 100) * 100;
}

/** Tope sugerido a partir de lo gastado el mes pasado: redondeado arriba a miles. */
export function suggestedLimit(lastMonthSpent: number): number {
  if (lastMonthSpent <= 0) return 0;
  return Math.ceil(lastMonthSpent / 1000) * 1000;
}

/** "para 12 días" · "para hoy" */
function daysPhrase(daysLeft: number): string {
  return daysLeft <= 1 ? 'para hoy' : `para ${daysLeft} días`;
}

/**
 * Mensaje del aviso, con la voz de la app: informa, no regaña.
 * `format` formatea montos (formatCOP).
 */
export function alertMessage(
  threshold: AlertThreshold,
  line: Pick<BudgetLine, 'categoryName' | 'spent' | 'limitAmount' | 'remaining' | 'overBy'>,
  daysLeft: number,
  format: (n: number) => string,
): string {
  if (threshold === 100) {
    return line.overBy > 0
      ? `Te pasaste ${format(line.overBy)} del tope de ${line.categoryName}.`
      : `Llegaste al tope de ${line.categoryName}.`;
  }
  return `Vas en el ${percentLabel(line.spent, line.limitAmount)} de ${line.categoryName}. Te quedan ${format(line.remaining)} ${daysPhrase(daysLeft)}.`;
}

/** Aviso a partir del resultado de `checkBudgetAlert` (repo). */
export function hitMessage(
  hit: { threshold: AlertThreshold; categoryName: string; spent: number; limitAmount: number },
  daysLeft: number,
  format: (n: number) => string,
): string {
  return alertMessage(
    hit.threshold,
    {
      categoryName: hit.categoryName,
      spent: hit.spent,
      limitAmount: hit.limitAmount,
      remaining: Math.max(0, hit.limitAmount - hit.spent),
      overBy: Math.max(0, hit.spent - hit.limitAmount),
    },
    daysLeft,
    format,
  );
}
