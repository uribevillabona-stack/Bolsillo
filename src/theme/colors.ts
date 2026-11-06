/**
 * Paleta de BOLSILLO como tokens semánticos.
 *
 * Los componentes nunca usan hex sueltos: piden un rol ("ink", "line",
 * "accent"...) y el tema resuelve el valor para modo claro u oscuro.
 *
 * Reglas de uso (verificadas en `contrast.test.ts`):
 * - `accent` (coral) y `butter` (amarillo) son RELLENOS. Sobre el fondo hueso
 *   no alcanzan AA como texto (coral ≈ 2,5:1), así que su texto encima es
 *   `onAccent` / `onButter` (tinta). Para texto de alerta se usa `accentText`.
 * - `primary` es el verde profundo de marca. En modo oscuro se aclara, porque
 *   #0E4D3A sobre #111210 da ≈ 1,9:1 y sería ilegible.
 * - Los bordes (`line`) de 1px reemplazan a las sombras.
 */

export interface ColorTokens {
  /** Fondo de la app (hueso cálido / casi negro). */
  bg: string;
  /** Superficies elevadas: sheets, teclas del teclado. */
  surface: string;
  /** Superficie al presionar. */
  surfacePressed: string;
  /** Texto principal. */
  ink: string;
  /** Texto secundario (fechas, etiquetas). AA sobre bg y surface. */
  inkMuted: string;
  /** Bordes finos y divisores. Decorativo: no lleva texto. */
  line: string;
  /** Borde con más presencia (foco, chip seleccionado). */
  lineStrong: string;
  primary: string;
  onPrimary: string;
  /** Coral: solo para alertas de gasto y el CTA principal. */
  accent: string;
  onAccent: string;
  /** Variante de coral apta para texto (AA) sobre bg. */
  accentText: string;
  /** Amarillo mantequilla: logros y aprendizaje. */
  butter: string;
  onButter: string;
  /** Velo detrás de un sheet. */
  scrim: string;
}

export const lightColors: ColorTokens = {
  bg: '#F3F0E8',
  surface: '#FBF9F4',
  surfacePressed: '#E9E5DA',
  ink: '#16181A',
  inkMuted: '#5E615C',
  line: '#DCD7CB',
  lineStrong: '#16181A',
  primary: '#0E4D3A',
  onPrimary: '#F3F0E8',
  accent: '#FF6B4A',
  onAccent: '#16181A',
  accentText: '#A8361C',
  butter: '#F2D479',
  onButter: '#16181A',
  scrim: 'rgba(22, 24, 26, 0.45)',
};

export const darkColors: ColorTokens = {
  bg: '#111210',
  surface: '#1B1D1A',
  surfacePressed: '#262924',
  ink: '#ECEAE3',
  inkMuted: '#9EA199',
  line: '#2E312C',
  lineStrong: '#ECEAE3',
  primary: '#6CC39F',
  onPrimary: '#0B1F17',
  accent: '#FF6B4A',
  onAccent: '#16181A',
  accentText: '#FF8466',
  butter: '#F2D479',
  onButter: '#16181A',
  scrim: 'rgba(0, 0, 0, 0.6)',
};

export type ColorScheme = 'light' | 'dark';

export const palettes: Record<ColorScheme, ColorTokens> = {
  light: lightColors,
  dark: darkColors,
};
