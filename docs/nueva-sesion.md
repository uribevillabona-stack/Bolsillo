# Nueva sesión: cómo retomar BOLSILLO

Documento de traspaso entre sesiones de trabajo. Se actualiza al cerrar cada sesión.
**Última actualización:** 2026-11-07, Fase 6 terminada (con errores dentro de los sheets); solo queda la Fase 3 (aplazada).

## Para arrancar una sesión nueva

Pega esto al empezar:

> Retomemos BOLSILLO. El proyecto está en `C:\dev\bolsillo` (no en OneDrive). Lee primero
> `docs/nueva-sesion.md`, `docs/plan.md` y `AGENTS.md`, revisa `git status` y sigue con lo
> pendiente de la sección "Qué sigue". Mi teléfono está conectado por USB: úsalo sin pedirme
> permiso. Responde en español.

## Estado por fase

| Fase                           | Estado       | Dónde quedó                                                                                                                             |
| ------------------------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Base                        | Hecha        | En GitHub                                                                                                                               |
| 2. Gastos hormiga              | Hecha        | En GitHub                                                                                                                               |
| 3. Detección de notificaciones | **Aplazada** | Espera ejemplos reales de notificaciones de los bancos (compra, transferencia enviada y recibida), con datos personales cambiados       |
| 4. Plan e Inicio               | Hecha        | En GitHub (`bca236f`, `c4c87ee`). Revisión independiente aprobada (16 hallazgos corregidos)                                             |
| 5. Aprende                     | Hecha        | En GitHub. Revisión independiente aprobada; se corrigieron sus sugerencias (scroll con letra grande, TalkBack, cifras de las lecciones) |
| 6. Pulido                      | Hecha        | Ver abajo. Revisión independiente final                                                                                                 |

### Fase 5

- 5 lecciones en `content/lessons/*.json` (+ `README.md` para el equipo): gastos hormiga,
  50/30/20, fondo de emergencia, tarjeta de crédito, estafas por transferencia.
- `src/features/learn/`: validación con zod, racha semanal, lección sugerida según los datos
  (hormigas +30 %, tope apretado, diagnóstico, sin Apartados), quiz.
- Pantallas: `src/app/(tabs)/aprende.tsx`, `src/app/leccion/[id].tsx`; "Próxima lección" en Inicio.
- Migración `0002_lecciones.sql` (tabla `lesson_completions`); respaldo v2 incluye las lecciones.
- Verificado en el teléfono: tarjetas que se deslizan, quiz con explicación, resultado, racha
  "1 semana", progreso 1 de 5, modo claro.

### Fase 6

- **APK firmado con la clave propia:** `plugins/with-release-signing.js` y la sección
  "APK firmado con la clave propia" del README.
  - La clave está en `C:devolsillo-keysolsillo-release.keystore` (con un `LEEME.txt`).
  - La contraseña está en `%USERPROFILE%.gradlegradle.properties` (`BOLSILLO_RELEASE_*`).
  - **Nunca subirlas al repositorio. Hacer copia de seguridad de la clave.**
  - 2026-11-07: se corrigió el plugin (precedencia en Groovy, ver "Lecciones aprendidas").
- **Solo ARM:** `plugins/with-architectures.js` deja `armeabi-v7a` y `arm64-v8a`. APK de ~55 MB
  (antes ~110 MB). Verificado con `apksigner`: `CN=BOLSILLO, OU=Ingenieria de Software, O=FET`.
- **Pantalla de error:** `RouteError` como `ErrorBoundary` del layout raíz. Probada en el
  teléfono forzando un error: se ve en español y "Reintentar" recupera la app (vuelve a Inicio).
- **Accesibilidad (TalkBack):** `speakMoney` en `money.ts`; el `Text` del design system lee los
  montos embebidos como "2500 pesos"; filas con el monto en la etiqueta; encabezados; radios en el
  diagnóstico; pistas en los chips; el monto del teclado se anuncia; anillos y barras dentro de
  filas tocables son `decorative` (sin paradas de foco repetidas). Revisado con
  `uiautomator dump` en Plan, Apartado y Movimientos.
