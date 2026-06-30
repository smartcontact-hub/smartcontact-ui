import type { Condition, ConditionTree, ValidationIssue } from './condition.types';

export function isIncomplete(cond: Condition): boolean;
export function validateConditionTree(tree: ConditionTree): ValidationIssue[];
