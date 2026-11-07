import { formatCOP } from '@/lib/money';

import {
  projectionSentence,
  roundToThousands,
  summarizeHormigas,
  windowDays,
  type HormigaRow,
} from '../hormigas-stats';

const NOW = new Date(2026, 10, 20, 18, 0); // 20 nov 2026, 6 p. m.
const at = (month: number, day: number, hour = 8) => new Date(2026, month, day, hour).getTime();

const tinto = (occurredAt: number, amount = 2500): HormigaRow => ({
  amount,
  occurredAt,
  categoryId: 1,
  categoryName: 'Tinto y café',
  categoryIcon: 'cafe',
});
const pasaje = (occurredAt: number): HormigaRow => ({
  amount: 3200,
  occurredAt,
  categoryId: 3,
  categoryName: 'Transporte',
  categoryIcon: 'transporte',
});

describe('windowDays', () => {
  it('usa 30 días con historia larga o sin historia', () => {
    expect(windowDays(NOW, at(5, 1))).toBe(30);
    expect(windowDays(NOW, null)).toBe(30);
  });

  it('usa los días de historia (incluido hoy) cuando son entre 7 y 30', () => {
    expect(windowDays(NOW, at(10, 11))).toBe(10);
  });

  it('nunca baja de 7, aunque el primer registro sea de hoy', () => {
    expect(windowDays(NOW, at(10, 20))).toBe(7);
  });
});

describe('summarizeHormigas', () => {
  it('sin registros devuelve todo en cero', () => {
    const s = summarizeHormigas([], NOW, null);
    expect(s).toMatchObject({ monthTotal: 0, monthCount: 0, annualProjection: 0, categories: [] });
  });

  it('un tinto diario durante 30 días proyecta ~ $ 912.000 al año', () => {
    const rows = Array.from({ length: 30 }, (_, i) => tinto(NOW.getTime() - i * 86_400_000));
    const s = summarizeHormigas(rows, NOW, rows.at(-1)!.occurredAt);
    expect(s.windowDays).toBe(30);
    // 2.500 × 365 = 912.500 → redondeado a miles
    expect(s.annualProjection).toBe(913_000);
    expect(s.categories[0]).toMatchObject({ name: 'Tinto y café', annualProjection: 913_000 });
  });

  it('separa el total del mes de la ventana de proyección', () => {
    const rows = [tinto(at(9, 30)), tinto(at(10, 2)), tinto(at(10, 19))];
    const s = summarizeHormigas(rows, NOW, at(9, 30));
    expect(s.monthCount).toBe(2); // 30 de octubre no es de noviembre
    expect(s.monthTotal).toBe(5000);
    expect(s.windowDays).toBe(22); // 30 oct → 20 nov, incluidos
    expect(s.annualProjection).toBe(roundToThousands((7500 / 22) * 365));
  });

  it('ordena categorías por total del mes', () => {
    const rows = [tinto(at(10, 18)), pasaje(at(10, 18)), pasaje(at(10, 19))];
    const s = summarizeHormigas(rows, NOW, at(10, 18));
    expect(s.categories.map((c) => c.name)).toEqual(['Transporte', 'Tinto y café']);
    expect(s.categories[0]).toMatchObject({ monthCount: 2, monthTotal: 6400 });
  });

  it('ignora movimientos con fecha futura', () => {
    const s = summarizeHormigas([tinto(at(10, 25))], NOW, at(10, 25));
    expect(s.monthTotal).toBe(0);
    expect(s.categories).toEqual([]);
  });

  it('agrupa los gastos sin categoría', () => {
    const row: HormigaRow = { ...tinto(at(10, 20, 9)), categoryId: null, categoryName: null };
    const s = summarizeHormigas([row], NOW, row.occurredAt);
    expect(s.categories[0]?.name).toBe('Sin categoría');
  });
});

describe('projectionSentence', () => {
  it('usa la voz de la app', () => {
    expect(
      projectionSentence({ name: 'Tinto y café', annualProjection: 456_000 }, (n) => formatCOP(n)),
    ).toBe('A este ritmo, $ 456.000 al año en tinto y café.');
  });
});
