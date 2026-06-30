// @ts-check
/**
 * Validación pura del árbol de condiciones (constructor v2). Opera SOLO sobre la
 * estructura del árbol (independiente de datos); el preview de impacto cubre lo
 * que aquí no se enumera ("0 conversaciones de muestra"). Devuelve incidencias
 * SIN prosa — el componente mapea `code` → i18n y las pinta junto a la condición.
 *
 * Severidad:
 *  - error   → bloquea guardar (objetivamente roto):
 *      · incomplete    — campo lista sin valores, o enum sin valor.
 *      · invalid_range — número "entre" con mínimo ≥ máximo.
 *  - warning → solo avisa (casi siempre un error, pero puede ser intencional):
 *      · duplicate     — condición idéntica repetida en el mismo grupo.
 *      · contradiction — en grupo "todas" (Y), mismo campo de valor único
 *          {servicio,grupo,agente,dirección} que no puede cumplirse a la vez.
 *      · tautology     — en grupo "cualquiera" (O), "X es V" O "X no es V"
 *          (mismo campo y mismo valor exacto) → incluye todas las conversaciones.
 *
 * Decisión de honestidad: un grupo/agente referido como `agentGroup` (miembros)
 * es opaco aquí (la membresía es dato, no estructura) → no se infiere
 * contradicción cuando hay un `agentGroup` en juego; eso lo refleja el impacto.
 */

/** Campos donde una conversación tiene UN solo valor → "es A" e "es B" (Y) chocan. */
const SINGLE_VALUE_FIELDS = new Set(['servicio', 'grupo', 'agente', 'direccion']);

/** @param {any} ref */
function refKey(ref) {
  return ref.kind === 'service' ? `service:${ref.name}` : `${ref.kind}:${ref.id}`;
}

/** Conjunto canónico (orden-independiente) de las refs de un valor. @param {any} value */
function refKeySet(value) {
  return value.mode === 'refs' ? new Set(value.refs.map(refKey)) : new Set();
}

/** Clave de valor (campo aparte): para detectar duplicados y complementos. @param {any} cond */
function valueKey(cond) {
  const v = cond.value;
  if (v.mode === 'any') return 'any';
  if (v.mode === 'enum') return `enum:${v.value}`;
  if (v.mode === 'number') return `num:${v.amount}:${v.amount2 ?? ''}:${v.unit}`;
  return `refs:${[...v.refs.map(refKey)].sort().join(',')}`;
}

/** @param {any} cond */
function conditionKey(cond) {
  return `${cond.field}|${cond.operator}|${valueKey(cond)}`;
}

/** Una condición lista/enum sin valor elegido (number/any siempre "completos"). @param {any} cond */
export function isIncomplete(cond) {
  const v = cond.value;
  if (v.mode === 'refs') return v.refs.length === 0;
  if (v.mode === 'enum') return !v.value;
  return false;
}

/** @param {any} cond */
function isInvalidRange(cond) {
  const v = cond.value;
  return (
    v.mode === 'number' &&
    cond.operator === 'between' &&
    typeof v.amount2 === 'number' &&
    v.amount2 <= v.amount
  );
}

/** Refs con un grupo-como-miembros: opaco (membresía = dato) → no inferir choque. @param {any} cond */
function involvesOpaqueRef(cond) {
  return cond.value.mode === 'refs' && cond.value.refs.some((r) => r.kind === 'agentGroup');
}

/** ¿"es A" y "es B" son disjuntos (no pueden cumplirse a la vez)? @param {any} a @param {any} b */
function disjointIs(a, b) {
  if (a.value.mode === 'enum' && b.value.mode === 'enum') return a.value.value !== b.value.value;
  if (a.value.mode === 'refs' && b.value.mode === 'refs') {
    const sb = refKeySet(b.value);
    return ![...refKeySet(a.value)].some((k) => sb.has(k));
  }
  return false; // 'any' u otros → no afirmamos choque
}

/** ¿"es S" queda excluido por "no es T" (S ⊆ T, S no vacío)? @param {any} isC @param {any} notC */
function excludedBy(isC, notC) {
  if (isC.value.mode === 'enum' && notC.value.mode === 'enum') {
    return isC.value.value === notC.value.value;
  }
  if (isC.value.mode === 'refs' && notC.value.mode === 'refs') {
    const s = refKeySet(isC.value);
    if (s.size === 0) return false;
    const t = refKeySet(notC.value);
    return [...s].every((k) => t.has(k));
  }
  return false;
}

/**
 * @param {any} tree
 * @returns {Array<{severity:'error'|'warning', code:string, groupId:string, condId?:string, condIds?:string[]}>}
 */
export function validateConditionTree(tree) {
  /** @type {Array<{severity:'error'|'warning', code:string, groupId:string, condId?:string, condIds?:string[]}>} */
  const issues = [];

  for (const group of tree.groups) {
    const conds = group.conditions;

    // 1) Por condición: incompleta / rango inválido (errores).
    for (const cond of conds) {
      if (isIncomplete(cond)) {
        issues.push({ severity: 'error', code: 'incomplete', groupId: group.id, condId: cond.id });
      } else if (isInvalidRange(cond)) {
        issues.push({ severity: 'error', code: 'invalid_range', groupId: group.id, condId: cond.id });
      }
    }

    // 2) Duplicados dentro del grupo (la 2ª aparición se marca).
    const seen = new Set();
    for (const cond of conds) {
      if (isIncomplete(cond)) continue;
      const k = conditionKey(cond);
      if (seen.has(k)) {
        issues.push({ severity: 'warning', code: 'duplicate', groupId: group.id, condId: cond.id });
      } else {
        seen.add(k);
      }
    }

    // 3) Pares del mismo campo: contradicción (Y) / tautología (O).
    for (let i = 0; i < conds.length; i++) {
      for (let j = i + 1; j < conds.length; j++) {
        const a = conds[i];
        const b = conds[j];
        if (a.field !== b.field || isIncomplete(a) || isIncomplete(b)) continue;

        if (group.match === 'all') {
          if (!SINGLE_VALUE_FIELDS.has(a.field)) continue;
          if (involvesOpaqueRef(a) || involvesOpaqueRef(b)) continue;
          const twoIs = a.operator === 'is' && b.operator === 'is' && disjointIs(a, b);
          const isC = a.operator === 'is' ? a : b.operator === 'is' ? b : null;
          const notC = a.operator === 'is_not' ? a : b.operator === 'is_not' ? b : null;
          const isExcluded = isC && notC && excludedBy(isC, notC);
          if (twoIs || isExcluded) {
            issues.push({ severity: 'warning', code: 'contradiction', groupId: group.id, condIds: [a.id, b.id] });
          }
        } else {
          // "es V" O "no es V" (mismo valor exacto) → A ∨ ¬A = todo.
          const complementary =
            (a.operator === 'is' && b.operator === 'is_not') ||
            (a.operator === 'is_not' && b.operator === 'is');
          if (complementary && valueKey(a) === valueKey(b)) {
            issues.push({ severity: 'warning', code: 'tautology', groupId: group.id, condIds: [a.id, b.id] });
          }
        }
      }
    }
  }

  return issues;
}
