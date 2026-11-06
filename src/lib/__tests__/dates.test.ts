import {
  dayLabel,
  daysAgo,
  daysLeftInMonth,
  daysLeftLabel,
  monthKey,
  monthName,
  startOfMonth,
  startOfNextMonth,
  timeLabel,
} from '../dates';

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

describe('límites de mes y día', () => {
  it('startOfMonth / startOfNextMonth cubren el mes, incluido diciembre', () => {
    expect(startOfMonth(new Date(2026, 10, 15, 18)).getTime()).toBe(
      new Date(2026, 10, 1).getTime(),
    );
    expect(startOfNextMonth(new Date(2026, 11, 31)).getTime()).toBe(new Date(2027, 0, 1).getTime());
  });

  it('daysAgo cruza meses', () => {
    expect(daysAgo(new Date(2026, 2, 1, 10), 1).getDate()).toBe(28);
  });
});

describe('dayLabel', () => {
  const now = new Date(2026, 10, 5, 9, 0);

  it('usa Hoy y Ayer', () => {
    expect(dayLabel(new Date(2026, 10, 5, 23, 59), now)).toBe('Hoy');
    expect(dayLabel(new Date(2026, 10, 4, 0, 1), now)).toBe('Ayer');
  });

  it('usa día de la semana para fechas anteriores', () => {
    expect(dayLabel(new Date(2026, 10, 2), now)).toBe('lun 2 nov');
  });

  it('agrega el año si es otro', () => {
    expect(dayLabel(new Date(2025, 11, 31), now)).toBe('mié 31 dic 2025');
  });
});

describe('timeLabel', () => {
  it('usa formato de 12 horas colombiano', () => {
    expect(timeLabel(new Date(2026, 0, 1, 7, 42))).toBe('7:42 a. m.');
    expect(timeLabel(new Date(2026, 0, 1, 0, 5))).toBe('12:05 a. m.');
    expect(timeLabel(new Date(2026, 0, 1, 12, 0))).toBe('12:00 p. m.');
    expect(timeLabel(new Date(2026, 0, 1, 19, 30))).toBe('7:30 p. m.');
  });
});
