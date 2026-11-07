/**
 * Acceso a datos del presupuesto. Driver síncrono (ver transactions-repo).
 */
import { and, asc, eq, gt, gte, inArray, lt, sql, sum } from 'drizzle-orm';

import type { Db } from '@/db/client';
import { budgetAlerts, budgets, categories, transactions, type Budget } from '@/db/schema';
import { monthKey, startOfMonth, startOfNextMonth } from '@/lib/dates';

import { ALERT_THRESHOLDS, pendingAlert, type AlertThreshold } from './budget-logic';

/** Topes con el nombre e ícono de su categoría. */
export function budgetsQuery(db: Db) {
  return db
    .select({
      id: budgets.id,
      categoryId: budgets.categoryId,
      limitAmount: budgets.limitAmount,
      categoryName: categories.name,
      categoryIcon: categories.icon,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .orderBy(asc(categories.sortOrder));
}

/**
 * Crea o cambia el tope de una categoría. Si cambia, los avisos del mes se
 * reinician: con un tope nuevo, el 80 % es otro número.
 */
export function setBudget(db: Db, categoryId: number, limitAmount: number, now: Date): void {
  if (!Number.isInteger(limitAmount) || limitAmount <= 0) {
    throw new Error(`setBudget: tope inválido (${limitAmount})`);
  }
  db.transaction((tx) => {
    tx.insert(budgets)
      .values({ categoryId, limitAmount })
      .onConflictDoUpdate({ target: budgets.categoryId, set: { limitAmount } })
      .run();
    tx.delete(budgetAlerts)
      .where(and(eq(budgetAlerts.month, monthKey(now)), eq(budgetAlerts.categoryId, categoryId)))
      .run();
  });
}

/** Quita el tope y lo devuelve (para deshacer). */
export function removeBudget(db: Db, categoryId: number): Budget | undefined {
  return db.delete(budgets).where(eq(budgets.categoryId, categoryId)).returning().get();
}

export function restoreBudget(db: Db, row: Budget): void {
  db.insert(budgets).values(row).onConflictDoNothing().run();
}

/**
 * Al deshacer o borrar un gasto: quita los avisos del mes que ya no se
 * alcanzan, para que vuelvan a salir cuando de verdad se llegue al 80 % o
 * al 100 %. (Si alguien anota $ 50.000 por error y lo deshace, el aviso de
 * "te pasaste" no debe quedar gastado para todo el mes.)
 */
export function reconcileBudgetAlerts(db: Db, categoryId: number | null, now: Date): void {
  if (categoryId === null) return;
  const budget = db
    .select({ limitAmount: budgets.limitAmount })
    .from(budgets)
    .where(eq(budgets.categoryId, categoryId))
    .get();
  if (!budget) return;
  const spent = categorySpent(
    db,
    categoryId,
    startOfMonth(now).getTime(),
    startOfNextMonth(now).getTime(),
  );
  db.delete(budgetAlerts)
    .where(
      and(
        eq(budgetAlerts.month, monthKey(now)),
        eq(budgetAlerts.categoryId, categoryId),
        // threshold % del tope > lo gastado  ⇔  threshold × tope > gastado × 100
        gt(sql`${budgetAlerts.threshold} * ${budget.limitAmount}`, spent * 100),
      ),
    )
    .run();
}

/** Gasto de una categoría entre [from, to). */
export function categorySpent(db: Db, categoryId: number, from: number, to: number): number {
  const row = db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(
      and(
        eq(transactions.categoryId, categoryId),
        inArray(transactions.type, ['expense', 'transfer_out']),
        gte(transactions.occurredAt, from),
        lt(transactions.occurredAt, to),
      ),
    )
    .get();
  return Number(row?.total ?? 0);
}

export interface BudgetAlertHit {
  threshold: AlertThreshold;
  categoryName: string;
  spent: number;
  limitAmount: number;
}

/**
 * Después de registrar un gasto: ¿hay que avisar? Si sí, deja el aviso
 * marcado como mostrado (también los umbrales menores) y lo devuelve.
 * Lo usan el registro rápido y, en la Fase 3, los pendientes confirmados.
 */
export function checkBudgetAlert(
  db: Db,
  categoryId: number | null,
  occurredAt: number,
  now: Date,
): BudgetAlertHit | null {
  if (categoryId === null) return null;
  const when = new Date(occurredAt);
  // Un gasto de otro mes (p. ej. "ayer" el día 1) no mueve el presupuesto de este.
  if (monthKey(when) !== monthKey(now)) return null;

  const budget = db
    .select({ limitAmount: budgets.limitAmount, categoryName: categories.name })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .where(eq(budgets.categoryId, categoryId))
    .get();
  if (!budget) return null;

  const month = monthKey(now);
  const spent = categorySpent(
    db,
    categoryId,
    startOfMonth(now).getTime(),
    startOfNextMonth(now).getTime(),
  );
  const shown = new Set(
    db
      .select({ threshold: budgetAlerts.threshold })
      .from(budgetAlerts)
      .where(and(eq(budgetAlerts.month, month), eq(budgetAlerts.categoryId, categoryId)))
      .all()
      .map((r) => r.threshold),
  );
  const threshold = pendingAlert(spent, budget.limitAmount, shown);
  if (threshold === null) return null;

  const rows = ALERT_THRESHOLDS.filter((t) => t <= threshold).map((t) => ({
    month,
    categoryId,
    threshold: t,
    shownAt: now.getTime(),
  }));
  db.insert(budgetAlerts).values(rows).onConflictDoNothing().run();

  return { threshold, categoryName: budget.categoryName, spent, limitAmount: budget.limitAmount };
}
