/**
 * Acceso a datos de movimientos. Capa delgada sobre Drizzle: la lógica de
 * negocio (totales, proyecciones) vive en funciones puras con pruebas.
 *
 * Driver síncrono: `.get()` / `.all()` / `.run()` ejecutan de inmediato.
 */
import { and, asc, desc, eq, gte, lt, min } from 'drizzle-orm';

import type { Db } from '@/db/client';
import {
  categories,
  transactions,
  type Transaction,
  type TransactionSource,
  type TransactionType,
} from '@/db/schema';

export interface NewExpenseInput {
  amount: number;
  categoryId: number | null;
  note?: string | null;
  occurredAt: number;
  source: TransactionSource;
}

export function addExpense(db: Db, input: NewExpenseInput): Transaction {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error(`addExpense: monto inválido (${input.amount})`);
  }
  return db
    .insert(transactions)
    .values({
      type: 'expense' satisfies TransactionType,
      amount: input.amount,
      categoryId: input.categoryId,
      note: input.note?.trim() || null,
      occurredAt: input.occurredAt,
      source: input.source,
    })
    .returning()
    .get();
}

/** Borra y devuelve la fila borrada (para poder deshacer). */
export function deleteTransaction(db: Db, id: number): Transaction | undefined {
  return db.delete(transactions).where(eq(transactions.id, id)).returning().get();
}

/** Deshacer un borrado: reinserta la fila exactamente como estaba (mismo id). */
export function restoreTransaction(db: Db, row: Transaction): void {
  db.insert(transactions).values(row).onConflictDoNothing().run();
}

/** Columnas de un movimiento junto con los datos de su categoría. */
export const transactionWithCategory = {
  id: transactions.id,
  type: transactions.type,
  amount: transactions.amount,
  note: transactions.note,
  merchant: transactions.merchant,
  occurredAt: transactions.occurredAt,
  source: transactions.source,
  categoryId: transactions.categoryId,
  categoryName: categories.name,
  categoryIcon: categories.icon,
  isHormiga: categories.isHormiga,
};

/** Consulta (sin ejecutar) de los movimientos entre [from, to), más recientes primero. */
export function transactionsBetweenQuery(db: Db, from: number, to: number) {
  return db
    .select(transactionWithCategory)
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(gte(transactions.occurredAt, from), lt(transactions.occurredAt, to)))
    .orderBy(desc(transactions.occurredAt), desc(transactions.id));
}

/** Gastos hormiga desde `from` (para totales del mes y la ventana de proyección). */
export function hormigaExpensesSinceQuery(db: Db, from: number) {
  return db
    .select({
      amount: transactions.amount,
      occurredAt: transactions.occurredAt,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryIcon: categories.icon,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.type, 'expense'),
        eq(categories.isHormiga, true),
        gte(transactions.occurredAt, from),
      ),
    )
    .orderBy(asc(transactions.occurredAt));
}

/** Consulta (sin ejecutar) de la fecha del primer gasto hormiga registrado. */
export function firstHormigaAtQuery(db: Db) {
  return db
    .select({ first: min(transactions.occurredAt) })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(eq(transactions.type, 'expense'), eq(categories.isHormiga, true)));
}

/** Un solo id, para saber si hay historia. */
export function anyTransactionQuery(db: Db) {
  return db.select({ id: transactions.id }).from(transactions).limit(1);
}

export type TransactionWithCategory = Awaited<ReturnType<typeof transactionsBetweenQuery>>[number];
