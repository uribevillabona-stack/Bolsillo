/**
 * Apartados: metas de ahorro (lógica pura, probada).
 *
 * Lo separado en un Apartado sale del "disponible del mes": es plata que
 * ya tiene destino. Un retiro (aporte negativo) la devuelve. La excepción es
 * un aporte marcado "ya la tenía ahorrada" (`fromSavings`): esa plata no
 * salió de lo que entró este mes, así que no resta del disponible.
 */
import { monthYearLabel, monthsUntil, startOfMonth, startOfNextMonth } from '@/lib/dates';

export const GOAL_NAME_MAX = 40;

export interface ContributionLike {
  goalId: number;
  amount: number;
  createdAt: number;
  /** Plata que ya tenía ahorrada: cuenta para la meta, no resta del mes. */
  fromSavings?: boolean;
}

export interface GoalLike {
  id: number;
  name: string;
  targetAmount: number;
  targetDate: number | null;
  completedAt: number | null;
}

export interface GoalProgress {
  saved: number;
  /** 0 a 1 (acotado). */
  ratio: number;
  remaining: number;
  completed: boolean;
  /** Meses calendario que quedan contando el actual (null si no tiene fecha). */
  monthsLeft: number | null;
  /** Cuánto separar al mes para llegar a tiempo (null si no tiene fecha o ya se completó). */
  monthlyNeeded: number | null;
  /** Aportes netos de este mes a este Apartado (incluye ahorros previos). */
  savedThisMonth: number;
}

/** Redondea hacia arriba a miles: es mejor sobrar que quedarse corto. */
export function ceilToThousands(value: number): number {
  return Math.ceil(value / 1000) * 1000;
}

/** Total separado por Apartado. */
export function savedByGoal(contributions: readonly ContributionLike[]): Map<number, number> {
  const out = new Map<number, number>();
  for (const c of contributions) out.set(c.goalId, (out.get(c.goalId) ?? 0) + c.amount);
  return out;
}

function sumInMonth(
  contributions: readonly ContributionLike[],
  now: Date,
  include: (c: ContributionLike) => boolean,
): number {
  const from = startOfMonth(now).getTime();
  const to = startOfNextMonth(now).getTime();
  let total = 0;
  for (const c of contributions) {
    if (c.createdAt >= from && c.createdAt < to && include(c)) total += c.amount;
  }
  return total;
}

/**
 * Lo que los Apartados le restan al disponible del mes: aportes netos del
 * mes, sin contar los marcados como ahorros previos.
 */
export function netSavedInMonth(contributions: readonly ContributionLike[], now: Date): number {
  return sumInMonth(contributions, now, (c) => !c.fromSavings);
}

export function goalProgress(
  goal: GoalLike,
  contributions: readonly ContributionLike[],
  now: Date,
): GoalProgress {
  const own = contributions.filter((c) => c.goalId === goal.id);
  const saved = own.reduce((acc, c) => acc + c.amount, 0);
  const remaining = Math.max(0, goal.targetAmount - saved);
  const completed = remaining === 0;
  const savedThisMonth = sumInMonth(own, now, () => true);
  const monthsLeft = goal.targetDate === null ? null : monthsUntil(now, new Date(goal.targetDate));
  // La cuota se calcula con lo que faltaba al EMPEZAR el mes: si se usara lo
  // que falta hoy, aportar este mes bajaría la cuota y, siguiéndola, no se
  // llegaría a la meta (el mes en curso ya cuenta en monthsLeft).
  const remainingAtMonthStart = Math.max(0, goal.targetAmount - (saved - savedThisMonth));
  const monthlyNeeded =
    completed || monthsLeft === null
      ? null
      : // Si la fecha ya pasó, lo que falta es "para este mes".
        ceilToThousands(remainingAtMonthStart / Math.max(1, monthsLeft));

  return {
    saved,
    ratio: goal.targetAmount > 0 ? Math.min(1, Math.max(0, saved / goal.targetAmount)) : 0,
    remaining,
    completed,
    monthsLeft,
    monthlyNeeded,
    savedThisMonth,
  };
}

/**
 * Frase de ritmo para la lista y el detalle.
 *  - "Separa $ 260.000 al mes y llegas en junio."
 *  - "Te faltan $ 300.000 y la fecha era en octubre." (vencido)
 *  - "Te faltan $ 1.200.000. Sin fecha: a tu ritmo."
 */
export function paceSentence(
  goal: GoalLike,
  progress: GoalProgress,
  now: Date,
  format: (n: number) => string,
): string {
  if (progress.completed) return '¡Lo lograste! Ya tienes toda la plata.';
  if (goal.targetDate === null || progress.monthlyNeeded === null) {
    return `Te faltan ${format(progress.remaining)}. Sin fecha: a tu ritmo.`;
  }
  const when = monthYearLabel(new Date(goal.targetDate), now);
  if (progress.monthsLeft === 0) {
    return `Te faltan ${format(progress.remaining)} y la fecha era en ${when}.`;
  }
  if (progress.monthsLeft === 1) {
    return `Te faltan ${format(progress.remaining)} para este mes.`;
  }
  return `Separa ${format(progress.monthlyNeeded)} al mes y llegas en ${when}.`;
}

export interface GoalDraftInput {
  name: string;
  targetAmount: number;
}

/** Error en la voz de la app, o null si está bien. */
export function validateGoal(input: GoalDraftInput): string | null {
  if (!input.name.trim()) return 'Ponle un nombre: "Viaje", "Portátil", "Matrícula".';
  if (input.name.trim().length > GOAL_NAME_MAX) return 'Ese nombre es muy largo.';
  if (!Number.isInteger(input.targetAmount) || input.targetAmount <= 0) {
    return '¿Cuánto necesitas? Escribe el monto.';
  }
  return null;
}

/**
 * ¿Cuánto se puede retirar? Nunca más de lo que hay: el saldo de un
 * Apartado no puede quedar negativo.
 */
export function maxWithdrawal(saved: number): number {
  return Math.max(0, saved);
}
