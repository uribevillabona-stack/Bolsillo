/**
 * Hooks de datos en vivo. Cada uno se vuelve a consultar cuando cambia la
 * tabla principal de su consulta (`useLiveQuery` + `enableChangeListener`).
 *
 * Ojo: `useLiveQuery` solo escucha la tabla del `from`, no las del join.
 * Si se renombra una categoría, la lista de movimientos se refresca en el
 * siguiente cambio de movimientos o al volver a montar la pantalla.
 */
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { categoriesQuery } from '@/features/categories/categories-repo';
import {
  firstHormigaAtQuery,
  hormigaExpensesSinceQuery,
  transactionsBetweenQuery,
} from '@/features/expenses/transactions-repo';
import { profileQuery } from '@/features/profile/profile-repo';
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
