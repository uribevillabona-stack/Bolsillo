/**
 * Espaciado en escala de 4. Se nombra por múltiplo: `space[4]` = 16px.
 * Así cualquier valor del layout se puede justificar como 4·n.
 */
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export type SpaceKey = keyof typeof space;

/** Radios moderados. Nada de radios gigantes por defecto. */
export const radius = {
  /** Detalles pequeños: indicadores, insignias. */
  xs: 6,
  /** Chips, campos, teclas. */
  sm: 12,
  /** Sheets, bloques destacados. */
  md: 16,
} as const;

/** Grosor de borde único: 1px en vez de sombras. */
export const hairline = 1;

/** Área táctil mínima (WCAG / Material: 44–48). */
export const minTouchTarget = 48;

/** Margen lateral de las pantallas. */
export const screenGutter = space[5];
