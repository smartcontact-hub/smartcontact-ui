/**
 * Motor de evaluación de impacto (wrapper tipado). La LÓGICA vive en
 * `condition-eval.core.mjs` (puro, cubierto por `test:unit`); aquí solo se
 * tipa y se inyecta el puente de nombres demo (`demo-impact-bridge`) en el ctx,
 * para que el builder llame con `{ memberAgentIds }` sin conocer el puente.
 *
 * Evaluable EXACTO: servicio, dirección, duración. Vía puente demo: grupo/cola,
 * agente, miembros-de-grupo. No evaluable en el mock (no existe el campo en la
 * conversación): tipificación, categoría → se ignoran y se avisan.
 */
import type { ConditionTree } from './condition.types';
import {
  conversationMatchesTree as coreMatch,
  hasUnevaluableConditions as coreUnevaluable,
  projectImpact as coreProject,
} from './condition-eval.core.mjs';
import type { Conversation } from './conversation.types';
import { agentConvName, CONVERSATIONS_PER_DAY, groupConvName } from './demo-impact-bridge';

export interface EvalCtx {
  /** IDs de agentes miembros (vivos) de un grupo — del ConditionResolverService. */
  memberAgentIds(groupId: number): readonly number[];
}

export function conversationMatchesTree(
  conv: Conversation,
  tree: ConditionTree,
  ctx: EvalCtx,
): boolean {
  return coreMatch(conv, tree, { ...ctx, groupConvName, agentConvName });
}

export function hasUnevaluableConditions(tree: ConditionTree): boolean {
  return coreUnevaluable(tree);
}

/** Estimación día/mes desde el ratio real, con el volumen base demo ya inyectado. */
export function projectImpact(count: number, total: number): { perDay: number; perMonth: number } {
  return coreProject(count, total, CONVERSATIONS_PER_DAY);
}
