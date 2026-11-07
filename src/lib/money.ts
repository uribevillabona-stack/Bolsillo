/**
 * Utilidades de dinero en pesos colombianos (COP).
 *
 * Regla de oro del proyecto: los montos se manejan SIEMPRE como enteros de
 * pesos (sin centavos y sin `float`). El COP no usa decimales en la vida
 * diaria, y los enteros evitan errores de redondeo (0.1 + 0.2 !== 0.3).
 *
 * El formato se hace a mano en lugar de usar `Intl.NumberFormat`, porque los
 * datos de localización de Hermes varían entre versiones de Android y
 * necesitamos un resultado idéntico en todos los teléfonos: `$ 12.500`.
 */

const THOUSANDS_SEPARATOR = '.';
const MINUS_SIGN = '−'; // U+2212: signo menos tipográfico, mismo ancho que "+"

/** Espacio de no separación (U+00A0): "$" y el número nunca quedan en líneas distintas. */
export const NBSP = ' ';

/** Agrupa los dígitos de un entero no negativo de a tres con punto. */
export function groupThousands(value: number): string {
  const digits = Math.trunc(Math.abs(value)).toString();
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEPARATOR);
}

export interface FormatCOPOptions {
  /** Muestra `+` en montos positivos (útil para ingresos). */
  signed?: boolean;
  /** Omite el símbolo `$` (p. ej. dentro del teclado numérico). */
  bare?: boolean;
}

/**
 * Formatea un monto entero en COP.
 *
 * @example formatCOP(12500)            // "$ 12.500"
 * @example formatCOP(-3000)            // "−$ 3.000"
 * @example formatCOP(50000, { signed: true }) // "+$ 50.000"
 */
export function formatCOP(amount: number, options: FormatCOPOptions = {}): string {
  assertSafeAmount(amount);
  const { signed = false, bare = false } = options;
  const body = bare ? groupThousands(amount) : `$${NBSP}${groupThousands(amount)}`;
  if (amount < 0) return `${MINUS_SIGN}${body}`;
  if (signed && amount > 0) return `+${body}`;
  return body;
}

/**
 * Texto para lectores de pantalla. TalkBack lee "$ 12.500" de forma
 * inconsistente, y con un motor de voz en inglés "12.500" sonaría como
 * "doce punto quinientos". Sin separador ("12500 pesos") cualquier motor
 * lo lee como número entero.
 */
export function spokenCOP(amount: number): string {
  assertSafeAmount(amount);
  const abs = Math.abs(amount);
  const unit = abs === 1 ? 'peso' : 'pesos';
  const prefix = amount < 0 ? 'menos ' : '';
  return `${prefix}${abs} ${unit}`;
}

/**
 * Convierte la cadena de dígitos que produce el teclado numérico en un entero.
 * Devuelve 0 para la cadena vacía.
 */
export function digitsToAmount(digits: string): number {
  if (digits === '') return 0;
  if (!/^\d+$/.test(digits)) {
    throw new Error(`digitsToAmount: se esperaban solo dígitos, llegó "${digits}"`);
  }
  return Number.parseInt(digits, 10);
}

/** Tope de seguridad: $ 999.999.999 (9 dígitos) cubre cualquier caso real. */
export const MAX_AMOUNT = 999_999_999;

function assertSafeAmount(amount: number): void {
  if (!Number.isInteger(amount)) {
    throw new Error(`Monto inválido: ${amount}. Los montos deben ser enteros en pesos.`);
  }
}

/**
 * Pone espacio de no separación entre "$" y la cifra en un texto libre (p. ej.
 * el contenido de las lecciones, escrito a mano con espacio normal): así "$" y
 * "600.000" nunca quedan en líneas distintas.
 */
export function keepMoneyTogether(text: string): string {
  return text.replace(/\$ (?=\d)/g, `$${NBSP}`);
}
