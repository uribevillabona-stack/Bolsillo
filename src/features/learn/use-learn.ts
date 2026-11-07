/**
 * Datos en vivo de Aprende: progreso, racha y la próxima lección sugerida.
 */
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '@/db/client';
import { useHormigaExpensesSince, useProfile } from '@/db/hooks';
import { addMonths, startOfMonth } from '@/lib/dates';

import { hormigaGrowth, pickNextLesson, recentWeeks, weeklyStreak, weekStart } from './learn-logic';
import { completionsQuery, movementTimesSinceQuery } from './learn-repo';
import { LESSONS } from './lessons';

/** Semanas que se dibujan en la racha. */
export const STREAK_WEEKS_SHOWN = 8;

export interface LearnSignals {
  /** Categoría con tope en 80 % o más, si hay (de useMonthOverview). */
  tightBudget: string | null;
  goalsCount: number;
}

export function useLearn(now: Date, signals: LearnSignals) {
  const profile = useProfile();
  const completions = useLiveQuery(completionsQuery(db)).data;

  // Racha: basta con mirar un poco más atrás de lo que se dibuja; una racha
  // más larga se cuenta con las lecciones (que se leen completas).
  const streakFrom = weekStart(now).getTime() - 52 * 7 * 24 * 60 * 60 * 1000;
  const movements = useLiveQuery(movementTimesSinceQuery(db, streakFrom), [streakFrom]).data;
  const hormigas = useHormigaExpensesSince(addMonths(startOfMonth(now), -1).getTime());

  const completedIds = new Set(completions.map((c) => c.lessonId));
  const streakInput = {
    lessonCompletions: completions.map((c) => c.completedAt),
    movementDays: movements.map((m) => m.createdAt),
  };

  const next = pickNextLesson({
    lessons: LESSONS,
    completedIds,
    diagnostic: profile?.diagnostic ?? null,
    hormigaGrowth: hormigaGrowth(hormigas, now),
    tightBudget: signals.tightBudget,
    goalsCount: signals.goalsCount,
  });

  return {
    lessons: LESSONS,
    completedIds,
    completedCount: LESSONS.filter((l) => completedIds.has(l.id)).length,
    streak: weeklyStreak(streakInput, now),
    recent: recentWeeks(streakInput, now, STREAK_WEEKS_SHOWN),
    next,
  };
}
