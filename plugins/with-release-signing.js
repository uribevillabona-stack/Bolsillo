/**
 * Config plugin: firma el APK de release con la clave propia del proyecto.
 *
 * La clave (keystore) y sus contraseñas NUNCA van al repositorio. Gradle las
 * lee de propiedades que cada quien define en su máquina, en
 * `~/.gradle/gradle.properties` (en Windows: %USERPROFILE%\.gradle\gradle.properties):
 *
 *   BOLSILLO_RELEASE_STORE_FILE=C:/dev/bolsillo-keys/bolsillo-release.keystore
 *   BOLSILLO_RELEASE_STORE_PASSWORD=...
 *   BOLSILLO_RELEASE_KEY_ALIAS=bolsillo
 *   BOLSILLO_RELEASE_KEY_PASSWORD=...
 *
 * Si no están (otro integrante del equipo, una máquina nueva), el release se
 * firma con la clave de depuración como antes: compila igual, pero ese APK no
 * puede actualizar uno firmado con la clave propia. Ver README → "APK firmado".
 *
 * Como `android/` se regenera con `expo prebuild`, el ajuste vive aquí.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// @bolsillo/with-release-signing';
const PROPS = [
  'BOLSILLO_RELEASE_STORE_FILE',
  'BOLSILLO_RELEASE_STORE_PASSWORD',
  'BOLSILLO_RELEASE_KEY_ALIAS',
  'BOLSILLO_RELEASE_KEY_PASSWORD',
];
// Solo se usa la clave propia si están las cuatro: con una a medias, Gradle
// fallaría con un MissingPropertyException difícil de entender.
const HAS_ALL = PROPS.map((p) => `project.hasProperty('${p}')`).join(' && ');

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error('with-release-signing: se esperaba android/app/build.gradle en Groovy.');
    }
    let src = cfg.modResults.contents;
    if (src.includes(MARKER)) return cfg;

    // 1. Agrega `release` dentro de `signingConfigs { ... }`, junto a `debug`.
    const signingAnchor = /signingConfigs\s*\{\n/;
    if (!signingAnchor.test(src)) {
      throw new Error('with-release-signing: no se encontró `signingConfigs {` en app/build.gradle.');
    }
    const releaseConfig = [
      `        ${MARKER}`,
      '        release {',
      `            if (${HAS_ALL}) {`,
      '                storeFile file(BOLSILLO_RELEASE_STORE_FILE)',
      '                storePassword BOLSILLO_RELEASE_STORE_PASSWORD',
      '                keyAlias BOLSILLO_RELEASE_KEY_ALIAS',
      '                keyPassword BOLSILLO_RELEASE_KEY_PASSWORD',
      '            }',
      '        }',
      '',
    ].join('\n');
    src = src.replace(signingAnchor, (m) => `${m}${releaseConfig}`);

    // 2. En `buildTypes.release`, usa la clave propia si está configurada.
    const releaseBlock = /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/;
    if (!releaseBlock.test(src)) {
      throw new Error(
        'with-release-signing: no se encontró `signingConfig signingConfigs.debug` en buildTypes.release.',
      );
    }
    src = src.replace(
      releaseBlock,
      `$1signingConfig (${HAS_ALL}) ? signingConfigs.release : signingConfigs.debug`,
    );

    cfg.modResults.contents = src;
    return cfg;
  });
};
