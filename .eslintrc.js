// Each service's .eslintrc.js will extend this file
module.exports = {
  // "root: true" tells ESLint to stop looking for config files
  // further up the directory tree — this is the top, period.
  // Without this, ESLint might pick up a config from your home
  // directory or elsewhere and produce confusing results.
  root: true,

  parser: '@typescript-eslint/parser',

  plugins: ['@typescript-eslint'],

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],

  // Tell ESLint which global variables legitimately exist.
  // Without this, it flags Node.js built-ins like 'module',
  // 'require', and '__dirname' as undefined variables.
  env: {
    node: true,      // enables Node.js globals: module, require, __dirname, etc.
    es2022: true,    // enables modern JS globals like Promise, Map, Set, etc.
  },

  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },

  ignorePatterns: ['dist/', 'node_modules/', 'coverage/'],
};