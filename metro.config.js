// Metro: configuración del empaquetador de JavaScript.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Las migraciones de Drizzle (.sql) se empaquetan dentro de la app como texto
// (no hay servidor: todo es local).
config.resolver.sourceExts.push('sql');

// No indexar salidas de compilación nativa: `android/` y los `android/build`
// y `.cxx` de cada librería nativa en node_modules suman varios GB de
// binarios. Si Metro los indexa (p. ej. con --clear), arranca sin responder
// durante minutos y la app se queda en pantalla blanca.
const nativeBuildOutputs = [
  /[\\/]android[\\/](app[\\/])?(build|\.cxx|\.gradle|\.kotlin)[\\/].*/,
  /[\\/]ios[\\/](build|Pods)[\\/].*/,
];
const existing = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  ...nativeBuildOutputs,
];

module.exports = config;
