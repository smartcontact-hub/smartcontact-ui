/**
 * Evalúa un `ConditionTree` contra una `Conversation` del mock, para el preview
 * de impacto ("afecta a N conversaciones"). Puro; la membresía viva de
 * `agentGroup` la inyecta el llamador (`EvalCtx.memberAgentIds`, del resolver) y
 * los nombres los traduce `demo-impact-bridge`.
 *
 * Evaluable EXACTO sin puente: servicio, dirección, duración. Vía puente demo:
 * grupo/cola, agente, miembros-de-grupo. NO evaluable en el mock (no existe el
 * campo en la conversación): tipificación, categoría → se ignoran en el conteo y
 * se avisa (`hasUnevaluableConditions`); el backend sí las evalúa.
 */
import type { Condition, ConditionGroup, ConditionTree } from './condition.types';
import type { Conversation } from './conversation.types';
import { agentConvName, groupConvName } from './demo-impact-bridge';

export interface EvalCtx {
  /** IDs de agentes miembros (vivos) de un grupo — del ConditionResolverService. */
  memberAgentIds(groupId: number): readonly number[];
}

function parseDurationSecs(mmss: string): number {
  const parts = mmss.split(':').map((n) => Number(n) || 0);
  return parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0];
}

/** `null` = condición no evaluable en el mock (no filtra el conteo). */
function conditionMatches(cond: Condition, conv: Conversation, ctx: EvalCtx): boolean | null {
  const v = cond.value;
  // Condición sin valor todavía (refs vacías) → aún no constriñe (no filtra).
  if (v.mode === 'refs' && v.refs.length === 0) return null;
  const yesNo = (hit: boolean) => (cond.operator === 'is' ? hit : !hit);

  switch (cond.field) {
    case 'servicio': {
      if (v.mode === 'any') return true;
      if (v.mode !== 'refs') return null;
      const names = v.refs.flatMap((r) => (r.kind === 'service' ? [r.name] : []));
      return yesNo(names.includes(conv.service));
    }
    case 'direccion': {
      if (v.mode !== 'enum') return null;
      const want = v.value === 'inbound' ? 'entrante' : 'saliente';
      return yesNo(conv.direction === want);
    }
    case 'duracion': {
      if (v.mode !== 'number') return null;
      const secs = parseDurationSecs(conv.duration);
      const toSec = (n: number) => (v.unit === 'minutes' ? n * 60 : n);
      const a = toSec(v.amount);
      if (cond.operator === 'gt') return secs > a;
      if (cond.operator === 'lt') return secs < a;
      if (cond.operator === 'between') {
        const b = toSec(v.amount2 ?? v.amount);
        return secs >= Math.min(a, b) && secs <= Math.max(a, b);
      }
      return null;
    }
    case 'grupo': {
      if (v.mode === 'any') return true;
      if (v.mode !== 'refs') return null;
      const names = v.refs.flatMap((r) => (r.kind === 'group' ? [groupConvName(r.id)] : []));
      return yesNo(names.includes(conv.group));
    }
    case 'agente': {
      if (v.mode === 'any') return true;
      if (v.mode !== 'refs') return null;
      const names = new Set<string>();
      for (const r of v.refs) {
        if (r.kind === 'agent') {
          const n = agentConvName(r.id);
          if (n) names.add(n);
        } else if (r.kind === 'agentGroup') {
          for (const aid of ctx.memberAgentIds(r.id)) {
            const n = agentConvName(aid);
            if (n) names.add(n);
          }
        }
      }
      return yesNo(names.has(conv.origin));
    }
    case 'tipificacion':
    case 'categoria':
      return null; // sin campo en el mock de conversación
  }
}

function groupMatches(group: ConditionGroup, conv: Conversation, ctx: EvalCtx): boolean | null {
  const results = group.conditions
    .map((c) => conditionMatches(c, conv, ctx))
    .filter((r): r is boolean => r !== null);
  if (results.length === 0) return null;
  return group.match === 'all' ? results.every(Boolean) : results.some(Boolean);
}

export function conversationMatchesTree(
  conv: Conversation,
  tree: ConditionTree,
  ctx: EvalCtx,
): boolean {
  const groups = tree.groups
    .map((g) => groupMatches(g, conv, ctx))
    .filter((r): r is boolean => r !== null);
  if (groups.length === 0) return true; // sin condiciones evaluables → aplica a todas
  return tree.match === 'all' ? groups.every(Boolean) : groups.some(Boolean);
}

/** ¿Hay condiciones que el mock no puede evaluar (tipificación/categoría)? */
export function hasUnevaluableConditions(tree: ConditionTree): boolean {
  return tree.groups.some((g) =>
    g.conditions.some((c) => c.field === 'tipificacion' || c.field === 'categoria'),
  );
}
