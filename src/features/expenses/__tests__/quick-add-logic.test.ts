import { DAY_OPTIONS, nextDayOption, occurredAtFor, savedMessage } from '../quick-add-logic';

describe('registro rápido', () => {
  const now = new Date(2026, 10, 1, 7, 42);

  it('rota Hoy → Ayer → Anteayer → Hoy', () => {
    expect(DAY_OPTIONS.map((d) => d.label)).toEqual(['Hoy', 'Ayer', 'Anteayer']);
    expect(nextDayOption(0)).toBe(1);
    expect(nextDayOption(2)).toBe(0);
  });

  it('conserva la hora y cruza el cambio de mes', () => {
    const ayer = new Date(occurredAtFor(1, now));
    expect([ayer.getMonth(), ayer.getDate(), ayer.getHours(), ayer.getMinutes()]).toEqual([
      9, 31, 7, 42,
    ]);
    expect(occurredAtFor(0, now)).toBe(now.getTime());
  });

  it('arma el mensaje de confirmación', () => {
    expect(savedMessage('Tinto', '$ 2.500')).toBe('Tinto · $ 2.500 guardado');
    expect(savedMessage(null, '$ 8.000')).toBe('$ 8.000 guardado');
  });
});
