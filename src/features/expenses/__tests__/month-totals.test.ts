import { monthTotals } from '../month-totals';

const NOW = new Date(2026, 10, 20, 18, 0);
const today = new Date(2026, 10, 20, 8, 0).getTime();
const earlier = new Date(2026, 10, 3, 8, 0).getTime();

describe('monthTotals', () => {
  it('usa el ingreso de referencia si no hay ingresos registrados', () => {
    const t = monthTotals(
      [
        { type: 'expense', amount: 2500, occurredAt: today },
        { type: 'expense', amount: 40000, occurredAt: earlier },
      ],
      NOW,
      750000,
    );
    expect(t).toEqual({
      income: 0,
      expenses: 42500,
      today: 2500,
      savedToGoals: 0,
      incomeBase: 750000,
      usedIncomeEstimate: true,
      available: 707500,
    });
  });

  it('prefiere los ingresos registrados sobre la referencia', () => {
    const t = monthTotals(
      [
        { type: 'income', amount: 500000, occurredAt: earlier },
        { type: 'transfer_out', amount: 100000, occurredAt: today },
      ],
      NOW,
      750000,
    );
    expect(t.usedIncomeEstimate).toBe(false);
    expect(t.available).toBe(400000);
    expect(t.today).toBe(100000);
  });

  it('puede quedar en negativo (gastó más de lo que entró)', () => {
    const t = monthTotals([{ type: 'expense', amount: 90000, occurredAt: earlier }], NOW, 50000);
    expect(t.available).toBe(-40000);
  });

  it('sin referencia ni movimientos, todo en cero', () => {
    expect(monthTotals([], NOW, 0).available).toBe(0);
  });

  it('lo separado en Apartados sale del disponible; un retiro lo devuelve', () => {
    const rows = [{ type: 'expense', amount: 100000, occurredAt: earlier }];
    expect(monthTotals(rows, NOW, 800000, 200000).available).toBe(500000);
    expect(monthTotals(rows, NOW, 800000, -50000).available).toBe(750000);
  });
});
