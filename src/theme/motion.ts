/**
 * Tokens de movimiento. Cada animación de la app debe tener un propósito
 * (confirmar, orientar o celebrar) y usar uno de estos valores, para que todo
 * se sienta del mismo "material".
 */
import type { WithSpringConfig } from 'react-native-reanimated';

export const duration = {
  /** Respuesta inmediata a un toque. */
  tap: 90,
  /** Aparición de elementos pequeños (snackbar, chip). */
  quick: 180,
  /** Entrada de un sheet o cambio de pantalla. */
  base: 260,
} as const;

export const spring = {
  /** Firme, sin rebote: sheets y paneles. */
  settle: { damping: 26, stiffness: 260, mass: 1 },
  /** Con un poco de rebote: celebrar una meta cumplida. */
  bounce: { damping: 11, stiffness: 180, mass: 0.9 },
  /** Presión de botones y teclas. */
  press: { damping: 20, stiffness: 420, mass: 0.6 },
} as const satisfies Record<string, WithSpringConfig>;

/** Escala de un elemento presionado. Sutil: 2–4 %. */
export const pressScale = 0.97;
