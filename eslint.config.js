// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  prettier,
  {
    ignores: ['dist/*', 'android/*', 'ios/*', '.expo/*'],
  },
  {
    rules: {
      // Íconos de UI solo desde @/components (catálogo con imports por ruta).
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'phosphor-react-native',
              message: 'Importa íconos desde @/components (src/components/icons.ts).',
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
]);
