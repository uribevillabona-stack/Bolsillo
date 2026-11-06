import { groupByDay, signedAmount } from '../group-by-day';

const NOW = new Date(2026, 10, 20, 18);
const at = (d: number, h: number) => new Date(2026, 10, d, h).getTime();

describe('groupByDay', () => {
  it('agrupa días consecutivos y suma solo las salidas', () => {
    const groups = groupByDay(
      [
        { type: 'expense', amount: 2500, occurredAt: at(20, 9) },
        { type: 'income', amount: 50000, occurredAt: at(20, 8) },
        { type: 'expense', amount: 3200, occurredAt: at(19, 7) },
        { type: 'transfer_out', amount: 10000, occurredAt: at(17, 7) },
      ],
      NOW,
    );
    expect(groups.map((g) => [g.label, g.spent, g.items.length])).toEqual([
      ['Hoy', 2500, 2],
      ['Ayer', 3200, 1],
      ['mar 17 nov', 10000, 1],
    ]);
  });

  it('sin filas no hay grupos', () => {
    expect(groupByDay([], NOW)).toEqual([]);
  });
});

describe('signedAmount', () => {
  it('las salidas van en negativo y las entradas en positivo', () => {
    expect(signedAmount({ type: 'expense', amount: 2500 })).toBe(-2500);
    expect(signedAmount({ type: 'transfer_out', amount: 100 })).toBe(-100);
    expect(signedAmount({ type: 'income', amount: 9000 })).toBe(9000);
  });
});
