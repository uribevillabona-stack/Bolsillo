/**
 * Atajos de un toque del registro rápido. El usuario los crea, edita y borra
 * en Ajustes → Atajos.
 */
import { asc, eq, max } from 'drizzle-orm';

import type { Db } from '@/db/client';
import { shortcuts, type NewShortcut, type Shortcut } from '@/db/schema';
import { MAX_AMOUNT } from '@/lib/money';

export type ShortcutInput = Pick<NewShortcut, 'label' | 'icon' | 'amount' | 'categoryId'>;

export const SHORTCUT_LABEL_MAX = 20;

/** Valida un atajo; devuelve el mensaje de error para mostrar, o null si está bien. */
export function validateShortcut(input: ShortcutInput): string | null {
  const label = input.label.trim();
  if (label.length === 0) return 'Ponle un nombre al atajo.';
  if (label.length > SHORTCUT_LABEL_MAX) return `Máximo ${SHORTCUT_LABEL_MAX} caracteres.`;
  if (!Number.isInteger(input.amount) || input.amount <= 0) return 'El monto debe ser mayor a $ 0.';
  if (input.amount > MAX_AMOUNT) return 'Ese monto es demasiado grande.';
  return null;
}

export function shortcutsQuery(db: Db) {
  return db.select().from(shortcuts).orderBy(asc(shortcuts.sortOrder), asc(shortcuts.id));
}

export function createShortcut(db: Db, input: ShortcutInput): Shortcut {
  const error = validateShortcut(input);
  if (error) throw new Error(error);
  const next =
    (db
      .select({ value: max(shortcuts.sortOrder) })
      .from(shortcuts)
      .get()?.value ?? -1) + 1;
  return db
    .insert(shortcuts)
    .values({ ...input, label: input.label.trim(), sortOrder: next })
    .returning()
    .get();
}

export function updateShortcut(db: Db, id: number, input: ShortcutInput): void {
  const error = validateShortcut(input);
  if (error) throw new Error(error);
  db.update(shortcuts)
    .set({ ...input, label: input.label.trim() })
    .where(eq(shortcuts.id, id))
    .run();
}

export function deleteShortcut(db: Db, id: number): Shortcut | undefined {
  return db.delete(shortcuts).where(eq(shortcuts.id, id)).returning().get();
}

export function restoreShortcut(db: Db, row: Shortcut): void {
  db.insert(shortcuts).values(row).onConflictDoNothing().run();
}
