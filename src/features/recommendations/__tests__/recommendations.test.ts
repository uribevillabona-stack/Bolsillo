import type { BudgetLine } from '@/features/budget/budget-logic';
import { formatCOP } from '@/lib/money';

import {
  DISMISS_COOLDOWN_MS,
  pickRecommendation,
  type RecommendationContext,
} from '../recommendations';

const NOW = new Date(2026, 10, 20, 12, 0); // 20 nov: faltan 11 días

function ctx(over: Partial<RecommendationContext> = {}): RecommendationContext {
  return {
    now: NOW,
    daysLeft: 11,
    totals: {
      income: 0,
      expenses: 300_000,
      today: 0,
      savedToGoals: 0,
      incomeBase: 900_000,
      usedIncomeEstimate: true,
      available: 600_000,
    },
    incomeBase: 900_000,
    monthExpenseCount: 12,
    hasAnyMovement: true,
    budgets: [],
    hormigas: { monthTotal: 0, monthCount: 0, annualProjection: 0, windowDays: 30, categories: [] },
    goals: [
      {
        goal: {
          id: 1,
          name: 'Viaje',
          targetAmount: 1_000_000,
          targetDate: null,
          completedAt: null,
        },
        progress: {
          saved: 100_000,
          ratio: 0.1,
          remaining: 900_000,
          completed: false,
          monthsLeft: null,
          monthlyNeeded: null,
          savedThisMonth: 0,
        },
      },
    ],
    topCategory: { name: 'Domicilios', spent: 120_000 },
    dismissedAt: new Map(),
    ...over,
  };
}

const line = (over: Partial<BudgetLine>): BudgetLine => ({
  id: 1,
  categoryId: 5,
  limitAmount: 50_000,
  categoryName: 'Domicilios',
  categoryIcon: 'domicilio',
  spent: 0,
  ratio: 0,
  remaining: 50_000,
  overBy: 0,
  status: 'ok',
  ...over,
});

const pick = (c: RecommendationContext) => pickRecommendation(c, formatCOP);

