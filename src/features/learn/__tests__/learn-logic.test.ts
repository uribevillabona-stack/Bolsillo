import {
  activeWeeks,
  hormigaGrowth,
  pickNextLesson,
  quizScore,
  recentWeeks,
  scoreMessage,
  weekStart,
  weeklyStreak,
  type NextLessonContext,
} from '../learn-logic';
import { LESSONS } from '../lessons';

// Jueves 19 de noviembre de 2026, 6 p. m.
const NOW = new Date(2026, 10, 19, 18, 0);
const at = (m: number, d: number, h = 12) => new Date(2026, m, d, h).getTime();

describe('weekStart', () => {
  it('la semana empieza el lunes', () => {
    expect(weekStart(NOW)).toEqual(new Date(2026, 10, 16));
    expect(weekStart(new Date(2026, 10, 22, 23))).toEqual(new Date(2026, 10, 16)); // domingo
    expect(weekStart(new Date(2026, 10, 23, 0, 5))).toEqual(new Date(2026, 10, 23)); // lunes
  });
});

describe('racha semanal', () => {
  it('una lección terminada hace activa la semana', () => {
    expect(activeWeeks({ lessonCompletions: [at(10, 17)], movementDays: [] }).size).toBe(1);
  });

  it('movimientos cuentan con 3 días distintos, no 3 movimientos el mismo día', () => {
    const sameDay = [at(10, 17, 8), at(10, 17, 12), at(10, 17, 20)];
    expect(activeWeeks({ lessonCompletions: [], movementDays: sameDay }).size).toBe(0);
    const threeDays = [at(10, 16), at(10, 17), at(10, 19)];
    expect(activeWeeks({ lessonCompletions: [], movementDays: threeDays }).size).toBe(1);
  });

  it('cuenta semanas seguidas, y la semana en curso no rompe la racha', () => {
    const input = {
      lessonCompletions: [at(10, 4), at(10, 11)], // semanas del 2 y del 9 de nov
      movementDays: [],
    };
    // Semana del 16 aún sin actividad: la racha sigue en 2.
    expect(weeklyStreak(input, NOW)).toEqual({ weeks: 2, thisWeekDone: false });
    // Con actividad esta semana: 3.
    expect(
      weeklyStreak({ ...input, lessonCompletions: [...input.lessonCompletions, at(10, 18)] }, NOW),
    ).toEqual({ weeks: 3, thisWeekDone: true });
  });

  it('una semana vacía en medio corta la racha', () => {
    const input = { lessonCompletions: [at(9, 26), at(10, 11)], movementDays: [] };
    expect(weeklyStreak(input, NOW).weeks).toBe(1);
  });

  it('recentWeeks devuelve las últimas semanas, la más vieja primero', () => {
    const input = { lessonCompletions: [at(10, 11), at(10, 18)], movementDays: [] };
    expect(recentWeeks(input, NOW, 3)).toEqual([false, true, true]);
  });
});

describe('hormigaGrowth', () => {
  it('compara con el mismo tramo del mes pasado', () => {
    const rows = [
      { amount: 20_000, occurredAt: at(9, 5) }, // octubre, dentro del tramo (1–19)
      { amount: 50_000, occurredAt: at(9, 25) }, // octubre, fuera del tramo
      { amount: 27_000, occurredAt: at(10, 10) }, // noviembre
    ];
    expect(hormigaGrowth(rows, NOW)).toBeCloseTo(0.35);
  });

  it('null si el mes pasado no hubo con qué comparar, o fue muy poco', () => {
    expect(hormigaGrowth([{ amount: 5_000, occurredAt: at(10, 3) }], NOW)).toBeNull();
    const poco = [
      { amount: 2_000, occurredAt: at(9, 2) },
      { amount: 3_000, occurredAt: at(10, 2) },
    ];
    expect(hormigaGrowth(poco, NOW)).toBeNull();
  });

  it('el 31 de marzo se compara contra todo febrero, por día', () => {
    const march31 = new Date(2027, 2, 31, 20);
    const rows = [
      { amount: 28_000, occurredAt: new Date(2027, 1, 28, 9).getTime() },
      { amount: 31_000, occurredAt: new Date(2027, 2, 2, 9).getTime() },
    ];
    // 31.000 en 31 días = 28.000 en 28 días: mismo ritmo.
    expect(hormigaGrowth(rows, march31)).toBeCloseTo(0);
  });
});

describe('pickNextLesson', () => {
  const base: NextLessonContext = {
    lessons: LESSONS,
    completedIds: new Set(),
    diagnostic: null,
    hormigaGrowth: null,
    tightBudget: null,
    goalsCount: 1,
  };

  it('sin señales: la primera, como base', () => {
    const next = pickNextLesson(base);
    expect(next?.lesson.id).toBe('gastos-hormiga');
    expect(next?.reason).toBe('Empieza por aquí: es la base.');
  });

  it('hormigas un 30 % arriba: sugiere esa lección con el porcentaje', () => {
    const next = pickNextLesson({
      ...base,
      completedIds: new Set(['presupuesto-50-30-20']),
      hormigaGrowth: 0.35,
    });
    expect(next?.lesson.id).toBe('gastos-hormiga');
    expect(next?.reason).toBe('Tus gastos hormiga van 35 % arriba frente al mes pasado.');
  });

  it('un tope apretado sugiere presupuesto', () => {
    const next = pickNextLesson({ ...base, tightBudget: 'Domicilios' });
    expect(next?.lesson.id).toBe('presupuesto-50-30-20');
  });

  it('usa el diagnóstico: pago mínimo → tarjeta de crédito', () => {
    const next = pickNextLesson({ ...base, diagnostic: { credito: 'pago-minimo' } });
    expect(next?.lesson.id).toBe('tarjeta-credito');
  });

  it('si la sugerida ya está hecha, pasa a la siguiente regla', () => {
    const next = pickNextLesson({
      ...base,
      completedIds: new Set(['tarjeta-credito']),
      diagnostic: { credito: 'pago-minimo', estafas: 'varias' },
    });
    expect(next?.lesson.id).toBe('estafas-transferencias');
  });

  it('el motivo no contradice el diagnóstico', () => {
    const next = pickNextLesson({
      ...base,
      completedIds: new Set(['gastos-hormiga']),
      goalsCount: 0,
      diagnostic: { emergencia: 'si' },
    });
    expect(next?.reason).toBe('Aún no tienes Apartados: el de emergencias es buen comienzo.');
  });

  it('sin Apartados → fondo de emergencia', () => {
    const next = pickNextLesson({
      ...base,
      completedIds: new Set(['gastos-hormiga']),
      goalsCount: 0,
    });
    expect(next?.lesson.id).toBe('fondo-emergencia');
  });

  it('todas hechas → null', () => {
    expect(pickNextLesson({ ...base, completedIds: new Set(LESSONS.map((l) => l.id)) })).toBeNull();
  });
});

describe('quiz', () => {
  it('cuenta aciertos y no premia lo que no respondió', () => {
    const quiz = [{ answer: 1 }, { answer: 0 }, { answer: 2 }];
    expect(quizScore([1, 0, 0], quiz)).toBe(2);
    expect(quizScore([null, null, 2], quiz)).toBe(1);
  });

  it('mensajes sin regaños', () => {
    expect(scoreMessage(3, 3)).toMatch(/Todas bien/);
    expect(scoreMessage(0, 2)).toMatch(/no hay afán/);
    expect(scoreMessage(1, 2)).toBe(
      '1 de 2. Vas bien: cuando quieras, repásala y la sacas completa.',
    );
  });
});
