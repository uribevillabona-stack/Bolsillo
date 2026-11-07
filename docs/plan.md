# Plan de BOLSILLO

Documento vivo: aquí quedan las fases, el esquema de datos, los riesgos y las decisiones que
se aprobaron. Se actualiza al cerrar cada fase.

## Decisiones aprobadas

| Fecha      | Decisión                                                                                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-05 | Proyecto en `C:\dev\bolsillo` (fuera de OneDrive). Repo: `github.com/uribevillabona-stack/Bolsillo`.                                                                                                                            |
| 2026-11-05 | Pestañas: Inicio · Movimientos · Aprende · Plan. Botón flotante de registro en todas.                                                                                                                                           |
| 2026-11-05 | `zod` para validar el JSON de respaldo al importarlo.                                                                                                                                                                           |
| 2026-11-05 | Rutas en `src/app/` (convención de Expo SDK 58) en lugar de `app/` en la raíz: todo el código queda bajo `src/`.                                                                                                                |
| 2026-11-05 | El onboarding se construye en la Fase 2, junto con la base de datos (necesita la tabla `profile`).                                                                                                                              |
| 2026-11-05 | Sin `expo-document-picker`: `expo-file-system` (SDK 58) ya trae `File.pickFileAsync()`. Una dependencia menos.                                                                                                                  |
| 2026-11-05 | Las tablas de fases futuras (pendientes, reglas de comercio, presupuestos, lecciones) llegan como migraciones nuevas en su fase, no en la inicial: así se ve cómo evoluciona el esquema.                                        |
| 2026-11-05 | Proyección anual de hormigas con ventana móvil de 7 a 30 días según la historia del usuario (ver `hormigas-stats.ts`).                                                                                                          |
| 2026-11-05 | Importar un respaldo es la única acción con confirmación explícita (reemplaza todo); además se puede deshacer. El resto usa "deshacer" sin diálogos.                                                                            |
| 2026-11-06 | La Fase 3 (detección) se aplaza hasta tener ejemplos reales de notificaciones; se avanza con las fases 4, 5 y 6, que no dependen de ellos.                                                                                      |
| 2026-11-06 | Topes de presupuesto: uno por categoría que se repite cada mes (tabla `budgets` sin columna de mes). Las alertas del 80 % y 100 % se guardan por mes en `budget_alerts` para avisar una sola vez.                               |
| 2026-11-06 | La alerta del presupuesto va dentro del snackbar de "guardado" (con marca coral), sin diálogos: informa, no bloquea.                                                                                                            |
| 2026-11-06 | Lo separado en Apartados sale del disponible del mes; un retiro lo devuelve. Un retiro nunca deja un Apartado en negativo. Un aporte marcado "Ya la tenía ahorrada" (`from_savings`) cuenta para la meta pero no resta del mes. |
| 2026-11-06 | Cuota mensual de un Apartado = lo que faltaba al empezar el mes ÷ meses que quedan (contando el actual): aportar a mitad de mes no baja la cuota de ese mes.                                                                    |
| 2026-11-06 | Recomendaciones: motor de reglas locales ordenadas por prioridad; "Ahora no" la oculta 3 días (`recommendation_dismissals`).                                                                                                    |
| 2026-11-06 | Montos con espacio de no separación (U+00A0) entre `$` y el número: nunca quedan en líneas distintas.                                                                                                                           |
| 2026-11-06 | Respaldo v2: incluye los topes, los aportes "ya la tenía ahorrada" y las lecciones terminadas. Un respaldo v1 se sigue leyendo.                                                                                                 |
| 2026-11-06 | Aprende: ninguna lección se bloquea. Según los datos cambia cuál se sugiere y por qué (hormigas +30 % frente al mismo tramo del mes pasado, tope apretado, respuestas del diagnóstico, sin Apartados).                          |
| 2026-11-06 | Racha semanal: una semana cuenta si se termina una lección o se anotan gastos 3 días distintos; la semana en curso no rompe la racha hasta que termina. Sin puntos ni medallas.                                                 |
| 2026-11-06 | Lecciones (5): gastos hormiga, 50/30/20, fondo de emergencia, tarjeta de crédito, estafas por transferencia. El contenido se valida con zod en las pruebas.                                                                     |

## Fases

| Fase                    | Entregable                                                                                                                                                                                                 | Estado    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1. Base                 | Expo SDK 58 + TS estricto, tema, design system, navegación, Jest/ESLint/Prettier, script de herramientas Android                                                                                           | Hecha     |
| 2. Gastos hormiga       | Drizzle + migraciones, onboarding, registro rápido con persistencia y deshacer, vista Hormigas con proyección anual, atajos editables, exportar/importar JSON                                              | Hecha     |
| 3. Detección (aplazada) | Módulo Kotlin `NotificationListenerService` + cola nativa, parsers por banco con pruebas, deduplicación, bandeja de pendientes, aprendizaje comercio → categoría, intent de compartir, `docs/deteccion.md` | Pendiente |
| 4. Plan e Inicio        | Presupuesto por categoría con alerta al 80 %, Apartados, dashboard, motor de recomendaciones                                                                                                               | Hecha     |
| 5. Aprende              | 5 lecciones en JSON + quiz, recomendación por comportamiento, racha semanal                                                                                                                                | Hecha     |
| 6. Pulido               | Modo oscuro completo, TalkBack, estados vacíos y de error, APK firmado con clave propia                                                                                                                    | Pendiente |

