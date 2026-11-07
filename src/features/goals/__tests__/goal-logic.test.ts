import { formatCOP } from '@/lib/money';

import {
  ceilToThousands,
  goalProgress,
  netSavedInMonth,
  paceSentence,
  validateGoal,
  type GoalLike,
} from '../goal-logic';

const NOW = new Date(2026, 10, 20, 12, 0); // 20 nov 2026
const lastDayOf = (y: number, m: number) => new Date(y, m + 1, 1).getTime() - 1;
const goal = (over: Partial<GoalLike> = {}): GoalLike => ({
  id: 1,
  name: 'Portátil',
  targetAmount: 2_000_000,
  targetDate: lastDayOf(2027, 4), // mayo de 2027
  completedAt: null,
  ...over,
});

describe('goalProgress', () => {
  it('reparte lo que falta entre los meses que quedan, contando el actual', () => {
    const p = goalProgress(goal(), [{ goalId: 1, amount: 200_000, createdAt: NOW.getTime() }], NOW);
    // nov, dic, ene, feb, mar, abr, may = 7 meses. Al empezar noviembre
    // faltaban 2.000.000: la cuota es 2.000.000 / 7, aunque ya aportó en nov.
    expect(p.monthsLeft).toBe(7);
    expect(p.monthlyNeeded).toBe(286_000);
    expect(p.saved).toBe(200_000);
    expect(p.ratio).toBeCloseTo(0.1);
    expect(p.savedThisMonth).toBe(200_000);
  });

  it('ignora los aportes de otros Apartados y resta los retiros', () => {
    const p = goalProgress(
      goal(),
      [
        { goalId: 1, amount: 500_000, createdAt: 0 },
        { goalId: 1, amount: -100_000, createdAt: NOW.getTime() },
        { goalId: 2, amount: 900_000, createdAt: NOW.getTime() },
      ],
      NOW,
    );
    expect(p.saved).toBe(400_000);
    expect(p.savedThisMonth).toBe(-100_000);
  });

  it('completo: sin monto mensual y ratio acotado a 1', () => {
    const p = goalProgress(goal(), [{ goalId: 1, amount: 2_100_000, createdAt: 0 }], NOW);
    expect(p.completed).toBe(true);
    expect(p.ratio).toBe(1);
    expect(p.monthlyNeeded).toBeNull();
  });

  it('fecha vencida: todo lo que falta es para este mes', () => {
    const p = goalProgress(goal({ targetDate: lastDayOf(2026, 8) }), [], NOW);
    expect(p.monthsLeft).toBe(0);
    expect(p.monthlyNeeded).toBe(2_000_000);
  });

  it('sin fecha: no hay monto mensual', () => {
    expect(goalProgress(goal({ targetDate: null }), [], NOW).monthlyNeeded).toBeNull();
  });
});

describe('paceSentence', () => {
  it('con fecha futura', () => {
    const g = goal();
    expect(paceSentence(g, goalProgress(g, [], NOW), NOW, formatCOP)).toBe(
      'Separa $ 286.000 al mes y llegas en mayo de 2027.',
    );
  });

  it('fecha este mes, vencida, sin fecha y completo', () => {
    const thisMonth = goal({ targetDate: lastDayOf(2026, 10) });
    expect(paceSentence(thisMonth, goalProgress(thisMonth, [], NOW), NOW, formatCOP)).toBe(
      'Te faltan $ 2.000.000 para este mes.',
    );
    const late = goal({ targetDate: lastDayOf(2026, 9) });
    expect(paceSentence(late, goalProgress(late, [], NOW), NOW, formatCOP)).toBe(
      'Te faltan $ 2.000.000 y la fecha era en octubre.',
    );
    const open = goal({ targetDate: null });
    expect(paceSentence(open, goalProgress(open, [], NOW), NOW, formatCOP)).toBe(
      'Te faltan $ 2.000.000. Sin fecha: a tu ritmo.',
    );
    const done = goalProgress(goal(), [{ goalId: 1, amount: 2_000_000, createdAt: 0 }], NOW);
    expect(paceSentence(goal(), done, NOW, formatCOP)).toBe(
      '¡Lo lograste! Ya tienes toda la plata.',
    );
  });
});

describe('cuota mensual', () => {
  it('siguiéndola se llega a la meta aunque se aporte a mitad de mes', () => {
    // Meta de 300.000 para enero (nov, dic, ene). En noviembre aporta 100.000.
    const g = goal({ targetAmount: 300_000, targetDate: lastDayOf(2027, 0) });
    const p = goalProgress(g, [{ goalId: 1, amount: 100_000, createdAt: NOW.getTime() }], NOW);
    expect(p.monthlyNeeded).toBe(100_000);
  });

  it('lo aportado en meses anteriores sí baja la cuota', () => {
    const g = goal({ targetAmount: 300_000, targetDate: lastDayOf(2027, 0) });
    const p = goalProgress(
      g,
      [{ goalId: 1, amount: 120_000, createdAt: new Date(2026, 9, 10).getTime() }],
      NOW,
    );
    expect(p.monthlyNeeded).toBe(60_000);
  });
});

describe('netSavedInMonth', () => {
  it('los ahorros previos no restan del disponible del mes', () => {
    expect(
      netSavedInMonth(
        [
          { goalId: 1, amount: 500_000, createdAt: NOW.getTime(), fromSavings: true },
          { goalId: 1, amount: 50_000, createdAt: NOW.getTime() },
        ],
        NOW,
      ),
    ).toBe(50_000);
  });

  it('solo cuenta los aportes del mes', () => {
    expect(
      netSavedInMonth(
        [
          { goalId: 1, amount: 50_000, createdAt: new Date(2026, 10, 1).getTime() },
          { goalId: 2, amount: -10_000, createdAt: new Date(2026, 10, 30, 23).getTime() },
          { goalId: 1, amount: 70_000, createdAt: new Date(2026, 9, 31, 23).getTime() },
        ],
        NOW,
      ),
    ).toBe(40_000);
  });
});

describe('validateGoal y ceilToThousands', () => {
  it('pide nombre y monto', () => {
    expect(validateGoal({ name: '  ', targetAmount: 100 })).toMatch(/nombre/);
    expect(validateGoal({ name: 'Viaje', targetAmount: 0 })).toMatch(/monto/);
    expect(validateGoal({ name: 'Viaje', targetAmount: 500_000 })).toBeNull();
  });

  it('redondea hacia arriba a miles', () => {
    expect(ceilToThousands(257_143)).toBe(258_000);
    expect(ceilToThousands(258_000)).toBe(258_000);
  });
});
