import { daysLeftInMonth, daysLeftLabel, monthKey, monthName } from '../dates';

describe('dates', () => {
  const nov5 = new Date(2026, 10, 5);

  it('nombra el mes en español', () => {
    expect(monthName(nov5)).toBe('noviembre');
  });

  it('genera la clave de mes con cero a la izquierda', () => {
    expect(monthKey(new Date(2026, 0, 31))).toBe('2026-01');
    expect(monthKey(nov5)).toBe('2026-11');
  });

  it('cuenta los días que faltan incluyendo hoy', () => {
    expect(daysLeftInMonth(nov5)).toBe(26);
    expect(daysLeftInMonth(new Date(2026, 10, 30))).toBe(1);
    expect(daysLeftInMonth(new Date(2028, 1, 1))).toBe(29); // bisiesto
  });
});

describe('daysLeftLabel', () => {
  it('concuerda en número', () => {
    expect(daysLeftLabel(new Date(2026, 10, 5))).toBe('faltan 26 días');
    expect(daysLeftLabel(new Date(2026, 10, 30))).toBe('último día del mes');
  });
});
