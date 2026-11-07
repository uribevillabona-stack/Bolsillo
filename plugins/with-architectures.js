/**
 * Config plugin: fija las arquitecturas nativas que trae el APK.
 *
 * ¿Por qué? Por defecto React Native compila las librerías nativas para
 * cuatro arquitecturas (armeabi-v7a, arm64-v8a, x86, x86_64) y el APK de
 * release pesaba ~110 MB. x86 y x86_64 solo sirven para emuladores, así que
 * el APK que se reparte trae solo ARM:
 *   - arm64-v8a: casi todos los celulares desde 2017.
 *   - armeabi-v7a: celulares baratos de 32 bits (Android Go), que el público
 *     de BOLSILLO todavía usa.
 *
 * `expo run:android` compila solo la arquitectura del dispositivo conectado
 * (pasa `-PreactNativeArchitectures`), así que esto no afecta al development
 * build ni a los emuladores. Afecta a `./gradlew assembleRelease`.
 *
 * Como `android/` se regenera con `expo prebuild`, el ajuste vive aquí y no en
 * `android/gradle.properties` a mano.
 */
const { withGradleProperties } = require('expo/config-plugins');

const KEY = 'reactNativeArchitectures';
const VALID = ['armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'];

module.exports = function withArchitectures(
  config,
  { architectures = ['armeabi-v7a', 'arm64-v8a'] } = {},
) {
  if (!Array.isArray(architectures)) {
    throw new Error(
      'with-architectures: `architectures` debe ser una lista, p. ej. ["arm64-v8a"].',
    );
  }
  const unknown = architectures.filter((a) => !VALID.includes(a));
  if (architectures.length === 0 || unknown.length > 0) {
    throw new Error(
      `with-architectures: arquitecturas no válidas (${unknown.join(', ') || 'lista vacía'}). ` +
        `Usa algunas de: ${VALID.join(', ')}.`,
    );
  }
  return withGradleProperties(config, (cfg) => {
    const value = [...new Set(architectures)].join(',');
    const item = cfg.modResults.find((p) => p.type === 'property' && p.key === KEY);
    if (item) {
      item.value = value;
    } else {
      cfg.modResults.push({ type: 'property', key: KEY, value });
    }
    return cfg;
  });
};
