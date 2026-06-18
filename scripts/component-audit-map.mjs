/**
 * Curaduría del audit de componentes (Fase 2). Lo DETERMINISTA lo deriva `component-audit.mjs`
 * del código (provenance, primengBase, CVA, inputs, anidados, demo, dónde-se-usa). Lo que pide
 * JUICIO humano vive aquí — fuente única, editable por Rafa sin tocar el generador.
 */

/**
 * STANDARD vs EXTENDED es una línea fina (un wrapper "puro passthrough" vs uno con API/CVA propia).
 * El generador propone por heurística (CVA o muchos inputs propios → EXTENDED). Para FORZAR la
 * clasificación de un wrapper concreto, ponlo aquí: 'standard' | 'extended'. (Confirmado por Rafa.)
 */
export const PROVENANCE_OVERRIDE = {
  // ej.: 'card': 'standard',  // aunque tenga inputs, es passthrough visual
};

/**
 * Componentes SIN página demo a propósito (servicios, piezas internas, no-presentacionales).
 * El guard NO falla por estos. Cualquier OTRO componente sin demo → ROJO (hay que darle demo).
 */
export const DEMO_EXEMPT = new Set([
  'dynamic-dialog', // ScDynamicDialogService — servicio, no componente con plantilla
]);

/** Imports de `primeng/*` que NO cuentan como "base PrimeNG" (utilidades, no el componente). */
export const PRIMENG_UTIL = new Set(['api']);

/** Anidados a ignorar al listar composición (primitivos, no "componentes de negocio"). */
export const NESTED_IGNORE = new Set(['sc-icon']);
