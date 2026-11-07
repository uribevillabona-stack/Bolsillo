/**
 * Catálogo de lecciones. El contenido vive en `content/lessons/*.json` para
 * que el equipo lo edite sin tocar código (ver content/lessons/README.md).
 * Aquí solo se registran y se validan con zod: un JSON mal escrito falla en
 * las pruebas, no en el teléfono de alguien.
 */
import { z } from 'zod';

import { keepMoneyTogether } from '@/lib/money';

import estafasTransferencias from '../../../content/lessons/estafas-transferencias.json';
import fondoEmergencia from '../../../content/lessons/fondo-emergencia.json';
import gastosHormiga from '../../../content/lessons/gastos-hormiga.json';
import presupuesto503020 from '../../../content/lessons/presupuesto-50-30-20.json';
import tarjetaCredito from '../../../content/lessons/tarjeta-credito.json';

const cardSchema = z.object({
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(600),
  /** Frase o cifra grande opcional ("$ 600.000 al año"). */
  highlight: z.string().min(1).max(60).optional(),
});

const questionSchema = z
  .object({
    question: z.string().min(1).max(200),
    options: z
      .array(z.string().min(1).max(100))
      .min(2)
      .max(4)
      .refine((o) => new Set(o).size === o.length, { message: 'opciones repetidas' }),
    /** Índice (desde 0) de la opción correcta. */
    answer: z.int().nonnegative(),
    explanation: z.string().min(1).max(300),
  })
  .refine((q) => q.answer < q.options.length, {
    message: 'answer apunta a una opción que no existe',
  });

export const lessonSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  order: z.int().positive(),
  title: z.string().min(1).max(60),
  summary: z.string().min(1).max(120),
  minutes: z.int().min(3).max(5),
  cards: z.array(cardSchema).min(3).max(10),
  quiz: z.array(questionSchema).min(1).max(3),
});

export type Lesson = z.infer<typeof lessonSchema>;
export type LessonCard = z.infer<typeof cardSchema>;
export type LessonQuestion = z.infer<typeof questionSchema>;

/** Para agregar una lección: crear el JSON e importarlo aquí. */
const RAW_LESSONS: readonly unknown[] = [
  gastosHormiga,
  presupuesto503020,
  fondoEmergencia,
  tarjetaCredito,
  estafasTransferencias,
];

/**
 * El contenido se escribe con espacio normal ("$ 2.500"); al cargarlo se une
 * "$" con la cifra para que nunca queden en líneas distintas.
 */
function typeset(lesson: Lesson): Lesson {
  const t = keepMoneyTogether;
  return {
    ...lesson,
    title: t(lesson.title),
    summary: t(lesson.summary),
    cards: lesson.cards.map((c) => ({
      title: t(c.title),
      body: t(c.body),
      ...(c.highlight ? { highlight: t(c.highlight) } : {}),
    })),
    quiz: lesson.quiz.map((q) => ({
      ...q,
      question: t(q.question),
      options: q.options.map(t),
      explanation: t(q.explanation),
    })),
  };
}

export const LESSONS: readonly Lesson[] = RAW_LESSONS.map((raw) =>
  typeset(lessonSchema.parse(raw)),
).sort((a, b) => a.order - b.order);

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

/** Ids conocidos, para que las reglas de recomendación no apunten a lecciones que no existen. */
export const LESSON_IDS = {
  hormigas: 'gastos-hormiga',
  presupuesto: 'presupuesto-50-30-20',
  emergencia: 'fondo-emergencia',
  credito: 'tarjeta-credito',
  estafas: 'estafas-transferencias',
} as const;
