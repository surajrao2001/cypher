module.exports = function (api) {
  const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);
  api.cache.using(() => (isTest ? 'test' : 'runtime'));

  if (isTest) {
    return {
      presets: ['babel-preset-expo'],
    };
  }

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
