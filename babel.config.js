module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Seguridad: en builds de PRODUCCIÓN borramos todos los console.* del bundle.
    // Es la red de seguridad por si se cuela un log con datos sensibles, y de paso
    // le saca información al que intente leer el código compilado. En desarrollo
    // (Expo Go) los logs quedan intactos.
    env: {
      production: {
        plugins: [['transform-remove-console', { exclude: ['error'] }]],
      },
    },
  };
};
