/**
 * Esquema de la base de datos local (SQLite en el teléfono).
 *
 * Convenciones:
 * - Montos: INTEGER en pesos colombianos, siempre positivos. El signo lo da
 *   `type` (un egreso de $ 2.500 se guarda como 2500 con type 'expense').
 * - Fechas: INTEGER con milisegundos desde epoch (Date.now()).
 * - Booleanos: INTEGER 0/1 (modo 'boolean' de Drizzle).
 *
 * Fases siguientes agregan tablas con migraciones nuevas
 * (pending_movements, merchant_rules, budgets, lesson_progress...).
 * Para cambiar el esquema: editar este archivo y correr `npm run db:generate`.
 */
import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const createdAt = () =>
  integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

/** Perfil del usuario. Siempre una sola fila con id = 1. */
export const profile = sqliteTable('profile', {
  id: integer('id').primaryKey(),
  name: text('name').notNull().default(''),
  /** mesada | beca | sueldo | emprendimiento | varios */
  incomeType: text('income_type'),
  /** Rango elegido en el onboarding (id del rango). */
  incomeRange: text('income_range'),
  /** Ingreso mensual de referencia para el "disponible del mes". */
  monthlyIncomeEstimate: integer('monthly_income_estimate').notNull().default(0),
  /** Respuestas del mini diagnóstico (JSON). */
  diagnostic: text('diagnostic', { mode: 'json' }).$type<Record<string, string>>(),
  /** El usuario aceptó la detección automática (Fase 3 la activa). */
  detectionConsent: integer('detection_consent', { mode: 'boolean' }).notNull().default(false),
  themePreference: text('theme_preference').notNull().default('system'),
  onboardingDone: integer('onboarding_done', { mode: 'boolean' }).notNull().default(false),
  createdAt: createdAt(),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  /** Identificador estable para semillas y respaldos ("cafe", "transporte"). */
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  /** Clave del ícono en `src/features/categories/category-icons.ts`. */
  icon: text('icon').notNull(),
  /** expense | income */
  kind: text('kind').notNull(),
  /** Gasto hormiga: pequeño y repetido. Alimenta la vista Hormigas. */
  isHormiga: integer('is_hormiga', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
});

export const transactions = sqliteTable(
  'transactions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    /** expense | income | transfer_in | transfer_out */
    type: text('type').notNull(),
    amount: integer('amount').notNull(),
    categoryId: integer('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    note: text('note'),
    merchant: text('merchant'),
    bank: text('bank'),
    occurredAt: integer('occurred_at').notNull(),
    /** manual | shortcut | detected | shared */
    source: text('source').notNull().default('manual'),
    createdAt: createdAt(),
  },
  (t) => [
    index('transactions_occurred_at_idx').on(t.occurredAt),
    index('transactions_category_idx').on(t.categoryId),
  ],
);

/** Atajos de un toque del registro rápido ("Tinto $ 2.500"). */
export const shortcuts = sqliteTable('shortcuts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(),
  icon: text('icon').notNull(),
  amount: integer('amount').notNull(),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  sortOrder: integer('sort_order').notNull().default(0),
});

/** Apartados: metas de ahorro (no se llaman "bolsillos": ese es el nombre de la app). */
export const goals = sqliteTable('goals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  targetAmount: integer('target_amount').notNull(),
  targetDate: integer('target_date'),
  createdAt: createdAt(),
  completedAt: integer('completed_at'),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
});

/** Aportes a un Apartado. Monto negativo = retiro. */
export const goalContributions = sqliteTable(
  'goal_contributions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    goalId: integer('goal_id')
      .notNull()
      .references(() => goals.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    note: text('note'),
    createdAt: createdAt(),
  },
  (t) => [index('goal_contributions_goal_idx').on(t.goalId)],
);

export type Profile = typeof profile.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Shortcut = typeof shortcuts.$inferSelect;
export type NewShortcut = typeof shortcuts.$inferInsert;
export type Goal = typeof goals.$inferSelect;
export type GoalContribution = typeof goalContributions.$inferSelect;

export type TransactionType = 'expense' | 'income' | 'transfer_in' | 'transfer_out';
export type TransactionSource = 'manual' | 'shortcut' | 'detected' | 'shared';
