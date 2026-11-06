/**
 * Preferencia de tema del usuario (sistema / claro / oscuro).
 *
 * En la Fase 2 este valor se persistirá en SQLite (tabla `profile`). Por ahora
 * vive en memoria y arranca siguiendo al sistema.
 */
import { create } from 'zustand';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'system',
  setPreference: (preference) => set({ preference }),
}));
