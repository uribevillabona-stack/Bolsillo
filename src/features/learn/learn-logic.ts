/**
 * Aprende (lógica pura, probada): qué lección sugerir según los datos del
 * usuario, la racha semanal y el progreso.
 *
 * Nada se bloquea: todas las lecciones están abiertas. Lo que cambia según
 * el comportamiento es cuál se recomienda y por qué ("Tus gastos hormiga
 * van 35 % arriba"). Así se conecta el contenido con la plata real sin
 * gamificación invasiva.
 */
import { startOfDay, startOfMonth } from '@/lib/dates';

import { LESSON_IDS, type Lesson } from './lessons';

/** Subida de hormigas (frente al mismo tramo del mes pasado) que dispara la sugerencia. */
export const HORMIGA_GROWTH_TRIGGER = 0.3;
/** Días distintos con movimientos anotados para que una semana cuente en la racha. */
export const ACTIVE_DAYS_PER_WEEK = 3;

// ---------------------------------------------------------------------------
// Semanas y racha

/** Lunes 00:00 de la semana de `date` (semana colombiana: lunes a domingo). */
export function weekStart(date: Date): Date {
  const d = startOfDay(date);
  const offset = (d.getDay() + 6) % 7; // lunes = 0
  d.setDate(d.getDate() - offset);
  return d;
}

export interface StreakInput {
  /** Momentos en que terminó una lección. */
  lessonCompletions: readonly number[];
  /** Momentos en que se anotó un movimiento (createdAt). */
  movementDays: readonly number[];
}

/** Claves de semana ("2026-11-02") que cuentan como activas. */
export function activeWeeks(input: StreakInput): Set<string> {
  const weeks = new Set<string>();
  const key = (t: number) => weekStart(new Date(t)).getTime().toString();

  for (const t of input.lessonCompletions) weeks.add(key(t));

  const daysByWeek = new Map<string, Set<number>>();
  for (const t of input.movementDays) {
    const k = key(t);
    let days = daysByWeek.get(k);
    if (!days) daysByWeek.set(k, (days = new Set()));
    days.add(startOfDay(new Date(t)).getTime());
  }
  for (const [k, days] of daysByWeek) if (days.size >= ACTIVE_DAYS_PER_WEEK) weeks.add(k);
  return weeks;
}

export interface WeeklyStreak {
  /** Semanas seguidas activas. */
  weeks: number;
  /** ¿La semana en curso ya cuenta? */
  thisWeekDone: boolean;
}

/**
 * Racha semanal: una semana cuenta si terminaste una lección o anotaste
 * movimientos al menos 3 días distintos. La semana en curso no rompe la
 * racha mientras no termine: hasta el domingo hay tiempo.
 */
export function weeklyStreak(input: StreakInput, now: Date): WeeklyStreak {
  const weeks = activeWeeks(input);
  const current = weekStart(now);
  const thisWeekDone = weeks.has(current.getTime().toString());

  let count = 0;
  // Se recalcula el lunes con weekStart en cada paso (no sumando ms ni con
  // setDate sobre la hora): en zonas con cambio de hora a medianoche el lunes
  // puede no tener 00:00, y la clave dejaría de coincidir.
  const previousWeek = (d: Date) =>
    weekStart(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7));
  let cursor = thisWeekDone ? current : previousWeek(current);
  while (weeks.has(cursor.getTime().toString())) {
    count += 1;
    cursor = previousWeek(cursor);
  }
  return { weeks: count, thisWeekDone };
}

