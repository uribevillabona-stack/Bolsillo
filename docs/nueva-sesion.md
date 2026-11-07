# Nueva sesión: cómo retomar BOLSILLO

Documento de traspaso entre sesiones de trabajo. Se actualiza al cerrar cada sesión.
**Última actualización:** 2026-11-06, Fase 5 guardada; Fase 6 a medias.

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
| 6. Pulido                      | En curso     | Ver abajo                                                                                                                               |

### Fase 5

- 5 lecciones en `content/lessons/*.json` (+ `README.md` para el equipo): gastos hormiga,
  50/30/20, fondo de emergencia, tarjeta de crédito, estafas por transferencia.
- `src/features/learn/`: validación con zod, racha semanal, lección sugerida según los datos
  (hormigas +30 %, tope apretado, diagnóstico, sin Apartados), quiz.
- Pantallas: `src/app/(tabs)/aprende.tsx`, `src/app/leccion/[id].tsx`; "Próxima lección" en Inicio.
- Migración `0002_lecciones.sql` (tabla `lesson_completions`); respaldo v2 incluye las lecciones.
- Verificado en el teléfono: tarjetas que se deslizan, quiz con explicación, resultado, racha
  "1 semana", progreso 1 de 5, modo claro.

### Fase 6 (lo hecho hasta ahora)

- **Firma propia del APK:** `plugins/with-release-signing.js` (registrado en `app.json`) y la
  sección "APK firmado con la clave propia" del README.
  - La clave está en `C:\dev\bolsillo-keys\bolsillo-release.keystore` (con un `LEEME.txt`).
  - La contraseña está en `%USERPROFILE%\.gradle\gradle.properties` (`BOLSILLO_RELEASE_*`).
  - **Nunca subirlas al repositorio. Hacer copia de seguridad de la clave.**
- Se corrió `expo prebuild --clean` y quedó compilando `assembleRelease` (log en
  `%TEMP%\release.log`). Falta verificar la firma con `apksigner verify --print-certs`.
- `src/features/shared/RouteError.tsx`: pantalla de error con "Reintentar", ya conectada como
  `ErrorBoundary` del layout raíz (falta probarla forzando un error).
- `.gitignore` ignora `*.keystore`. El plugin exige las cuatro propiedades `BOLSILLO_RELEASE_*`.
- Modo claro revisado en Plan y Aprende: bien.

## Qué sigue (en orden)

1. Revisar si terminó `assembleRelease` (log en `%TEMP%
elease.log`). Ojo: se compiló con
   la versión anterior del plugin; para el APK final, correr de nuevo
   `npx expo prebuild --platform android --clean --no-install` y `cd android && ./gradlew assembleRelease`.
2. Probar `RouteError` (forzar un error en una pantalla en desarrollo y quitarlo).
3. Verificar el APK firmado: `apksigner verify --print-certs android/app/build/outputs/apk/release/app-release.apk`.
   **No instalarlo encima del development build:** la firma es distinta, Android obliga a
   desinstalar y se pierden los datos de prueba.
4. Pasada de accesibilidad (TalkBack) y estados vacíos y de error que falten.
5. Revisión independiente final, actualizar `docs/plan.md` (Fase 6 = Hecha), README, commit y push.
6. Fase 3, cuando lleguen los ejemplos de notificaciones.

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
- `adb shell input keyevent 111` (Esc) cierra los sheets. Para cerrar el teclado, usa el botón ✓.
- Lanzar agentes de revisión en segundo plano y seguir con trabajo que no toque los mismos archivos.
