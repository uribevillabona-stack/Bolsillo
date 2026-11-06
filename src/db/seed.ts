/**
 * Siembra idempotente: se puede correr en cada arranque sin duplicar nada.
 * - El perfil (id = 1) se crea si no existe.
 * - Categorías: se insertan las que falten (por `slug`).
 * - Atajos: solo en una instalación nueva (tabla vacía y onboarding sin
 *   terminar). Si el usuario borró todos sus atajos a propósito, no se los
 *   volvemos a crear.
 *
 * El driver de expo-sqlite en Drizzle es síncrono: dentro de una transacción
 * se usan `.run()`, `.get()` y `.all()` (sin await).
 */
import { count } from 'drizzle-orm';

import type { Db } from './client';
import { categories, profile, shortcuts } from './schema';
import { CATEGORY_SEEDS, SHORTCUT_SEEDS } from './seed-data';

export function seedDatabase(db: Db): void {
  db.transaction((tx) => {
    tx.insert(profile).values({ id: 1 }).onConflictDoNothing().run();

    tx.insert(categories)
      .values(CATEGORY_SEEDS.map((c, i) => ({ ...c, sortOrder: i })))
      .onConflictDoNothing({ target: categories.slug })
      .run();

    const shortcutCount = tx.select({ value: count() }).from(shortcuts).get()?.value ?? 0;
    const onboardingDone =
      tx.select({ done: profile.onboardingDone }).from(profile).get()?.done ?? false;
    if (shortcutCount > 0 || onboardingDone) return;

    const rows = tx.select({ id: categories.id, slug: categories.slug }).from(categories).all();
    const idBySlug = new Map(rows.map((r) => [r.slug, r.id]));
    tx.insert(shortcuts)
      .values(
        SHORTCUT_SEEDS.map((s, i) => ({
          label: s.label,
          icon: s.icon,
          amount: s.amount,
          categoryId: idBySlug.get(s.categorySlug) ?? null,
          sortOrder: i,
        })),
      )
      .run();
  });
}