## Pantallas

```
src/app/
  _layout.tsx                 fuentes, tema, (Fase 2) migraciones y redirección a onboarding
  (onboarding)/               perfil · meta · diagnóstico · consentimiento de detección
  (tabs)/                     index (Inicio) · movimientos · aprende · plan
  pendientes.tsx              bandeja de movimientos detectados
  movimiento/[id].tsx · apartado/[id].tsx · leccion/[id].tsx
  ajustes/                    atajos · detección · respaldo · categorías · inspector (dev)
  catalogo.tsx                catálogo del design system (solo en desarrollo)
```

**Saldo disponible del mes** = ingresos del mes (registrados o detectados; si no hay, el
estimado del onboarding) − egresos del mes − aportes a Apartados del mes.

## Esquema de base de datos (Fase 2)

Montos: `INTEGER` en pesos. Fechas: epoch en milisegundos.

| Tabla                       | Campos clave                                                                                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profile` (1 fila)          | `name`, `income_type`, `income_range`, `monthly_income_estimate`, `diagnostic` (json), `onboarding_done`, `detection_enabled`, `theme`                                                             |
| `categories`                | `id`, `name`, `icon`, `kind` (gasto/ingreso), `is_hormiga`, `archived`                                                                                                                             |
| `transactions`              | `id`, `type` (expense/income/transfer_in/transfer_out), `amount`, `category_id`, `note`, `merchant`, `bank`, `occurred_at`, `source` (manual/atajo/detectado/compartido), `created_at`             |
| `shortcuts`                 | `id`, `label`, `icon`, `amount`, `category_id`, `sort_order`                                                                                                                                       |
| `pending_movements`         | `id`, `bank`, `package`, `raw_title`, `raw_text` (se borra al resolver), `parsed_type`, `amount`, `counterparty`, `occurred_at`, `dedup_hash`, `suggested_category_id`, `status`, `transaction_id` |
| `merchant_rules`            | `merchant_key` (PK), `category_id`, `hits`, `updated_at`                                                                                                                                           |
| `budgets`                   | `id`, `category_id` (único), `limit_amount`, `created_at` — tope que se repite cada mes                                                                                                            |
| `budget_alerts`             | (`month`, `category_id`, `threshold`) PK, `shown_at` — avisos del 80 % / 100 % ya mostrados                                                                                                        |
| `goals` (Apartados)         | `id`, `name`, `target_amount`, `target_date`, `created_at`, `completed_at`, `archived`                                                                                                             |
| `goal_contributions`        | `id`, `goal_id`, `amount` (negativo = retiro), `note`, `created_at`                                                                                                                                |
| `lesson_completions`        | `id`, `lesson_id`, `score`, `total`, `completed_at` — una fila por cada vez que se termina                                                                                                         |
| `recommendation_dismissals` | `rule_key` (PK), `dismissed_at`                                                                                                                                                                    |

## Riesgos

| Riesgo                                                                                                             | Mitigación                                                                                         |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| "Ajustes restringidos" de Android 13+ para APK instalados fuera de una tienda: bloquean el acceso a notificaciones | Guía en la app y en el README (_Info de la app → ⋮ → Permitir ajustes restringidos_)               |
| Android 15 censura las notificaciones "sensibles" (con OTP) a las apps de escucha                                  | Se descartan sin crear pendiente; documentado                                                      |
| Los formatos de notificación cambian por banco y por versión                                                       | Un parser por banco con pruebas sobre ejemplos reales; si no coincide, no se inventa un movimiento |
| Algunos bancos avisan por SMS, no por notificación                                                                 | Compartir el texto hacia BOLSILLO (intent de Android). Nunca se leen SMS                           |
| Capas de batería (Xiaomi, Samsung) matan el servicio de escucha                                                    | `requestRebind()` al abrir la app y una guía para excluir la app                                   |
| Contraste de la paleta (coral y amarillo como texto, verde en modo oscuro)                                         | Roles separados (`accentText`, verde aclarado) y prueba automática de contraste AA                 |
| iOS no permite leer notificaciones de otras apps                                                                   | Fuera de alcance; el código queda compatible, sin detección                                        |

## Pendiente del equipo

- Ejemplos reales **anonimizados** de notificaciones (compra, transferencia enviada y recibida)
  de Nequi, Daviplata, Bancolombia, Nu y los demás bancos que usen. Hacen falta para la Fase 3.
