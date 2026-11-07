/**
 * Motor de recomendaciones (lógica pura, probada). Sin IA ni servidores:
 * reglas locales evaluadas en orden de prioridad sobre los datos del
 * usuario. Inicio muestra UNA sola: la primera regla que aplica y que el
 * usuario no haya descartado hace poco.
 *
 * Cada recomendación tiene una clave con su sujeto ('budget-near:5'):
 * descartar el aviso de Domicilios no silencia el de Transporte.
 */
import type { Href } from 'expo-router';

import type { BudgetLine } from '@/features/budget/budget-logic';
import { dailyAllowance, percentLabel } from '@/features/budget/budget-logic';
import type { HormigaSummary } from '@/features/expenses/hormigas-stats';
import { projectionSentence } from '@/features/expenses/hormigas-stats';
import type { MonthTotals } from '@/features/expenses/month-totals';
import type { GoalLike, GoalProgress } from '@/features/goals/goal-logic';
import { monthKey } from '@/lib/dates';

/** Tras "Ahora no", la misma recomendación no vuelve en 3 días. */
export const DISMISS_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;

/** Desde qué día del mes el ritmo de gasto ya dice algo (antes es ruido). */
export const PACE_MIN_DAY = 7;
/** Desde qué día se avisa que un Apartado va atrasado este mes. */
export const GOAL_BEHIND_MIN_DAY = 15;
/** Proyección anual de hormigas que vale la pena mencionar. */
export const HORMIGA_MIN_PROJECTION = 100_000;
/** Por debajo de esto, "unos $ X al día" no dice nada útil. */
export const MIN_DAILY_TO_MENTION = 1_000;

export type RecommendationTone = 'alert' | 'neutral' | 'good';

export interface Recommendation {
  key: string;
  /** Etiqueta corta sobre el título ("Presupuesto", "Gastos hormiga"). */
  topic: string;
  title: string;
  body?: string;
  action?: { label: string; href: Href };
  tone: RecommendationTone;
}

export interface GoalWithProgress {
  goal: GoalLike;
  progress: GoalProgress;
}

export interface RecommendationContext {
  now: Date;
  /** Días del mes que faltan, contando hoy. */
  daysLeft: number;
  totals: MonthTotals;
  /** Ingreso del mes usado en el disponible (registrado o de referencia). */
  incomeBase: number;
  /** Cantidad de gastos registrados este mes. */
  monthExpenseCount: number;
  /** ¿Hay algún movimiento en toda la historia? */
  hasAnyMovement: boolean;
  budgets: readonly BudgetLine[];
  hormigas: HormigaSummary;
  goals: readonly GoalWithProgress[];
  /** Categoría con más gasto este mes. */
  topCategory: { name: string; spent: number } | null;
  /** ruleKey → momento en que se descartó. */
  dismissedAt: ReadonlyMap<string, number>;
}

/**
 * Una regla devuelve sus candidatas en orden (p. ej. todos los topes al
 * 80 %, el más apretado primero): si el usuario descartó una, sale la
 * siguiente del mismo tipo antes de pasar a otra regla.
 */
type Rule = (
  ctx: RecommendationContext,
  fmt: (n: number) => string,
) => Recommendation | readonly Recommendation[] | null;

function candidates(result: ReturnType<Rule>): readonly Recommendation[] {
  if (result === null) return [];
  return Array.isArray(result) ? result : [result as Recommendation];
}

const PLAN_HREF = '/plan' as Href;

