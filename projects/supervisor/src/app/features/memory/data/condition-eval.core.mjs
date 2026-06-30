/**
 * Núcleo PURO (sin tipos, sin deps) del motor de evaluación de impacto.
 *
 * Se mantiene en `.mjs` para que lo cubra `test:unit` (node:test, en el gate) —
 * la app lo consume vía el wrapper tipado `condition-eval.ts`, que inyecta el
 * puente de nombres en `ctx`. Así la lógica vive UNA vez y está testeada.
 *
 * `ctx` provee: `memberAgentIds(groupId)`, `groupConvName(id)`, `agentConvName(id)`.
 */

export function parseDurationSecs(mmss) {
  const parts = String(mmss).split(':').map((n) => Number(n) || 0);
  return parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0];
}

/** `null` = condición no evaluable en el mock (no filtra el conteo). */
export function conditionMatches(cond, conv, ctx) {
  const v = cond.value;
  if (v.mode === 'refs' && v.refs.length === 0) return null;
  const yesNo = (hit) => (cond.operator === 'is' ? hit : !hit);

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
      const toSec = (n) => (v.unit === 'minutes' ? n * 60 : n);
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
      const names = v.refs.flatMap((r) => (r.kind === 'group' ? [ctx.groupConvName(r.id)] : []));
      return yesNo(names.includes(conv.group));
    }
    case 'agente': {
      if (v.mode === 'any') return true;
      if (v.mode !== 'refs') return null;
      const names = new Set();
      for (const r of v.refs) {
        if (r.kind === 'agent') {
          const n = ctx.agentConvName(r.id);
          if (n) names.add(n);
        } else if (r.kind === 'agentGroup') {
          for (const aid of ctx.memberAgentIds(r.id)) {
            const n = ctx.agentConvName(aid);
            if (n) names.add(n);
          }
        }
      }
      return yesNo(names.has(conv.origin));
    }
    default:
      return null; // tipificacion / categoria: sin campo en el mock
  }
}

function groupMatches(group, conv, ctx) {
  const results = group.conditions
    .map((c) => conditionMatches(c, conv, ctx))
    .filter((r) => r !== null);
  if (results.length === 0) return null;
  return group.match === 'all' ? results.every(Boolean) : results.some(Boolean);
}

export function conversationMatchesTree(conv, tree, ctx) {
  const groups = tree.groups
    .map((g) => groupMatches(g, conv, ctx))
    .filter((r) => r !== null);
  if (groups.length === 0) return true;
  return tree.match === 'all' ? groups.every(Boolean) : groups.some(Boolean);
}

export function hasUnevaluableConditions(tree) {
  return tree.groups.some((g) =>
    g.conditions.some((c) => c.field === 'tipificacion' || c.field === 'categoria'),
  );
}

/**
 * Proyecta el ratio de impacto REAL (count/total sobre el mock) a un volumen
 * día/mes. `perDayBase` es un volumen diario típico (constante demo inyectada):
 * solo ESE dato es supuesto, el ratio es real → la cifra es una ESTIMACIÓN, no un
 * dato medido. `total<=0` → ceros (sin conversaciones evaluables).
 */
export function projectImpact(count, total, perDayBase) {
  if (!total || total <= 0) return { perDay: 0, perMonth: 0 };
  const perDay = Math.round((count / total) * perDayBase);
  return { perDay, perMonth: perDay * 30 };
}
