// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    ignores: ['dist/', 'node_modules/', '.angular/', 'playwright-report/', 'test-results/'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: ['sc', 'app'], style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: ['sc', 'app'], style: 'kebab-case' },
      ],
      // Convención `_`-prefijo = intencionalmente sin usar (params de firma,
      // destructuring parcial). No oculta unused reales (esos no van con `_`).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended],
    rules: {},
  },
  {
    files: ['scripts/**/*.mjs', '**/scripts/**/*.js'],
    extends: [eslint.configs.recommended],
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly', require: 'readonly', module: 'writable', __dirname: 'readonly' },
    },
  },
);
