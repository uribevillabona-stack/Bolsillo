# Lecciones de Aprende

Cada archivo `.json` de esta carpeta es una micro-lección de 3 a 5 minutos. El equipo puede
editar el texto sin tocar código. Al guardar, `npm test` revisa que todo esté bien formado.

## Formato

```json
{
  "id": "gastos-hormiga",
  "order": 1,
  "title": "Los gastos hormiga",
  "summary": "Lo pequeño que se repite pesa más de lo que crees.",
  "minutes": 3,
  "cards": [
    { "title": "Título de la tarjeta", "body": "Texto. Saltos de línea con \\n." },
    { "title": "Con cifra grande", "highlight": "$ 600.000 al año", "body": "…" }
  ],
  "quiz": [
    {
      "question": "¿Pregunta?",
      "options": ["Opción A", "Opción B", "Opción C"],
      "answer": 1,
      "explanation": "Por qué la B es la correcta."
    }
  ]
}
```

| Campo     | Regla                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------- |
| `id`      | Minúsculas, números y guiones. No lo cambies: el progreso guardado lo usa.                           |
| `order`   | Posición en la lista (1, 2, 3…). Sin repetir.                                                        |
| `title`   | Máximo 60 caracteres.                                                                                |
| `summary` | Una frase, máximo 120 caracteres.                                                                    |
| `minutes` | Entre 3 y 5.                                                                                         |
| `cards`   | De 3 a 10 tarjetas. `body` hasta 600 caracteres; `highlight` (opcional) hasta 60.                    |
| `quiz`    | De 1 a 3 preguntas, de 2 a 4 opciones. `answer` es la posición de la correcta, **contando desde 0**. |

## Voz

- Cercana y directa, de tú, en español de Colombia. Sin regaños ni sermones.
- Ejemplos con plata real en pesos (`$ 2.500`, punto de miles).
- Las metas de ahorro se llaman **Apartados**. Nunca "bolsillos": ese es el nombre de la app.
- Si un dato puede cambiar (tasas, topes legales), dilo como ejemplo o con el nombre de la
  entidad que lo define, no como cifra fija.

## Agregar una lección nueva

1. Crea el JSON en esta carpeta.
2. Impórtalo en `src/features/learn/lessons.ts` (lista `RAW_LESSONS`).
3. Si quieres que se recomiende según los datos del usuario, agrega una regla en
   `src/features/learn/learn-logic.ts` (`pickNextLesson`).
4. Corre `npm test`.
