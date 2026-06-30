/**
 * Guía de errores del constructor (wrapper tipado). La LÓGICA vive en
 * `condition-validate.core.mjs` (puro, cubierto por `test:unit`); aquí solo se
 * re-exporta tipada para que el builder y la página la consuman como
 * `./condition-validate`, en paralelo a `./condition-eval`.
 */
import type { ConditionTree, ValidationIssue } from './condition.types';
import { validateConditionTree as coreValidate } from './condition-validate.core.mjs';

export type { ValidationIssue } from './condition.types';

export function validateConditionTree(tree: ConditionTree): readonly ValidationIssue[] {
  return coreValidate(tree);
}