- **Estados de error:** si falla la base de datos al arrancar, el splash se oculta y se ve el
  error. Si guardar o eliminar falla en un sheet, el error se ve dentro del sheet y el sheet no
  se cierra: hook `useSheetError` y prop `error` de `Sheet` (un snackbar quedaría detrás del
  Modal). Respaldo maneja los errores al elegir archivo y al tomar la copia para "Deshacer".
- **APK final:** `android/app/build/outputs/apk/release/app-release.apk`.
  **No instalarlo encima del development build:** la firma es distinta, Android obliga a
  desinstalar y se pierden los datos de prueba.

## Qué sigue

1. Recompilar el APK antes de entregarlo (`npm run prebuild` y `./gradlew assembleRelease` en
   `android/`): el último se compiló antes de los ajustes finales de la revisión de los errores en
   los sheets (se borran al abrir; el `try` del aporte cubre solo la escritura).
2. Fase 3 (detección de notificaciones), cuando lleguen los ejemplos reales de los bancos.
3. Opcional antes de la sustentación: probar el APK final en otro celular (sin development
   build instalado) y hacer una pasada con TalkBack encendido de verdad.

## Cómo correr la app en el teléfono

- Teléfono: Redmi Note 13 Pro, Android 16, depuración USB + "Instalar vía USB".
- `adb`: `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`. JDK: `C:\dev\tools\jdk-17`.
- `adb reverse tcp:8081 tcp:8081` y luego `npx expo start --dev-client` en `C:\dev\bolsillo`.
- Abrir la app: `adb shell am start -a android.intent.action.VIEW -d "exp+bolsillo://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"`.
- Ir directo a una pantalla: `adb shell am start -a android.intent.action.VIEW -d "bolsillo://ajustes" co.edu.fet.bolsillo`
  (también `bolsillo://plan`, `bolsillo://aprende`). Sirve porque el botón flotante del menú de
  desarrollo tapa el engranaje de Ajustes.
- Capturas: `adb exec-out screencap -p > captura.png`. En las imágenes reducidas, multiplicar
  las coordenadas por 1,2 para tocar.
- En el teléfono quedó la usuaria de prueba "Valentina" con los Apartados "Viaje" y "Matricula",
  y la lección de hormigas terminada. Para empezar de cero: `adb shell pm clear co.edu.fet.bolsillo`.

## Lecciones aprendidas en esta sesión

- **Migraciones:** si se cambia un `.sql` de migración, reiniciar Metro con `--clear` (el SQL va
  incrustado en el bundle). Una migración ya publicada nunca se regenera: se crea una nueva.
- **Teclado y botones:** el `ScrollView` de la pantalla es ancestro de los Modal en el sistema de
  toques. Sin `keyboardShouldPersistTaps="handled"` se tragaba el primer toque con el teclado
  abierto. Ya está corregido en `Screen.tsx`.
- **Montos:** `formatCOP` usa espacio de no separación. El texto libre (lecciones) pasa por
  `keepMoneyTogether`.
- Para cerrar un sheet con adb usa `adb shell input keyevent 4` (atrás). **No uses `111` (Esc):**
  lo cierra, pero después la app deja de recibir toques hasta reiniciarla (pasa también con el
  código anterior; es cosa de adb, un usuario no lo vive). Para cerrar el teclado, el botón ✓.
- No mandar "atrás" mientras la app carga el bundle: la saca al inicio del teléfono. Esperar a que
  `uiautomator dump` muestre `Registrar gasto`.
- Lanzar agentes de revisión en segundo plano y seguir con trabajo que no toque los mismos archivos.
- **Groovy:** `signingConfig (cond) ? a : b` se lee como `signingConfig(cond) ? a : b`. Usar
  `signingConfig((cond) ? a : b)`.
- **Probar un ErrorBoundary:** React reintenta una vez el render tras un error; un error que
  salta solo la primera vez no llega al boundary. Hacerlo fallar varias veces seguidas. Y nunca
  tocar código mientras Gradle empaqueta el JS del release (`createBundleReleaseJsAndAssets`).
- **Árbol de accesibilidad sin TalkBack:** `adb shell uiautomator dump /sdcard/ui.xml` y leer los
  `content-desc`. En Git Bash, exportar `MSYS_NO_PATHCONV=1` para que no traduzca `/sdcard`.
