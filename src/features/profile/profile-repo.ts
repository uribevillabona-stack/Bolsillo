/**
 * Perfil del usuario: una sola fila (id = 1), creada por la siembra.
 */
import { eq } from 'drizzle-orm';

import type { Db } from '@/db/client';
import { profile, type Profile } from '@/db/schema';

export const PROFILE_ID = 1;

export function profileQuery(db: Db) {
  return db.select().from(profile).where(eq(profile.id, PROFILE_ID)).limit(1);
}

export function getProfile(db: Db): Profile | undefined {
  return profileQuery(db).get();
}

export type ProfilePatch = Partial<Omit<Profile, 'id' | 'createdAt'>>;

export function updateProfile(db: Db, patch: ProfilePatch): void {
  db.update(profile).set(patch).where(eq(profile.id, PROFILE_ID)).run();
}
