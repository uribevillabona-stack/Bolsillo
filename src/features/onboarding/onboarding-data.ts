/**
 * Contenido y reglas del onboarding (lógica pura).
 */
import { MAX_AMOUNT } from '@/lib/money';

export const INCOME_TYPES = [
  { id: 'mesada', label: 'Mesada' },
  { id: 'beca', label: 'Beca o auxilio' },
  { id: 'sueldo', label: 'Sueldo' },
  { id: 'emprendimiento', label: 'Emprendimiento' },
  { id: 'varios', label: 'De varios lados' },
] as const;

/**
 * Rangos de ingreso mensual. `estimate` es la referencia para calcular el
 * "disponible del mes" mientras el usuario no registre sus ingresos; se
 * usa un valor conservador dentro del rango (mejor sorprenderse para bien).
 */
export const INCOME_RANGES = [
  { id: 'lt-300k', label: 'Menos de $ 300.000', estimate: 200_000 },
  { id: '300k-700k', label: '$ 300.000 a $ 700.000', estimate: 400_000 },
  { id: '700k-1500k', label: '$ 700.000 a $ 1.500.000', estimate: 900_000 },
  { id: '1500k-3m', label: '$ 1.500.000 a $ 3.000.000', estimate: 1_800_000 },
  { id: 'gt-3m', label: 'Más de $ 3.000.000', estimate: 3_000_000 },
] as const;

export type IncomeTypeId = (typeof INCOME_TYPES)[number]['id'];
export type IncomeRangeId = (typeof INCOME_RANGES)[number]['id'];

export function estimateForRange(id: string | null | undefined): number {
  return INCOME_RANGES.find((r) => r.id === id)?.estimate ?? 0;
}

/**
 * Mini diagnóstico. Las respuestas personalizan qué lecciones se recomiendan
 * primero (Fase 5). Lenguaje directo, sin juicio.
 */
export const DIAGNOSTIC_QUESTIONS = [
  {
    id: 'sabe-gasto',
    question: '¿Sabes cuánto gastaste la semana pasada?',
    options: [
      { id: 'si', label: 'Sí, más o menos exacto' },
      { id: 'aprox', label: 'Tengo una idea' },
      { id: 'no', label: 'Ni idea' },
    ],
  },
  {
    id: 'fin-de-mes',
    question: '¿Te queda plata a fin de mes?',
    options: [
      { id: 'casi-siempre', label: 'Casi siempre' },
      { id: 'a-veces', label: 'A veces' },
      { id: 'casi-nunca', label: 'Casi nunca' },
    ],
  },
  {
    id: 'emergencia',
    question: 'Si mañana se te daña el celular, ¿tienes con qué pagarlo?',
    options: [
      { id: 'si', label: 'Sí, tengo ahorros' },
      { id: 'parte', label: 'Una parte' },
      { id: 'no', label: 'No' },
    ],
  },
  {
    id: 'credito',
    question: '¿Tienes tarjeta de crédito o algún crédito?',
    options: [
      { id: 'no', label: 'No tengo' },
      { id: 'pago-total', label: 'Sí, y pago el total' },
      { id: 'pago-minimo', label: 'Sí, y pago el mínimo' },
    ],
  },
  {
    id: 'estafas',
    question: '¿Te han intentado estafar por transferencia o redes?',
    options: [
      { id: 'no', label: 'No que yo sepa' },
      { id: 'una-vez', label: 'Una vez' },
      { id: 'varias', label: 'Varias veces' },
    ],
  },
] as const;

export const GOAL_NAME_MAX = 40;

/** Convierte lo que el usuario escribe ("1.500.000", "1500000") en entero. null si no es válido. */
export function parseTypedAmount(text: string): number | null {
  const digits = text.replace(/\D/g, '');
  if (digits === '' || digits.length > MAX_AMOUNT.toString().length) return null;
  const value = Number.parseInt(digits, 10);
  return value > 0 && value <= MAX_AMOUNT ? value : null;
}

export interface GoalDraft {
  name: string;
  amountText: string;
}

/** Error del Apartado inicial, o null si está bien. Un Apartado vacío (saltado) es válido. */
export function validateGoalDraft(draft: GoalDraft): string | null {
  const name = draft.name.trim();
  const hasAny = name !== '' || draft.amountText.trim() !== '';
  if (!hasAny) return null;
  if (name === '') return 'Ponle un nombre: ¿para qué es la plata?';
  if (name.length > GOAL_NAME_MAX) return `Máximo ${GOAL_NAME_MAX} caracteres.`;
  if (parseTypedAmount(draft.amountText) === null) return '¿Cuánto necesitas? Escribe un monto.';
  return null;
}
