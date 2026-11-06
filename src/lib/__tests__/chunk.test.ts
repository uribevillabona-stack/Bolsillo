import { chunk } from '../chunk';

describe('chunk', () => {
  it('parte en lotes y deja el resto en el último', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('una lista vacía no produce lotes (no se ejecuta ningún INSERT vacío)', () => {
    expect(chunk([], 500)).toEqual([]);
  });

  it('7.000 movimientos en lotes de 500 quedan en 14 lotes', () => {
    const lots = chunk(
      Array.from({ length: 7000 }, (_, i) => i),
      500,
    );
    expect(lots).toHaveLength(14);
    expect(lots.flat()).toHaveLength(7000);
  });

  it('rechaza tamaños inválidos', () => {
    expect(() => chunk([1], 0)).toThrow();
  });
});
