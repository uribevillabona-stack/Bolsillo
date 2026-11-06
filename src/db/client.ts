/**
 * Conexión única a la base de datos local.
 *
 * `enableChangeListener` permite que `useLiveQuery` de Drizzle vuelva a
 * consultar cuando cambian las tablas: la UI se actualiza sola al guardar.
 */
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'bolsillo.db';

const sqlite = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
// SQLite no aplica llaves foráneas si no se pide explícitamente por conexión.
sqlite.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });

export type Db = typeof db;
