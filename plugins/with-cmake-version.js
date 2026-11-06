/**
 * Config plugin: fija la versión de CMake del módulo `app` de Android.
 *
 * ¿Por qué? En Windows, el codegen de react-native-gesture-handler genera
 * rutas de objetos de ~320 caracteres. El CMake 3.22.1 que React Native usa
 * por defecto trae ninja 1.10, que no soporta rutas de más de 260 caracteres
 * ("Filename longer than 260 characters"). CMake 3.31.x trae ninja 1.12,
 * que sí las soporta cuando Windows tiene `LongPathsEnabled = 1`.
 *
 * Como `android/` se regenera con `expo prebuild` (CNG), el ajuste vive aquí
 * y no en `android/app/build.gradle` a mano.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// @bolsillo/with-cmake-version';

module.exports = function withCmakeVersion(config, { version = '3.31.6' } = {}) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error('with-cmake-version: se esperaba android/app/build.gradle en Groovy.');
    }
    if (cfg.modResults.contents.includes(MARKER)) return cfg;

    const block = [
      `    ${MARKER}`,
      '    externalNativeBuild {',
      '        cmake {',
      `            version "${version}"`,
      '        }',
      '    }',
    ].join('\n');

    // Se inserta justo después de `ndkVersion ...` dentro de `android { }`.
    const anchor = /^(\s*ndkVersion .+)$/m;
    if (!anchor.test(cfg.modResults.contents)) {
      throw new Error('with-cmake-version: no se encontró `ndkVersion` en app/build.gradle.');
    }
    cfg.modResults.contents = cfg.modResults.contents.replace(anchor, `$1\n${block}`);
    return cfg;
  });
};