/** Las últimas `n` semanas (la más vieja primero), para dibujar la racha. */
export function recentWeeks(input: StreakInput, now: Date, n = 8): boolean[] {
  const weeks = activeWeeks(input);
  const out: boolean[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = weekStart(now);
    const week = weekStart(new Date(d.getFullYear(), d.getMonth(), d.getDate() - i * 7));
    out.push(weeks.has(week.getTime().toString()));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Hormigas: ¿subieron frente al mes pasado?

/** Por debajo de esto, el tramo del mes pasado es muy poco para comparar. */
export const MIN_GROWTH_BASE = 20_000;

/**
 * Crecimiento de los gastos hormiga del mes en curso frente al mismo tramo
 * del mes pasado (del 1 al mismo día y hora), comparando el gasto POR DÍA:
 * el 31 de marzo tiene 3 días más que todo febrero. null si el mes pasado
 * hubo muy poco en ese tramo: con $ 2.000 de base, cualquier tinto es "+50 %".
 */
export function hormigaGrowth(
  rows: readonly { amount: number; occurredAt: number }[],
  now: Date,
): number | null {
  const thisStart = startOfMonth(now).getTime();
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  // Mismo día del mes pasado (acotado: el 31 de marzo se compara con el 28/29 de febrero).
  const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  const sameDay = Math.min(now.getDate(), prevMonthDays);
  const prevEnd =
    new Date(now.getFullYear(), now.getMonth() - 1, sameDay).getTime() +
    (now.getTime() - startOfDay(now).getTime());

  let current = 0;
  let previous = 0;
  for (const r of rows) {
    if (r.occurredAt >= thisStart && r.occurredAt <= now.getTime()) current += r.amount;
    else if (r.occurredAt >= prevStart && r.occurredAt <= prevEnd) previous += r.amount;
  }
  if (previous < MIN_GROWTH_BASE) return null;
  const perDayNow = current / now.getDate();
  const perDayBefore = previous / sameDay;
  return perDayNow / perDayBefore - 1;
}

// ---------------------------------------------------------------------------
// Próxima lección

export interface NextLessonContext {
  lessons: readonly Lesson[];
  completedIds: ReadonlySet<string>;
  /** Respuestas del diagnóstico del onboarding (questionId → optionId). */
  diagnostic: Readonly<Record<string, string>> | null;
  /** Ver `hormigaGrowth`. */
  hormigaGrowth: number | null;
  /** Categoría con tope en 80 % o más (la más apretada), si hay. */
  tightBudget: string | null;
  goalsCount: number;
}

export interface NextLesson {
  lesson: Lesson;
  /** Por qué esta y no otra, en la voz de la app. */
  reason: string;
}

type Rule = (ctx: NextLessonContext) => { id: string; reason: string } | null;

const rules: readonly Rule[] = [
  (ctx) =>
    ctx.hormigaGrowth !== null && ctx.hormigaGrowth >= HORMIGA_GROWTH_TRIGGER
      ? {
          id: LESSON_IDS.hormigas,
          reason: `Tus gastos hormiga van ${Math.round(ctx.hormigaGrowth * 100)} % arriba frente al mes pasado.`,
        }
      : null,
  (ctx) =>
    ctx.tightBudget
      ? { id: LESSON_IDS.presupuesto, reason: `Vas apretado en ${ctx.tightBudget} este mes.` }
      : null,
  (ctx) =>
    ctx.diagnostic?.['credito'] === 'pago-minimo'
      ? { id: LESSON_IDS.credito, reason: 'Nos contaste que pagas el mínimo de la tarjeta.' }
      : null,
  (ctx) =>
    ctx.diagnostic?.['estafas'] === 'varias' || ctx.diagnostic?.['estafas'] === 'una-vez'
      ? {
          id: LESSON_IDS.estafas,
          reason: 'Ya te han intentado estafar: que la próxima no te agarre desprevenido.',
        }
      : null,
  (ctx) =>
    ctx.diagnostic?.['sabe-gasto'] === 'no'
      ? { id: LESSON_IDS.hormigas, reason: 'Nos contaste que no sabes bien cuánto gastas.' }
      : null,
  (ctx) =>
    ctx.diagnostic?.['fin-de-mes'] === 'casi-nunca'
      ? {
          id: LESSON_IDS.presupuesto,
          reason: 'Nos contaste que casi nunca te queda plata a fin de mes.',
        }
      : null,
  (ctx) =>
    ctx.diagnostic?.['emergencia'] === 'no'
      ? {
          id: LESSON_IDS.emergencia,
          reason: 'Nos contaste que no tienes con qué cubrir un imprevisto.',
        }
      : ctx.goalsCount === 0
        ? {
            id: LESSON_IDS.emergencia,
            reason: 'Aún no tienes Apartados: el de emergencias es buen comienzo.',
          }
        : null,
];

/** La lección a sugerir, o null si ya las terminó todas. */
export function pickNextLesson(ctx: NextLessonContext): NextLesson | null {
  const pending = ctx.lessons.filter((l) => !ctx.completedIds.has(l.id));
  if (pending.length === 0) return null;

  for (const rule of rules) {
    const hit = rule(ctx);
    const lesson = hit ? pending.find((l) => l.id === hit.id) : undefined;
    if (hit && lesson) return { lesson, reason: hit.reason };
  }
  const first = pending[0]!;
  return {
    lesson: first,
    reason: ctx.completedIds.size === 0 ? 'Empieza por aquí: es la base.' : 'Sigue con la próxima.',
  };
}

// ---------------------------------------------------------------------------
// Quiz

export function quizScore(
  answers: readonly (number | null)[],
  quiz: readonly { answer: number }[],
): number {
  return quiz.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0);
}

/** "3 de 3: ¡perfecto!" · "2 de 3" … en la voz de la app. */
export function scoreMessage(score: number, total: number): string {
  if (score === total) return '¡Todas bien! Esto ya es tuyo.';
  if (score === 0) return 'Ninguna esta vez. Repasa las tarjetas cuando quieras: no hay afán.';
  return `${score} de ${total}. Vas bien: cuando quieras, repásala y la sacas completa.`;
}