describe('pickRecommendation', () => {
  it('sin movimientos: el primer paso', () => {
    expect(pick(ctx({ hasAnyMovement: false }))?.key).toBe('start');
  });

  it('gastó más de lo que le entra: primero eso', () => {
    const rec = pick(
      ctx({ totals: { ...ctx().totals, available: -40_000 }, budgets: [line({ status: 'near' })] }),
    );
    expect(rec?.key).toBe('over-income:2026-11');
    expect(rec?.title).toBe('Vas $ 40.000 por encima de lo que te entra.');
    expect(rec?.tone).toBe('alert');
  });

  it('un tope pasado gana sobre uno al 80 %', () => {
    const rec = pick(
      ctx({
        budgets: [
          line({
            categoryId: 6,
            categoryName: 'Snacks',
            status: 'near',
            spent: 42_000,
            remaining: 8_000,
          }),
          line({ status: 'over', spent: 53_000, remaining: 0, overBy: 3_000 }),
        ],
      }),
    );
    expect(rec?.title).toBe('Te pasaste $ 3.000 en Domicilios.');
  });

  it('tope al 80 %: lo que queda por día', () => {
    const rec = pick(
      ctx({
        budgets: [
          line({
            limitAmount: 200_000,
            status: 'near',
            spent: 170_000,
            remaining: 30_000,
            ratio: 0.85,
          }),
        ],
      }),
    );
    expect(rec?.title).toBe('Vas en el 85 % de Domicilios.');
    expect(rec?.body).toBe('Te quedan $ 30.000 para 11 días: unos $ 2.700 al día.');
  });

  it('si lo diario da menos de $ 1.000, solo dice lo que queda y el plazo', () => {
    const rec = pick(
      ctx({ budgets: [line({ status: 'near', spent: 42_000, remaining: 8_000, ratio: 0.84 })] }),
    );
    expect(rec?.body).toBe('Te quedan $ 8.000 para 11 días.');
  });

  it('ritmo: proyecta el gasto del mes y avisa si pasa del ingreso', () => {
    // 700.000 en 20 días → 1.050.000 en 30 > 900.000
    const rec = pick(ctx({ totals: { ...ctx().totals, expenses: 700_000, available: 200_000 } }));
    expect(rec?.key).toBe('pace:2026-11');
    expect(rec?.title).toBe('A este ritmo gastarías $ 1.050.000 este mes.');
    expect(rec?.body).toContain('$ 18.100 al día');
  });

  it('no juzga el ritmo antes del día 7', () => {
    const early = new Date(2026, 10, 3, 12);
    const rec = pick(
      ctx({
        now: early,
        daysLeft: 28,
        totals: { ...ctx().totals, expenses: 400_000, available: 500_000 },
      }),
    );
    expect(rec?.key).not.toBe('pace:2026-11');
  });

  it('Apartado atrasado después del 15: cuánto falta este mes', () => {
    const rec = pick(
      ctx({
        goals: [
          {
            goal: {
              id: 3,
              name: 'Portátil',
              targetAmount: 2_000_000,
              targetDate: 1,
              completedAt: null,
            },
            progress: {
              saved: 0,
              ratio: 0,
              remaining: 2_000_000,
              completed: false,
              monthsLeft: 7,
              monthlyNeeded: 286_000,
              savedThisMonth: 86_000,
            },
          },
        ],
      }),
    );
    expect(rec?.title).toBe('Para "Portátil" te faltan $ 200.000 este mes.');
    expect(rec?.action?.href).toBe('/apartado/3');
  });

  it('hormigas conectadas con el Apartado', () => {
    const rec = pick(
      ctx({
        hormigas: {
          monthTotal: 60_000,
          monthCount: 20,
          annualProjection: 456_000,
          windowDays: 30,
          categories: [
            {
              categoryId: 1,
              name: 'tinto y café',
              icon: 'cafe',
              monthCount: 20,
              monthTotal: 60_000,
              annualProjection: 456_000,
            },
          ],
        },
      }),
    );
    expect(rec?.key).toBe('hormiga:1');
    expect(rec?.body).toBe('Si le bajas a la mitad, son $ 19.000 al mes para "Viaje".');
  });

  it('sin Apartados: propone el 5 % del ingreso', () => {
    const rec = pick(ctx({ goals: [] }));
    expect(rec?.key).toBe('no-goal');
    expect(rec?.body).toContain('$ 45.000 al mes');
  });

  it('sin topes y con varios gastos: propone el primero', () => {
    expect(pick(ctx())?.title).toBe('Ponle tope a Domicilios.');
  });

  it('todo en orden: lo dice', () => {
    const rec = pick(ctx({ budgets: [line({ status: 'ok', spent: 1_000 })] }));
    expect(rec?.key).toBe('good-pace:2026-11');
    expect(rec?.tone).toBe('good');
  });

  it('descartar el aviso de una categoría no silencia el de otra', () => {
    const budgets = [
      line({ categoryId: 5, status: 'near', spent: 45_000, remaining: 5_000, ratio: 0.9 }),
      line({
        categoryId: 6,
        categoryName: 'Transporte',
        status: 'near',
        spent: 41_000,
        remaining: 9_000,
        ratio: 0.82,
      }),
    ];
    const rec = pick(
      ctx({ budgets, dismissedAt: new Map([['budget-near:5:2026-11', NOW.getTime()]]) }),
    );
    expect(rec?.title).toBe('Vas en el 82 % de Transporte.');
  });

  it('un tope alcanzado justo (sin pasarse) también se avisa', () => {
    const rec = pick(ctx({ budgets: [line({ status: 'over', spent: 50_000, remaining: 0 })] }));
    expect(rec?.title).toBe('Llegaste al tope de Domicilios.');
  });

  it('el ritmo cuenta lo separado en Apartados', () => {
    // Ingreso 900.000; gasto proyectado 600.000 + 400.000 separados > 900.000.
    const rec = pick(
      ctx({
        totals: { ...ctx().totals, expenses: 400_000, savedToGoals: 400_000, available: 100_000 },
      }),
    );
    expect(rec?.key).toBe('pace:2026-11');
  });

  it('respeta "Ahora no" por 3 días y luego vuelve', () => {
    const key = 'no-budget';
    const recent = pick(ctx({ dismissedAt: new Map([[key, NOW.getTime() - 1000]]) }));
    expect(recent?.key).not.toBe(key);
    const old = pick(
      ctx({ dismissedAt: new Map([[key, NOW.getTime() - DISMISS_COOLDOWN_MS - 1]]) }),
    );
    expect(old?.key).toBe(key);
  });
});
