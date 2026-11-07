/**
 * Exportar e importar el respaldo (efectos: base de datos y archivos).
 *
 * Exportar: arma el JSON, lo escribe en la caché de la app y abre el menú
 * "Compartir" de Android (Drive, WhatsApp, correo...). Nada se sube solo.
 * Importar: el usuario elige un archivo, se valida completo y se reemplazan
 * TODOS los datos en una sola transacción (o todo, o nada).
 */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { useSnackbarStore } from '@/components/snackbar-store';
import type { Db } from '@/db/client';
import { chunk } from '@/lib/chunk';
import {
  budgetAlerts,
  budgets,
  categories,
  goalContributions,
  goals,
  profile,
  recommendationDismissals,
  shortcuts,
  transactions,
} from '@/db/schema';

import {
  backupDataSchema,
  backupFileName,
  buildBackup,
  parseBackup,
  type Backup,
  type BackupData,
} from './backup-format';

export function collectBackupData(db: Db): BackupData {
  const profileRow = db.select().from(profile).get();
  if (!profileRow) throw new Error('No hay perfil para respaldar.');
  // Se valida también al exportar: si algo no cumple el formato, mejor
  // saberlo ahora que cuando el usuario intente restaurar.
  return backupDataSchema.parse({
    profile: profileRow,
    categories: db.select().from(categories).all(),
    transactions: db.select().from(transactions).all(),
    shortcuts: db.select().from(shortcuts).all(),
    goals: db.select().from(goals).all(),
    goalContributions: db.select().from(goalContributions).all(),
    budgets: db.select().from(budgets).all(),
  });
}

/** Escribe el respaldo y abre el menú de compartir. Devuelve cuántos movimientos incluyó. */
export async function exportBackup(db: Db, now = new Date()): Promise<number> {
  const backup = buildBackup(collectBackupData(db), now);
  const file = new File(Paths.cache, backupFileName(now));
  if (file.exists) file.delete();
  file.create();
  await file.write(JSON.stringify(backup, null, 2));

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Este teléfono no permite compartir archivos.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Guardar respaldo de BOLSILLO',
  });
  return backup.data.transactions.length;
}

export type PickResult =
  | { status: 'canceled' }
  | { status: 'invalid'; error: string }
  | { status: 'ready'; backup: Backup };

/** Abre el selector de archivos y valida el respaldo elegido (no escribe nada). */
export async function pickBackup(): Promise<PickResult> {
  const picked = await File.pickFileAsync({ mimeTypes: ['application/json', 'text/plain', '*/*'] });
  if (picked.canceled) return { status: 'canceled' };
  const parsed = parseBackup(await picked.result.text());
  return parsed.ok
    ? { status: 'ready', backup: parsed.backup }
    : { status: 'invalid', error: parsed.error };
}

/** Reemplaza todos los datos por los del respaldo. Atómico. */
export function restoreBackup(db: Db, backup: Backup): void {
  const { data } = backup;
  db.transaction((tx) => {
    // Orden inverso a las llaves foráneas.
    tx.delete(recommendationDismissals).run();
    tx.delete(budgetAlerts).run();
    tx.delete(budgets).run();
    tx.delete(goalContributions).run();
    tx.delete(goals).run();
    tx.delete(shortcuts).run();
    tx.delete(transactions).run();
    tx.delete(categories).run();
    tx.delete(profile).run();

    tx.insert(profile).values(data.profile).run();
    // Por lotes: un INSERT usa una variable por columna y fila, y SQLite
    // admite 32.766 por sentencia. Con 10 columnas, un solo INSERT fallaría
    // desde ~3.300 movimientos (y con él, el "Deshacer" de la restauración).
    for (const rows of chunk(data.categories, INSERT_BATCH))
      tx.insert(categories).values(rows).run();
    for (const rows of chunk(data.transactions, INSERT_BATCH))
      tx.insert(transactions).values(rows).run();
    for (const rows of chunk(data.shortcuts, INSERT_BATCH)) tx.insert(shortcuts).values(rows).run();
    for (const rows of chunk(data.goals, INSERT_BATCH)) tx.insert(goals).values(rows).run();
    for (const rows of chunk(data.goalContributions, INSERT_BATCH))
      tx.insert(goalContributions).values(rows).run();
    for (const rows of chunk(data.budgets, INSERT_BATCH)) tx.insert(budgets).values(rows).run();
  });
  // Un "Deshacer" que siga en pantalla apunta a ids de antes de restaurar:
  // podría borrar una fila del respaldo con el mismo id.
  useSnackbarStore.getState().dismiss();
}

/** Filas por INSERT: 500 × 10 columnas = 5.000 variables, lejos del límite de SQLite. */
export const INSERT_BATCH = 500;
