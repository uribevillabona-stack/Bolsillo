# BOLSILLO

App móvil de finanzas personales para jóvenes colombianos (16–26 años). Registra los gastos
hormiga en menos de 3 segundos, detecta los movimientos a partir de las notificaciones de las
apps bancarias (Android) y enseña a manejar la plata con micro-lecciones conectadas a tus datos.

Proyecto de opción de grado — Ingeniería de Software, FET.

**Costo cero:** sin servidor, sin base de datos en la nube, sin APIs de pago. Todo vive en el
teléfono (SQLite) y se compila en tu propio computador.

---

## Stack

| Capa | Tecnología |
|---|---|
| App | Expo SDK 58 · React Native 0.88 · TypeScript estricto · React Compiler |
| Navegación | Expo Router (rutas en `src/app/`) |
| Estado | Zustand |
| Datos | expo-sqlite + Drizzle ORM (local-first, migraciones versionadas) · zod para respaldos |
| Animación | Reanimated 4 · Gesture Handler 3 · expo-haptics |
| Íconos / Fuentes | Phosphor · Bricolage Grotesque, Geist, Geist Mono |
| Detección (Fase 3) | Módulo nativo Kotlin con Expo Modules API |
| Calidad | Jest · ESLint · Prettier |

## Requisitos (Windows)

- Node.js 20 o superior y Git.
- Un teléfono Android con **depuración USB** activada, y su cable.
- JDK 17 y Android SDK. Se instalan solos con el script de abajo; **no hace falta Android
  Studio** (solo si quieres usar el emulador).

> **Ubica el proyecto fuera de OneDrive** y en una ruta corta (p. ej. `C:\dev\bolsillo`).
> OneDrive bloquea archivos durante la compilación, y en Windows las rutas largas rompen la
> compilación nativa (CMake).

### 1. Instalar las herramientas de Android (una sola vez)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-android.ps1
```

Instala JDK 17 (Temurin), las herramientas de línea de comandos del SDK, platform-tools (`adb`),
la plataforma 37, las build-tools 37, el NDK 27.1 y CMake. Además configura `JAVA_HOME`,
`ANDROID_HOME` y `PATH`. No pide permisos de administrador. **Cierra y vuelve a abrir la
terminal** al terminar.

**Rutas largas (obligatorio, una sola vez, como administrador).** React Native genera rutas
C++ de más de 260 caracteres, y sin este ajuste la compilación falla con
`Filename longer than 260 characters`. Abre PowerShell *como administrador* y ejecuta:

```powershell
Set-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name LongPathsEnabled -Value 1 -Type DWord
```

Además, el proyecto fija CMake 3.31.6, que trae ninja 1.12 con soporte de rutas largas, mediante
`plugins/with-cmake-version.js`. El script ya lo instala.

### 2. Preparar el teléfono

1. *Ajustes → Acerca del teléfono →* toca 7 veces **Número de compilación**.
2. *Ajustes → Opciones de desarrollador →* activa **Depuración USB**.
3. Conecta el cable y acepta el diálogo "¿Permitir depuración USB?".
4. Comprueba que se vea con `adb devices`.

### 3. Instalar y correr el development build

```bash
npm install
npm run android        # compila e instala la app de desarrollo en el teléfono (1.ª vez: 10–20 min)
npm start              # en adelante, solo esto: arranca Metro y la app recarga al guardar
```

BOLSILLO usa un *development build* (no Expo Go), porque tiene código nativo propio.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo (Metro) para el development build |
| `npm run android` | Compila e instala el development build en el teléfono |
| `npm run check` | Typecheck + lint + pruebas (correr antes de cada commit) |
| `npm test` | Pruebas unitarias (Jest) |
| `npm run format` | Formatea el código con Prettier |
| `npm run prebuild` | Regenera la carpeta `android/` desde `app.json` |
| `npm run db:generate` | Genera una migración SQL tras cambiar `src/db/schema.ts` |
| `npm run android:release` | Compila e instala la versión de release |

## Generar el APK para instalar sin Play Store

La cuenta de Google Play cuesta y no hace falta para la sustentación: se entrega el APK.

```bash
npm run prebuild
cd android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

El APK trae solo las arquitecturas ARM (`armeabi-v7a` y `arm64-v8a`), que cubren todos los
celulares reales; x86 solo sirve para emuladores. Se fija en `app.json` con el config plugin
`plugins/with-architectures.js`. El development build (`npm run android`) no cambia: compila
solo la arquitectura del dispositivo conectado.

### APK firmado con la clave propia

El APK de release se firma con una clave propia del proyecto (gratis, con `keytool` del JDK).
La clave **no está en el repositorio**: el config plugin `plugins/with-release-signing.js`
la toma de `%USERPROFILE%\.gradle\gradle.properties`. Para crearla en un computador nuevo:

```powershell
mkdir C:\dev\bolsillo-keys
C:\dev\tools\jdk-17\bin\keytool.exe -genkeypair -v -storetype PKCS12 `
  -keystore C:\dev\bolsillo-keys\bolsillo-release.keystore -alias bolsillo `
  -keyalg RSA -keysize 2048 -validity 10000
```

