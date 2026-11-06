/**
 * Formato del respaldo JSON (lógica pura, probada).
 *
 * El respaldo es la única forma de "nube" de BOLSILLO, y es gratis: el
 * usuario guarda el archivo en su Drive o se lo manda por WhatsApp.
 * Al importar, el archivo se valida COMPLETO con zod antes de tocar la base
 * de datos: un archivo dañado o de otra app nunca deja datos a medias.
 */
import { z } from 'zod';

export const BACKUP_APP_ID = 'bolsillo';
/** Sube cuando cambie la forma de `data`. Ver `migrateBackup`. */
export const BACKUP_SCHEMA_VERSION = 1;

const id = z.int().positive();
const amount = z.int();
const timestamp = z.int().nonnegative();

const profileSchema = z.object({
  id: z.literal(1),
  name: z.string().max(80),
  incomeType: z.string().nullable(),
  incomeRange: z.string().nullable(),
  monthlyIncomeEstimate: z.int().nonnegative(),
  diagnostic: z.record(z.string(), z.string()).nullable(),
  detectionConsent: z.boolean(),
  themePreference: z.enum(['system', 'light', 'dark']),
  onboardingDone: z.boolean(),
  createdAt: timestamp,
});

const categorySchema = z.object({
  id,
  slug: z.string().min(1).max(60),
  name: z.string().min(1).max(60),
  icon: z.string().min(1).max(40),
  kind: z.enum(['expense', 'income']),
  isHormiga: z.boolean(),
  sortOrder: z.int(),
  archived: z.boolean(),
});

const transactionSchema = z.object({
  id,
  type: z.enum(['expense', 'income', 'transfer_in', 'transfer_out']),
  amount: amount.positive(),
  categoryId: id.nullable(),
  note: z.string().max(280).nullable(),
  merchant: z.string().max(120).nullable(),
  bank: z.string().max(60).nullable(),
  occurredAt: timestamp,
  source: z.enum(['manual', 'shortcut', 'detected', 'shared']),
  createdAt: timestamp,
});

const shortcutSchema = z.object({
  id,
  label: z.string().min(1).max(40),
  icon: z.string().min(1).max(40),
  amount: amount.positive(),
  categoryId: id.nullable(),
  sortOrder: z.int(),
});

const goalSchema = z.object({
  id,
  name: z.string().min(1).max(80),
  targetAmount: amount.positive(),
  targetDate: timestamp.nullable(),
  createdAt: timestamp,
  completedAt: timestamp.nullable(),
  archived: z.boolean(),
});

const goalContributionSchema = z.object({
  id,
  goalId: id,
  amount,
  note: z.string().max(280).nullable(),
  createdAt: timestamp,
});

export const backupDataSchema = z.object({
  profile: profileSchema,
  categories: z.array(categorySchema),
  transactions: z.array(transactionSchema),
  shortcuts: z.array(shortcutSchema),
  goals: z.array(goalSchema),
  goalContributions: z.array(goalContributionSchema),
});

export const backupSchema = z.object({
  app: z.literal(BACKUP_APP_ID),
  schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
  exportedAt: z.iso.datetime(),
  data: backupDataSchema,
});

export type BackupData = z.infer<typeof backupDataSchema>;
export type Backup = z.infer<typeof backupSchema>;

export function buildBackup(data: BackupData, now: Date): Backup {
  return {
    app: BACKUP_APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    data,
  };
}

/** Nombre del archivo: bolsillo-respaldo-2026-11-05.json */
export function backupFileName(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `bolsillo-respaldo-${y}-${m}-${d}.json`;
}

export type ParseResult = { ok: true; backup: Backup } | { ok: false; error: string };

/**
 * Lee y valida un respaldo. Además de la forma, revisa la integridad
 * referencial: un movimiento no puede apuntar a una categoría inexistente.
 */
export function parseBackup(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' };
  }

  if (
    typeof json !== 'object' ||
    json === null ||
    (json as { app?: unknown }).app !== BACKUP_APP_ID
  ) {
    return { ok: false, error: 'Este archivo no es un respaldo de BOLSILLO.' };
  }
  const version = (json as { schemaVersion?: unknown }).schemaVersion;
  if (typeof version === 'number' && version > BACKUP_SCHEMA_VERSION) {
    return {
      ok: false,
      error: 'El respaldo es de una versión más nueva de BOLSILLO. Actualiza la app primero.',
    };
  }

  const result = backupSchema.safeParse(json);
  if (!result.success) {
    return { ok: false, error: `El respaldo está dañado:\n${z.prettifyError(result.error)}` };
  }

  const { data } = result.data;
  const categoryIds = new Set(data.categories.map((c) => c.id));
  const goalIds = new Set(data.goals.map((g) => g.id));
  const badTx = data.transactions.find(
    (t) => t.categoryId !== null && !categoryIds.has(t.categoryId),
  );
  const badShortcut = data.shortcuts.find(
    (s) => s.categoryId !== null && !categoryIds.has(s.categoryId),
  );
  const badContribution = data.goalContributions.find((c) => !goalIds.has(c.goalId));
  if (badTx || badShortcut || badContribution) {
    return {
      ok: false,
      error: 'El respaldo está incompleto: hay datos que apuntan a otros que no existen.',
    };
  }

  return { ok: true, backup: result.data };
}
