/**
 * Lógica pura del teclado numérico, separada de la UI para probarla.
 *
 * El estado es una cadena de dígitos ("12500"), no un número: así no hay
 * ambigüedad con ceros y el monto se deriva con `digitsToAmount`.
 */
import { MAX_AMOUNT } from '@/lib/money';

export type KeypadKey = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '0' | '000' | 'back';

// prettier-ignore
export const KEYPAD_LAYOUT: readonly KeypadKey[] = [
  '1',   '2', '3',
  '4',   '5', '6',
  '7',   '8', '9',
  '000', '0', 'back',
];

const MAX_DIGITS = MAX_AMOUNT.toString().length;

/**
 * Aplica una tecla. Devuelve la misma cadena si la tecla no tiene efecto
 * (la UI usa eso para dar una vibración de rechazo).
 */
export function applyKey(digits: string, key: KeypadKey): string {
  if (key === 'back') return digits.slice(0, -1);

  // Sin ceros a la izquierda: "0" o "000" sobre vacío no hacen nada.
  if (digits === '' && (key === '0' || key === '000')) return digits;

  const next = digits + key;
  if (next.length > MAX_DIGITS) return digits;
  return next;
}
