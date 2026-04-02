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

  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },

  ignorePatterns: ['dist/', 'node_modules/', 'coverage/'],
};