Y agrega a `%USERPROFILE%\.gradle\gradle.properties` (con la contraseña que escogiste):

```properties
BOLSILLO_RELEASE_STORE_FILE=C:/dev/bolsillo-keys/bolsillo-release.keystore
BOLSILLO_RELEASE_STORE_PASSWORD=tu-contraseña
BOLSILLO_RELEASE_KEY_ALIAS=bolsillo
BOLSILLO_RELEASE_KEY_PASSWORD=tu-contraseña
```

> **Guarda una copia de la clave** (USB o tu Drive personal). Si se pierde, un APK nuevo no
> puede actualizar el que ya está instalado: habría que desinstalar y perder los datos (salvo
> que se exporte un respaldo antes). Sin estas propiedades el release se firma con la clave de
> depuración: compila igual, pero sirve solo para pruebas.

Para verificar con qué clave quedó firmado:
`%LOCALAPPDATA%\Android\Sdk\build-tools\37.0.0\apksigner.bat verify --print-certs app-release.apk`.

Para instalarlo en otro teléfono: envía el `.apk` (Drive, WhatsApp, cable), ábrelo y permite
"instalar apps de origen desconocido" cuando Android lo pida.

> **Detección automática (Fase 3), Android 13+:** como el APK no viene de una tienda, Android
> bloquea el acceso a notificaciones hasta que el usuario vaya a *Info de la app → ⋮ → Permitir
> ajustes restringidos*. La app guía este paso.

## Estructura

```
src/
  app/                 rutas (Expo Router): (tabs)/ inicio, movimientos, aprende, plan
  components/          design system: Button, AmountText, Chip, ListRow, Sheet,
                       NumericKeypad, ProgressRing (+ Text, Screen, TabBar, icons)
  theme/               tokens: colores claro/oscuro, tipografía, espaciado (escala de 4), movimiento
  features/            lógica por funcionalidad (expenses, detection, learn, budget, goals, onboarding)
  lib/                 formato COP, fechas, hápticos
modules/               módulos nativos (Fase 3: bank-notifications en Kotlin)
content/lessons/       lecciones en JSON, editables sin tocar código (ver su README)
docs/                  plan, decisiones y documentación técnica
scripts/               setup-android.ps1
```

La carpeta `android/` se genera con `prebuild` y **no se versiona**: toda la configuración nativa
vive en `app.json` y en config plugins.

## Decisiones de diseño

- **Montos como enteros de pesos**, nunca `float`. El formato `$ 12.500` se hace a mano en
  `src/lib/money.ts` (los datos de `Intl` de Hermes varían entre teléfonos).
- **Contraste AA verificado por pruebas** (`src/theme/__tests__/contrast.test.ts`). El coral
  `#FF6B4A` y el amarillo `#F2D479` se usan solo como relleno, porque como texto sobre el fondo
  hueso no alcanzan AA; para texto de alerta existe `accentText`. En modo oscuro el verde de
  marca se aclara (`#6CC39F`), porque `#0E4D3A` sobre `#111210` daría 1,9:1.
- **Bordes de 1px en lugar de sombras**, radios de 12–16 px y cifras tabulares en los montos.
- **Íconos importados uno por uno** desde Phosphor: el paquete completo agrega ~10 MB al bundle.
- **No se leen SMS**: `READ_SMS` y `RECEIVE_SMS` están bloqueados en `app.json`.

Plan completo por fases: [`docs/plan.md`](docs/plan.md).

## Datos y respaldo

- Todo vive en `bolsillo.db` (SQLite) dentro del almacenamiento privado de la app. Al abrirla se
  aplican las migraciones pendientes de `src/db/migrations/` y se siembran categorías y atajos.
- **Cambiar el esquema:** edita `src/db/schema.ts` y corre `npm run db:generate`. Nunca edites
  una migración ya publicada; crea una nueva.
- **Respaldo:** Ajustes → Respaldo exporta un JSON (formato en `src/features/backup/backup-format.ts`,
  validado con zod) y lo comparte por Drive, WhatsApp o correo. Restaurar reemplaza todo, en
  una sola transacción, y se puede deshacer durante 5 segundos.

## Problemas conocidos

- **Pantalla en blanco al abrir la app en desarrollo:** Metro no responde. Si se agregó una
  librería nativa o se cambió `metro.config.js` o `babel.config.js`, reinicia Metro
  (`npm start -- --clear`). `metro.config.js` excluye las salidas de compilación nativa
  (`android/build`, `.cxx`), que suman varios GB y hacían que Metro nunca respondiera.
- **Librería nativa nueva:** hay que recompilar el development build (`npm run android`); el APK
  instalado no la trae.
- **Rutas tipadas en Windows:** `@expo/cli` tipa `src/app/ajustes/index.tsx` como
  `/ajustes/index` en vez de `/ajustes`. Ver `src/lib/routes.ts`.
