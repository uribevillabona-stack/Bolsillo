/**
 * drizzle-kit: genera las migraciones SQL a partir de `src/db/schema.ts`.
 *   npm run db:generate
 * Las migraciones se aplican en el teléfono al abrir la app (useMigrations).
 */
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
