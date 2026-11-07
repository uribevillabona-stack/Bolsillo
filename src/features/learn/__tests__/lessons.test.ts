/**
 * Valida el contenido de content/lessons/: si alguien del equipo edita un
 * JSON y lo deja mal, esta prueba lo dice antes de que llegue al teléfono.
 */
import { LESSON_IDS, LESSONS } from '../lessons';

describe('contenido de las lecciones', () => {
  it('hay 5 lecciones, con ids y orden únicos', () => {
    expect(LESSONS).toHaveLength(5);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    expect(new Set(LESSONS.map((l) => l.order)).size).toBe(LESSONS.length);
  });

  it('cada id usado por las reglas de recomendación existe', () => {
    const ids = new Set(LESSONS.map((l) => l.id));
    for (const id of Object.values(LESSON_IDS)) expect(ids.has(id)).toBe(true);
  });

  it('son micro-lecciones: de 3 a 5 minutos y de 1 a 3 preguntas', () => {
    for (const l of LESSONS) {
      expect(l.minutes).toBeGreaterThanOrEqual(3);
      expect(l.minutes).toBeLessThanOrEqual(5);
      expect(l.quiz.length).toBeGreaterThanOrEqual(1);
      expect(l.quiz.length).toBeLessThanOrEqual(3);
    }
  });

  it('nunca usa "bolsillo" para hablar de las metas (se llaman Apartados)', () => {
    // "BOLSILLO" (el nombre de la app, en mayúsculas) sí se permite.
    for (const l of LESSONS) {
      expect(JSON.stringify(l)).not.toMatch(/\b(un|el|los|tu|tus|mi|mis) bolsillos?\b/i);
    }
  });
});
