// Babel: preset de Expo + import de los archivos .sql de migraciones de Drizzle
// como texto (https://orm.drizzle.team/docs/connect-expo-sqlite).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
