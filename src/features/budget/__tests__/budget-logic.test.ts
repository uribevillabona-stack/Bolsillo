import { formatCOP } from '@/lib/money';

import {
  alertMessage,
  budgetLines,
  dailyAllowance,
  hitMessage,
  pendingAlert,
  percentLabel,
  spentByCategory,
  statusFor,
  suggestedLimit,
} from '../budget-logic';

describe('spentByCategory', () => {
  it('suma solo egresos con categoría', () => {
    const m = spentByCategory([
      { type: 'expense', amount: 2500, categoryId: 1 },
      { type: 'expense', amount: 3000, categoryId: 1 },
      { type: 'transfer_out', amount: 10000, categoryId: 2 },
      { type: 'income', amount: 500000, categoryId: 1 },
      { type: 'expense', amount: 9000, categoryId: null },
    ]);
    expect(m.get(1)).toBe(5500);
    expect(m.get(2)).toBe(10000);
    expect(m.size).toBe(2);
  });
});

describe('statusFor', () => {
  it('ok por debajo del 80 %, near desde el 80 %, over al llegar al tope', () => {
    expect(statusFor(79_999, 100_000)).toBe('ok');
    expect(statusFor(80_000, 100_000)).toBe('near');
    expect(statusFor(99_999, 100_000)).toBe('near');
    expect(statusFor(100_000, 100_000)).toBe('over');
  });
});

describe('percentLabel', () => {
  it('redondea hacia abajo: 99,9 % no se muestra como 100 %', () => {
    expect(percentLabel(99_950, 100_000)).toBe('99 %');
    expect(percentLabel(84_000, 100_000)).toBe('84 %');
    expect(percentLabel(5, 0)).toBe('0 %');
  });
});

describe('pendingAlert', () => {
  it('avisa el 80 % una sola vez', () => {
    expect(pendingAlert(80_000, 100_000, new Set())).toBe(80);
    expect(pendingAlert(85_000, 100_000, new Set([80]))).toBeNull();
  });
  it('si un gasto salta directo al 100 %, avisa el 100 % y no el 80 %', () => {
    expect(pendingAlert(105_000, 100_000, new Set())).toBe(100);
  });
  it('después del 80 % avisa el 100 %', () => {
    expect(pendingAlert(100_000, 100_000, new Set([80]))).toBe(100);
    expect(pendingAlert(120_000, 100_000, new Set([80, 100]))).toBeNull();
  });
  it('nada por debajo del 80 % ni sin tope', () => {
    expect(pendingAlert(79_000, 100_000, new Set())).toBeNull();
    expect(pendingAlert(10_000, 0, new Set())).toBeNull();
  });
});

describe('budgetLines', () => {
  it('calcula restante y exceso, y ordena por lo más apretado', () => {
    const lines = budgetLines(
      [
        {
          id: 2,
          categoryId: 11,
          limitAmount: 100_000,
          categoryName: 'Transporte',
          categoryIcon: 'x',
        },
        {
          id: 1,
          categoryId: 10,
          limitAmount: 50_000,
          categoryName: 'Domicilios',
          categoryIcon: 'x',
        },
      ],
      new Map([
        [10, 60_000],
        [11, 20_000],
      ]),
    );
    expect(lines.map((l) => l.categoryName)).toEqual(['Domicilios', 'Transporte']);
    expect(lines[0]).toMatchObject({ remaining: 0, overBy: 10_000, status: 'over' });
    expect(lines[1]).toMatchObject({ remaining: 80_000, overBy: 0, status: 'ok', spent: 20_000 });
  });
});

describe('dailyAllowance y suggestedLimit', () => {
  it('reparte lo que queda por día, redondeando hacia abajo a cientos', () => {
    expect(dailyAllowance(8_000, 12)).toBe(600);
    expect(dailyAllowance(0, 5)).toBe(0);
    expect(dailyAllowance(5_000, 0)).toBe(0);
  });
  it('sugiere el gasto del mes pasado redondeado arriba a miles', () => {
    expect(suggestedLimit(42_300)).toBe(43_000);
    expect(suggestedLimit(0)).toBe(0);
  });
});

describe('alertMessage', () => {
  const base = { categoryName: 'Domicilios', limitAmount: 50_000 };
  it('80 %: cuánto queda y para cuántos días', () => {
    const line = { ...base, spent: 42_000, remaining: 8_000, overBy: 0 };
    expect(alertMessage(80, line, 12, formatCOP)).toBe(
      'Vas en el 84 % de Domicilios. Te quedan $ 8.000 para 12 días.',
    );
    expect(alertMessage(80, line, 1, formatCOP)).toBe(
      'Vas en el 84 % de Domicilios. Te quedan $ 8.000 para hoy.',
    );
  });
  it('100 %: llegó o se pasó', () => {
    expect(
      alertMessage(100, { ...base, spent: 50_000, remaining: 0, overBy: 0 }, 5, formatCOP),
    ).toBe('Llegaste al tope de Domicilios.');
    expect(
      alertMessage(100, { ...base, spent: 53_000, remaining: 0, overBy: 3_000 }, 5, formatCOP),
    ).toBe('Te pasaste $ 3.000 del tope de Domicilios.');
  });
});

describe('hitMessage', () => {
  it('arma el aviso desde lo que devuelve el repo', () => {
    const hit = { categoryName: 'Snacks', spent: 41_000, limitAmount: 50_000 };
    expect(hitMessage({ ...hit, threshold: 80 }, 10, formatCOP)).toBe(
      'Vas en el 82 % de Snacks. Te quedan $ 9.000 para 10 días.',
    );
    expect(hitMessage({ ...hit, spent: 56_000, threshold: 100 }, 10, formatCOP)).toBe(
      'Te pasaste $ 6.000 del tope de Snacks.',
    );
  });
});
