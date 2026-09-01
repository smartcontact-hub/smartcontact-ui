// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    // Los patrones de flat-config SIN `**/` están anclados a la raíz del repo: `dist/`
    // tapaba SOLO el dist de arriba. Los worktrees de agente (`.claude/worktrees/<x>/`)
    // construyen su propio `dist/` y eslint entraba a lintar los `.d.ts` GENERADOS de
    // ng-packagr → `npm run preflight` en rojo por código que nadie escribió. Medido el
    // 2026-08-24: 3 errores en `dist/ui-smartcontact-icons/types/*.d.ts` de un worktree.
    ignores: [
      '**/dist/',
      '.claude/',
      'node_modules/',
      '.angular/',
      'playwright-report/',
      'test-results/',
      'code-connect/',
      /* Bundle del original cacheado para el censo de paridad (`.cache/`) y sesiones
       * guardadas (`.auth/`): no es código nuestro. Sin esto, eslint intenta linterar el
       * JS de la app real y reporta 6 errores por reglas que solo existen en SU
       * configuración. */
      '.cache/',
      '.auth/',
      // `public/` son ASSETS que se sirven tal cual, no plantillas de Angular. El bloque
      // de abajo que captura todos los .html les aplicaba el parser de plantillas, que trata
      // la llave como interpolación y revienta con el CSS embebido: Unexpected character
      // "EOF". Los 8 HTML de `explorations/` que ya había pasaban de milagro (menos CSS), no
      // por estar bien encajados. Medido el 2026-09-01 con `interno/validar/index.html`.
      // (Comentario de línea a propósito: el patrón glob lleva una secuencia que cerraría
      // un comentario de bloque antes de tiempo.)
      'projects/*/public/',
    ],
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
