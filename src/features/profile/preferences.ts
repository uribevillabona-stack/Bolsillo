/**
 * Cambios de preferencias que afectan a la UI al instante y además se
 * guardan en la base de datos.
 */
import { db } from '@/db/client';
import { useThemeStore, type ThemePreference } from '@/theme';

import { updateProfile } from './profile-repo';

export function setThemePreference(preference: ThemePreference): void {
  useThemeStore.getState().setPreference(preference);
  updateProfile(db, { themePreference: preference });
}