const rules: readonly Rule[] = [
  // 0. Sin datos: el primer paso.
  (ctx) =>
    ctx.hasAnyMovement
      ? null
      : {
          key: 'start',
          topic: 'Para empezar',
          title: 'Arranca por lo pequeño.',
          body: 'Anota tu próximo tinto con el botón +. Con una semana de datos ya te podemos decir a dónde se te va la plata.',
          tone: 'neutral',
        },

  // 1. Gastó más de lo que le entra este mes.
  (ctx, fmt) =>
    ctx.incomeBase > 0 && ctx.totals.available < 0
      ? {
          key: `over-income:${monthKey(ctx.now)}`,
          topic: 'Este mes',
          title: `Vas ${fmt(-ctx.totals.available)} por encima de lo que te entra.`,
          body:
            ctx.daysLeft > 1
              ? `Quedan ${ctx.daysLeft} días. Lo que resta del mes, solo lo necesario.`
              : 'Mañana arranca un mes nuevo: buen momento para ponerle tope a lo que más pesó.',
          action: { label: 'Ver mi plan', href: PLAN_HREF },
          tone: 'alert',
        }
      : null,

  // 2. Topes alcanzados o pasados (el que más se pasó primero).
  (ctx, fmt) =>
    ctx.budgets
      .filter((b) => b.status === 'over')
      .sort((a, b) => b.overBy - a.overBy)
      .map((b) => ({
        key: `budget-over:${b.categoryId}:${monthKey(ctx.now)}`,
        topic: 'Presupuesto',
        title:
          b.overBy > 0
            ? `Te pasaste ${fmt(b.overBy)} en ${b.categoryName}.`
            : `Llegaste al tope de ${b.categoryName}.`,
        body:
          b.overBy > 0
            ? 'No pasa nada si es una vez. Si se repite, quizá el tope está muy apretado: ajústalo en Plan.'
            : `Lo que gastes en ${b.categoryName} de aquí a fin de mes ya va por encima de tu plan.`,
        action: { label: 'Ver presupuesto', href: PLAN_HREF },
        tone: 'alert' as const,
      })),

  // 3. Topes en el 80 % o más (vienen ordenados: el más apretado primero).
  (ctx, fmt) =>
    ctx.budgets
      .filter((b) => b.status === 'near')
      .map((near) => {
        const daily = dailyAllowance(near.remaining, ctx.daysLeft);
        return {
          key: `budget-near:${near.categoryId}:${monthKey(ctx.now)}`,
          topic: 'Presupuesto',
          title: `Vas en el ${percentLabel(near.spent, near.limitAmount)} de ${near.categoryName}.`,
          body:
            ctx.daysLeft <= 1
              ? `Te quedan ${fmt(near.remaining)} para hoy.`
              : daily >= MIN_DAILY_TO_MENTION
                ? `Te quedan ${fmt(near.remaining)} para ${ctx.daysLeft} días: unos ${fmt(daily)} al día.`
                : // "$ 100 al día" no ayuda a nadie: solo lo que queda y el plazo.
                  `Te quedan ${fmt(near.remaining)} para ${ctx.daysLeft} días.`,
          action: { label: 'Ver presupuesto', href: PLAN_HREF },
          tone: 'alert' as const,
        };
      }),

  // 4. Al ritmo actual, el mes no alcanza.
  (ctx, fmt) => {
    const day = ctx.now.getDate();
    if (day < PACE_MIN_DAY || ctx.incomeBase <= 0 || ctx.totals.available < 0) return null;
    const daysInMonth = day + ctx.daysLeft - 1;
    const projected = Math.round((ctx.totals.expenses / day) * daysInMonth);
    // Lo separado en Apartados también sale de lo que entra.
    if (projected + Math.max(0, ctx.totals.savedToGoals) <= ctx.incomeBase) return null;
    const daily = dailyAllowance(ctx.totals.available, ctx.daysLeft);
    return {
      key: `pace:${monthKey(ctx.now)}`,
      topic: 'Ritmo del mes',
      title: `A este ritmo gastarías ${fmt(roundThousands(projected))} este mes.`,
      body:
        daily > 0
          ? `Es más de lo que te entra. Te alcanza si gastas unos ${fmt(daily)} al día de aquí al final.`
          : 'Es más de lo que te entra. Lo que queda del mes, solo lo necesario.',
      tone: 'alert',
    };
  },

  // 5. Apartados con fecha que van atrasados este mes.
  (ctx, fmt) => {
    if (ctx.now.getDate() < GOAL_BEHIND_MIN_DAY) return null;
    return ctx.goals
      .filter(
        ({ progress }) =>
          !progress.completed &&
          progress.monthlyNeeded !== null &&
          progress.savedThisMonth < progress.monthlyNeeded,
      )
      .map(({ goal, progress }) => {
        const missing = progress.monthlyNeeded! - Math.max(0, progress.savedThisMonth);
        return {
          key: `goal-behind:${goal.id}:${monthKey(ctx.now)}`,
          topic: 'Apartados',
          title: `Para "${goal.name}" te faltan ${fmt(missing)} este mes.`,
          body: 'Si lo separas apenas te entre la plata, no se te va en otra cosa.',
          action: { label: 'Aportar', href: `/apartado/${goal.id}` as Href },
          tone: 'neutral' as const,
        };
      });
  },

  // 6. Hormigas que pesan, conectadas a un Apartado si hay uno.
  (ctx, fmt) => {
    const goal = ctx.goals.find(({ progress }) => !progress.completed);
    return ctx.hormigas.categories
      .filter((c) => c.annualProjection >= HORMIGA_MIN_PROJECTION)
      .map((top) => {
        const halfPerMonth = roundThousands(top.annualProjection / 12 / 2);
        return {
          key: `hormiga:${top.categoryId ?? 'none'}`,
          topic: 'Gastos hormiga',
          title: projectionSentence(top, fmt),
          body:
            goal && halfPerMonth > 0
              ? `Si le bajas a la mitad, son ${fmt(halfPerMonth)} al mes para "${goal.goal.name}".`
              : `Llevas ${fmt(ctx.hormigas.monthTotal)} en hormigas este mes.`,
          action: { label: 'Ver hormigas', href: '/movimientos?vista=hormigas' as Href },
          tone: 'neutral' as const,
        };
      });
  },

  // 7. Sin Apartados.
  (ctx, fmt) => {
    if (ctx.goals.length > 0) return null;
    const suggestion = ctx.incomeBase > 0 ? roundThousands(ctx.incomeBase * 0.05) : 0;
    return {
      key: 'no-goal',
      topic: 'Apartados',
      title: 'Todavía no tienes un Apartado.',
      body:
        suggestion > 0
          ? `Separar ${fmt(suggestion)} al mes (el 5 % de lo que te entra) ya es un comienzo.`
          : 'Plata separada para algo concreto: el viaje, el portátil, la matrícula.',
      action: { label: 'Crear Apartado', href: PLAN_HREF },
      tone: 'neutral',
    };
  },

  // 8. Sin topes y ya con varios gastos: proponer el primero.
  (ctx, fmt) => {
    if (ctx.budgets.length > 0 || ctx.monthExpenseCount < 5 || !ctx.topCategory) return null;
    return {
      key: 'no-budget',
      topic: 'Presupuesto',
      title: `Ponle tope a ${ctx.topCategory.name}.`,
      body: `Es donde más se te va este mes: ${fmt(ctx.topCategory.spent)}. Te avisamos con calma al 80 %.`,
      action: { label: 'Poner tope', href: PLAN_HREF },
      tone: 'neutral',
    };
  },

  // 9. Va bien: decirlo también cuenta.
  (ctx, fmt) => {
    const day = ctx.now.getDate();
    if (day < PACE_MIN_DAY || ctx.incomeBase <= 0 || ctx.monthExpenseCount === 0) return null;
    const daysInMonth = day + ctx.daysLeft - 1;
    const projected = (ctx.totals.expenses / day) * daysInMonth;
    const leftover = roundThousands(ctx.incomeBase - ctx.totals.savedToGoals - projected);
    if (leftover <= 0) return null;
    return {
      key: `good-pace:${monthKey(ctx.now)}`,
      topic: 'Ritmo del mes',
      title: 'Vas bien este mes.',
      body: `Al ritmo de ahora te sobrarían unos ${fmt(leftover)}. Si los mandas a un Apartado, no se pierden.`,
      tone: 'good',
    };
  },
];

function roundThousands(n: number): number {
  return Math.round(n / 1000) * 1000;
}

function isDismissed(key: string, ctx: RecommendationContext): boolean {
  const at = ctx.dismissedAt.get(key);
  return at !== undefined && ctx.now.getTime() - at < DISMISS_COOLDOWN_MS;
}

/** La recomendación a mostrar, o null si ninguna aplica. */
export function pickRecommendation(
  ctx: RecommendationContext,
  format: (n: number) => string,
): Recommendation | null {
  for (const rule of rules) {
    for (const rec of candidates(rule(ctx, format))) {
      if (!isDismissed(rec.key, ctx)) return rec;
    }
  }
  return null;
}

/** Todas las que aplican, sin filtrar descartes (para pruebas y depuración). */
export function allRecommendations(
  ctx: RecommendationContext,
  format: (n: number) => string,
): Recommendation[] {
  return rules.flatMap((r) => candidates(r(ctx, format)));
}
