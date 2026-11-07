/**
 * Totales del mes para Inicio (lógica pura).
 *
 * Disponible del mes = ingresos del mes − egresos del mes − aportes netos a
 * Apartados del mes (un retiro los devuelve). Si el usuario no ha registrado ingresos este mes, se
 * usa el ingreso de referencia que dio en el onboarding: la mayoría de
 * jóvenes recibe la mesada o el sueldo sin anotarlo.
 */
import { isSameDay } from '@/lib/dates';

export interface MovementLike {
  type: string;
  amount: number;
  occurredAt: number;
}

export interface MonthTotals {
  income: number;
  expenses: number;
  today: number;
  /** Aportes netos a Apartados este mes (negativo si retiró más de lo que separó). */
  savedToGoals: number;
  /** Ingreso usado para el disponible (registrado o de referencia). */
  incomeBase: number;
  /** true si se usó el ingreso de referencia del perfil. */
  usedIncomeEstimate: boolean;
  available: number;
}

const OUTFLOW = new Set(['expense', 'transfer_out']);
const INFLOW = new Set(['income', 'transfer_in']);

export function monthTotals(
  rows: readonly MovementLike[],
  now: Date,
  monthlyIncomeEstimate: number,
  savedToGoals = 0,
): MonthTotals {
  let income = 0;
  let expenses = 0;
  let today = 0;

  for (const r of rows) {
    if (OUTFLOW.has(r.type)) {
      expenses += r.amount;
      if (isSameDay(new Date(r.occurredAt), now)) today += r.amount;
    } else if (INFLOW.has(r.type)) {
      income += r.amount;
    }
  }

  const usedIncomeEstimate = income === 0 && monthlyIncomeEstimate > 0;
  const base = usedIncomeEstimate ? monthlyIncomeEstimate : income;
  return {
    income,
    expenses,
    today,
    savedToGoals,
    incomeBase: base,
    usedIncomeEstimate,
    available: base - expenses - savedToGoals,
  };
}
