/**
 * Descartes de recomendaciones ("Ahora no").
 */
import { eq } from 'drizzle-orm';

import type { Db } from '@/db/client';
import { recommendationDismissals } from '@/db/schema';

export function dismissalsQuery(db: Db) {
  return db.select().from(recommendationDismissals);
}

export function dismissRecommendation(db: Db, ruleKey: string, now = Date.now()): void {
  db.insert(recommendationDismissals)
    .values({ ruleKey, dismissedAt: now })
    .onConflictDoUpdate({ target: recommendationDismissals.ruleKey, set: { dismissedAt: now } })
    .run();
}

export function undoDismiss(db: Db, ruleKey: string): void {
  db.delete(recommendationDismissals).where(eq(recommendationDismissals.ruleKey, ruleKey)).run();
}
