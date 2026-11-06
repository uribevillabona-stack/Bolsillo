/**
 * Punto de entrada del tema. Las pantallas y componentes importan desde aquí:
 *
 *   import { useTheme, space, radius } from '@/theme';
 */
import { useColorScheme } from 'react-native';

import { palettes, type ColorScheme, type ColorTokens } from './colors';
import { useThemeStore } from './theme-store';

export * from './colors';
export * from './motion';
export * from './spacing';
export * from './typography';
export { useThemeStore, type ThemePreference } from './theme-store';

export interface Theme {
  scheme: ColorScheme;
  colors: ColorTokens;
}

/** Resuelve el esquema activo combinando la preferencia y el sistema. */
export function resolveScheme(
  preference: 'system' | ColorScheme,
  system: string | null | undefined,
): ColorScheme {
  if (preference !== 'system') return preference;
  return system === 'dark' ? 'dark' : 'light';
}

export function useTheme(): Theme {
  const system = useColorScheme();
  const preference = useThemeStore((s) => s.preference);
  const scheme = resolveScheme(preference, system);
  return { scheme, colors: palettes[scheme] };
}
