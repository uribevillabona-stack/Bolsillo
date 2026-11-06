import { and, asc, eq } from 'drizzle-orm';

import type { Db } from '@/db/client';
import { categories } from '@/db/schema';

/** Categorías activas de un tipo (gasto o ingreso), en el orden definido. */
export function categoriesQuery(db: Db, kind: 'expense' | 'income') {
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.kind, kind), eq(categories.archived, false)))
    .orderBy(asc(categories.sortOrder), asc(categories.id));
}
