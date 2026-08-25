const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['coverage/**'],
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
]);
