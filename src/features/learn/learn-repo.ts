/**
 * Progreso de Aprende. Cada vez que se termina una lección se agrega una
 * fila (repetirla también cuenta para la racha). Driver síncrono.
 */
import { desc, gte } from 'drizzle-orm';

import type { Db } from '@/db/client';
import { lessonCompletions, transactions } from '@/db/schema';

export function recordCompletion(
  db: Db,
  lessonId: string,
  score: number,
  total: number,
  now = Date.now(),
): void {
  db.insert(lessonCompletions).values({ lessonId, score, total, completedAt: now }).run();
}

/** Todas las lecciones terminadas, recientes primero. */
export function completionsQuery(db: Db) {
  return db.select().from(lessonCompletions).orderBy(desc(lessonCompletions.completedAt));
}

/** Momentos en que se anotaron movimientos desde `from` (para la racha). */
export function movementTimesSinceQuery(db: Db, from: number) {
  return db
    .select({ createdAt: transactions.createdAt })
    .from(transactions)
    .where(gte(transactions.createdAt, from));
}
