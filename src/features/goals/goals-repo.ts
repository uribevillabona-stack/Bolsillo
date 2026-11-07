/**
 * Acceso a datos de los Apartados. Driver síncrono (ver transactions-repo).
 */
import { asc, desc, eq, sum } from 'drizzle-orm';

import type { Db } from '@/db/client';
import { goalContributions, goals, type Goal, type GoalContribution } from '@/db/schema';

import { validateGoal } from './goal-logic';

export interface GoalInput {
  name: string;
  targetAmount: number;
  targetDate: number | null;
}

/** Apartados activos, los más antiguos primero (el primero suele ser el más importante). */
export function goalsQuery(db: Db) {
  return db
    .select()
    .from(goals)
    .where(eq(goals.archived, false))
    .orderBy(asc(goals.createdAt), asc(goals.id));
}

/** Todos los aportes, recientes primero. Pocas filas: se agregan en JS. */
export function contributionsQuery(db: Db) {
  return db
    .select()
    .from(goalContributions)
    .orderBy(desc(goalContributions.createdAt), desc(goalContributions.id));
}

function assertValid(input: GoalInput): void {
  const problem = validateGoal(input);
  if (problem) throw new Error(problem);
}

export function createGoal(db: Db, input: GoalInput): Goal {
  assertValid(input);
  return db
    .insert(goals)
    .values({
      name: input.name.trim(),
      targetAmount: input.targetAmount,
      targetDate: input.targetDate,
    })
    .returning()
    .get();
}

export function updateGoal(db: Db, id: number, input: GoalInput): void {
  assertValid(input);
  db.transaction((tx) => {
    tx.update(goals)
      .set({
        name: input.name.trim(),
        targetAmount: input.targetAmount,
        targetDate: input.targetDate,
      })
      .where(eq(goals.id, id))
      .run();
    syncCompleted(tx, id, Date.now());
  });
}

export interface DeletedGoal {
  goal: Goal;
  contributions: GoalContribution[];
}

/** Borra el Apartado con sus aportes y los devuelve para poder deshacer. */
export function deleteGoal(db: Db, id: number): DeletedGoal | undefined {
  return db.transaction((tx) => {
    const contributions = tx
      .select()
      .from(goalContributions)
      .where(eq(goalContributions.goalId, id))
      .all();
    // Se borran explícitamente (no solo por ON DELETE CASCADE) para que el
    // aviso de cambios de SQLite llegue a la consulta en vivo de aportes.
    tx.delete(goalContributions).where(eq(goalContributions.goalId, id)).run();
    const goal = tx.delete(goals).where(eq(goals.id, id)).returning().get();
    return goal ? { goal, contributions } : undefined;
  });
}

export function restoreGoal(db: Db, deleted: DeletedGoal): void {
  db.transaction((tx) => {
    tx.insert(goals).values(deleted.goal).onConflictDoNothing().run();
    if (deleted.contributions.length > 0) {
      tx.insert(goalContributions).values(deleted.contributions).onConflictDoNothing().run();
    }
  });
}

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

function savedFor(tx: Tx | Db, goalId: number): number {
  const row = tx
    .select({ total: sum(goalContributions.amount) })
    .from(goalContributions)
    .where(eq(goalContributions.goalId, goalId))
    .get();
  return Number(row?.total ?? 0);
}

/**
 * Marca o desmarca "completado" según el saldo. Devuelve true si se acaba
 * de completar (para celebrarlo una sola vez).
 */
function syncCompleted(tx: Tx, goalId: number, now: number): boolean {
  const goal = tx.select().from(goals).where(eq(goals.id, goalId)).get();
  if (!goal) return false;
  const reached = savedFor(tx, goalId) >= goal.targetAmount;
  if (reached && goal.completedAt === null) {
    tx.update(goals).set({ completedAt: now }).where(eq(goals.id, goalId)).run();
    return true;
  }
  if (!reached && goal.completedAt !== null) {
    tx.update(goals).set({ completedAt: null }).where(eq(goals.id, goalId)).run();
  }
  return false;
}

export interface ContributionResult {
  row: GoalContribution;
  /** El aporte completó la meta justo ahora. */
  justCompleted: boolean;
}

export interface ContributionOptions {
  /** "Ya la tenía ahorrada": no resta del disponible del mes. Solo para aportes. */
  fromSavings?: boolean;
  now?: number;
}

/**
 * Aporte (monto > 0) o retiro (monto < 0). Un retiro nunca deja el
 * Apartado en negativo.
 */
/** Error para el usuario cuando un retiro dejaría el Apartado en negativo. */
export const OVERDRAW_MESSAGE = 'No puedes sacar más de lo que hay en el Apartado.';

export function addContribution(
  db: Db,
  goalId: number,
  amount: number,
  { fromSavings = false, now = Date.now() }: ContributionOptions = {},
): ContributionResult {
  if (!Number.isInteger(amount) || amount === 0) {
    throw new Error(`addContribution: monto inválido (${amount})`);
  }
  return db.transaction((tx) => {
    if (amount < 0 && savedFor(tx, goalId) + amount < 0) {
      throw new Error(OVERDRAW_MESSAGE);
    }
    const row = tx
      .insert(goalContributions)
      .values({ goalId, amount, fromSavings: amount > 0 && fromSavings, createdAt: now })
      .returning()
      .get();
    const justCompleted = syncCompleted(tx, goalId, now);
    return { row, justCompleted };
  });
}

/**
 * Deshacer un aporte o retiro. Quitar un aporte nunca puede dejar el
 * Apartado en negativo (si después hubo un retiro, primero hay que deshacer
 * ese retiro).
 */
export function removeContribution(db: Db, id: number): void {
  db.transaction((tx) => {
    const row = tx.select().from(goalContributions).where(eq(goalContributions.id, id)).get();
    if (!row) return;
    if (row.amount > 0 && savedFor(tx, row.goalId) - row.amount < 0) {
      throw new Error('Ya sacaste esa plata del Apartado: no se puede deshacer el aporte.');
    }
    tx.delete(goalContributions).where(eq(goalContributions.id, id)).run();
    syncCompleted(tx, row.goalId, Date.now());
  });
}
