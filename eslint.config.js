import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**'],
  },
  {
    rules: {
      // Phaser lifecycle methods (update(time, delta), preUpdate, etc.) have a
      // fixed positional signature — flagging unused params there is noise.
      'no-unused-vars': ['error', { args: 'none' }],
    },
  },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
  },
  {
    files: ['scripts/**/*.mjs', 'vite.config.js', 'vitest.config.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      // tests run under Vitest/Node but exercise browser-facing APIs
      // (localStorage, polyfilled in tests/setup.js) — allow both.
      globals: { ...globals.node, ...globals.browser },
    },
  },
];
