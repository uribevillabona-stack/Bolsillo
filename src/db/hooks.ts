/**
 * Hooks de datos en vivo. Cada uno se vuelve a consultar cuando cambia la
 * tabla principal de su consulta (`useLiveQuery` + `enableChangeListener`).
 *
 * Ojo: `useLiveQuery` solo escucha la tabla del `from`, no las del join.
 * Si se renombra una categoría, la lista de movimientos se refresca en el
 * siguiente cambio de movimientos o al volver a montar la pantalla.
 */
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { budgetsQuery } from '@/features/budget/budget-repo';
import { categoriesQuery } from '@/features/categories/categories-repo';
import {
  anyTransactionQuery,
  firstHormigaAtQuery,
  hormigaExpensesSinceQuery,
  transactionsBetweenQuery,
} from '@/features/expenses/transactions-repo';
import { contributionsQuery, goalsQuery } from '@/features/goals/goals-repo';
import { profileQuery } from '@/features/profile/profile-repo';
import { dismissalsQuery } from '@/features/recommendations/recommendations-repo';
import { shortcutsQuery } from '@/features/shortcuts/shortcuts-repo';

import { db } from './client';

export function useProfile() {
  const { data } = useLiveQuery(profileQuery(db));
  return data[0];
}

export function useShortcuts() {
  return useLiveQuery(shortcutsQuery(db)).data;
}

export function useCategories(kind: 'expense' | 'income') {
  return useLiveQuery(categoriesQuery(db, kind), [kind]).data;
}

/** Movimientos entre [from, to). */
export function useTransactionsBetween(from: number, to: number) {
  return useLiveQuery(transactionsBetweenQuery(db, from, to), [from, to]).data;
}

/** Gastos hormiga desde `from`. */
export function useHormigaExpensesSince(from: number) {
  return useLiveQuery(hormigaExpensesSinceQuery(db, from), [from]).data;
}

/** Fecha del primer gasto hormiga de toda la historia (null si no hay). */
export function useFirstHormigaAt(): number | null {
  return useLiveQuery(firstHormigaAtQuery(db)).data[0]?.first ?? null;
}

/**
 * Topes de presupuesto con su categoría. El nombre y el ícono se toman de
 * la consulta en vivo de categorías: el join solo escucha `budgets`, y
 * renombrar una categoría no refrescaría el Plan.
 */
export function useBudgets() {
  const rows = useLiveQuery(budgetsQuery(db)).data;
  const categories = useCategories('expense');
  return rows.map((b) => {
    const c = categories.find((x) => x.id === b.categoryId);
    return c ? { ...b, categoryName: c.name, categoryIcon: c.icon } : b;
  });
}

/**
 * Apartados activos. `loaded` es false hasta la primera lectura: la consulta
 * en vivo arranca con una lista vacía, y sin esto una pantalla diría "no
 * tienes Apartados" por un instante.
 */
export function useGoals() {
  const { data, updatedAt } = useLiveQuery(goalsQuery(db));
  return { goals: data, loaded: updatedAt !== undefined };
}

/** Todos los aportes y retiros (se escucha su propia tabla, no la de goals). */
export function useContributions() {
  const { data, updatedAt } = useLiveQuery(contributionsQuery(db));
  return { contributions: data, loaded: updatedAt !== undefined };
}

/** ruleKey → cuándo se descartó. */
export function useDismissals(): Map<string, number> {
  const rows = useLiveQuery(dismissalsQuery(db)).data;
  return new Map(rows.map((r) => [r.ruleKey, r.dismissedAt]));
}

/** ¿Hay algún movimiento en toda la historia? undefined mientras carga. */
export function useHasAnyMovement(): boolean | undefined {
  const { data, updatedAt } = useLiveQuery(anyTransactionQuery(db));
  return updatedAt === undefined ? undefined : data.length > 0;
}
