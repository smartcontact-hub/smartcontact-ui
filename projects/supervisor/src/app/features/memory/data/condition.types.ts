/**
 * Modelo de condiciones para el constructor de reglas (Variante B).
 *
 * Reemplaza el alcance rígido de 3 dimensiones (Servicio Y Grupo Y Agente)
 * por un árbol de condiciones con potencia booleana real:
 *   - `match: 'all' | 'any'` (coincidir con TODAS / CUALQUIERA) a dos niveles.
 *   - Mezcla AND/OR entre grupos y dentro de cada grupo.
 *   - Agrupación: 2 niveles (raíz → grupos → condiciones). NO anidación libre
 *     (eso sería la Variante C); el tope de 2 niveles cubre casi todo caso y
 *     mantiene la UI legible para un supervisor.
 *
 * Persistencia: se guarda en `Rule.conditionTree` (campo aditivo, opcional).
 * Para no romper el listado ni la detección de conflictos del store —que leen
 * `servicios/grupos/agentes`— al guardar se deriva la unión plana del árbol
 * con `deriveLegacyScope` (sobre-aproximación segura: nunca pierde un solapamiento).
 */
import type { FilterOption } from './conversation-filter-options';
import {
  AGENT_OPTIONS,
  GROUP_OPTIONS,
  SERVICE_OPTIONS,
  TIPIFICACION_OPTIONS,
} from './conversation-filter-options';

export type ConditionFieldId = 'servicio' | 'grupo' | 'agente' | 'tipificacion';
// Bloque 2 extiende con 'direccion' | 'duracion' | 'categoria'.

/** Operadores. `is`/`is_not` para campos lista/enum; `gt`/`lt`/`between` para número. */
export type ConditionOperator = 'is' | 'is_not' | 'gt' | 'lt' | 'between';
export type GroupMatch = 'all' | 'any';

/** Tipo de campo → qué editor de valor y qué operadores aplican. */
export type ConditionFieldKind = 'list' | 'enum' | 'number';
/** Sección del dropdown de campo. */
export type ConditionFieldGroup = 'conversacion' | 'clasificacion';
/** Para campos lista: a qué entidad apuntan sus valores (resolución en vivo). */
export type RefKind = 'service' | 'group' | 'agent' | 'tipificacion' | 'category';

/**
 * Referencia tipada a una entidad (constructor v2). Reemplaza el snapshot de
 * nombre: se guarda la referencia y se resuelve etiqueta/membresía al vuelo.
 * - `service` no tiene ID en el sistema → por nombre.
 * - `group` = la cola; `agentGroup` = ese mismo grupo usado como sus agentes-miembros.
 */
export type ConditionRef =
  | { readonly kind: 'service'; readonly name: string }
  | { readonly kind: 'group'; readonly id: number }
  | { readonly kind: 'agent'; readonly id: number }
  | { readonly kind: 'agentGroup'; readonly id: number }
  | { readonly kind: 'tipificacion'; readonly id: number }
  | { readonly kind: 'category'; readonly id: string };

/**
 * Operando de una condición, según el kind del campo.
 * - `any` = comodín "cualquiera" (incluye entidades futuras) — campos lista.
 * - `refs` = referencias seleccionadas — campos lista.
 * - `enum` = un valor (p.ej. dirección entrante/saliente).
 * - `number` = umbral(es) de duración (`between` usa amount + amount2).
 */
export type ConditionValue =
  | { readonly mode: 'any' }
  | { readonly mode: 'refs'; readonly refs: readonly ConditionRef[] }
  | { readonly mode: 'enum'; readonly value: string }
  | {
      readonly mode: 'number';
      readonly amount: number;
      readonly amount2?: number;
      readonly unit: 'seconds' | 'minutes';
    };

export interface ConditionFieldDef {
  readonly id: ConditionFieldId;
  /** Etiqueta para el selector de campo. */
  readonly label: string;
  /** Sustantivo con artículo para el resumen en prosa ("el servicio"). */
  readonly noun: string;
  /** Tipo de campo (editor de valor + operadores aplicables). */
  readonly kind: ConditionFieldKind;
  /** Sección del dropdown de campo. */
  readonly group: ConditionFieldGroup;
  /** Material symbol del campo. */
  readonly icon: string;
  /** Solo campos lista: a qué entidad apuntan sus valores. */
  readonly refKind?: RefKind;
  readonly options: readonly FilterOption[];
  readonly placeholder: string;
}

/** Catálogo de campos sobre los que se construyen condiciones. Extensible:
 *  dirección/duración/atendida-por entran aquí cuando se unifiquen criterios. */
export const CONDITION_FIELDS: readonly ConditionFieldDef[] = [
  {
    id: 'servicio',
    label: 'Servicio',
    noun: 'el servicio',
    kind: 'list',
    group: 'conversacion',
    icon: 'deployed_code',
    refKind: 'service',
    options: SERVICE_OPTIONS,
    placeholder: 'Selecciona servicios…',
  },
  {
    id: 'grupo',
    label: 'Grupo/Cola',
    noun: 'el grupo',
    kind: 'list',
    group: 'conversacion',
    icon: 'groups',
    refKind: 'group',
    options: GROUP_OPTIONS,
    placeholder: 'Selecciona grupos…',
  },
  {
    id: 'agente',
    label: 'Agente',
    noun: 'el agente',
    kind: 'list',
    group: 'conversacion',
    icon: 'person',
    refKind: 'agent',
    options: AGENT_OPTIONS,
    placeholder: 'Selecciona agentes o grupos…',
  },
  {
    id: 'tipificacion',
    label: 'Tipificación',
    noun: 'la tipificación',
    kind: 'list',
    group: 'conversacion',
    icon: 'sell',
    refKind: 'tipificacion',
    options: TIPIFICACION_OPTIONS,
    placeholder: 'Selecciona tipificaciones…',
  },
];

export function fieldDefById(id: ConditionFieldId): ConditionFieldDef {
  return CONDITION_FIELDS.find((f) => f.id === id) ?? CONDITION_FIELDS[0];
}

export interface Condition {
  readonly id: string;
  readonly field: ConditionFieldId;
  readonly operator: ConditionOperator;
  /**
   * Operando v2 (referencias tipadas / comodín / número / enum). Fuente de
   * verdad cuando está presente. Durante la migración incremental convive con
   * `values` (legacy, nombres planos); el Bloque 2 mueve el builder a `value`.
   */
  readonly value?: ConditionValue;
  /** Legacy: nombres planos. Se mantiene hasta completar la migración. */
  readonly values: readonly string[];
}

export interface ConditionGroup {
  readonly id: string;
  /** Cómo se combinan las condiciones DENTRO del grupo. */
  readonly match: GroupMatch;
  readonly conditions: readonly Condition[];
}

export interface ConditionTree {
  /** Cómo se combinan los grupos ENTRE sí. */
  readonly match: GroupMatch;
  readonly groups: readonly ConditionGroup[];
}

/* ------------------------------------------------------------------ */
/* Factories — ids secuenciales por sesión (deterministas, sin uuid).  */
/* ------------------------------------------------------------------ */

let _seq = 0;
function nextId(prefix: string): string {
  _seq += 1;
  return `${prefix}-${_seq}`;
}

export function makeCondition(
  field: ConditionFieldId = 'servicio',
  values: readonly string[] = [],
): Condition {
  return { id: nextId('c'), field, operator: 'is', values };
}

export function makeGroup(): ConditionGroup {
  return { id: nextId('g'), match: 'all', conditions: [makeCondition()] };
}

/** Árbol por defecto de una regla nueva: un grupo con una condición vacía. */
export function emptyConditionTree(): ConditionTree {
  return { match: 'all', groups: [makeGroup()] };
}

/* ------------------------------------------------------------------ */
/* Puentes con el modelo plano legacy (compatibilidad listado/store).  */
/* ------------------------------------------------------------------ */

/** Deriva el alcance plano (unión de valores `is` por dimensión) desde el
 *  árbol. Sobre-aproximación: usada por el listado y la detección de
 *  conflictos, nunca infra-estima un solapamiento. */
export function deriveLegacyScope(tree: ConditionTree): {
  servicios: string[];
  grupos: string[];
  agentes: string[];
} {
  const acc = {
    servicio: new Set<string>(),
    grupo: new Set<string>(),
    agente: new Set<string>(),
  };
  for (const group of tree.groups) {
    for (const cond of group.conditions) {
      if (cond.operator !== 'is') continue;
      // `tipificacion` (y futuros campos) no tienen dimensión plana legacy:
      // solo viven en `conditionTree`. Se ignoran para la derivación.
      if (cond.field === 'servicio' || cond.field === 'grupo' || cond.field === 'agente') {
        for (const v of cond.values) acc[cond.field].add(v);
      }
    }
  }
  return {
    servicios: [...acc.servicio],
    grupos: [...acc.grupo],
    agentes: [...acc.agente],
  };
}

/** Reconstruye un árbol desde el alcance plano de una regla antigua (sin
 *  `conditionTree`): un grupo `all` con una condición `is` por dimensión. */
export function deriveTreeFromLegacy(scope: {
  servicios?: readonly string[];
  grupos?: readonly string[];
  agentes?: readonly string[];
}): ConditionTree {
  const conditions: Condition[] = [];
  if (scope.servicios?.length) conditions.push(makeCondition('servicio', scope.servicios));
  if (scope.grupos?.length) conditions.push(makeCondition('grupo', scope.grupos));
  if (scope.agentes?.length) conditions.push(makeCondition('agente', scope.agentes));
  if (conditions.length === 0) return emptyConditionTree();
  return { match: 'all', groups: [{ id: nextId('g'), match: 'all', conditions }] };
}

/* ------------------------------------------------------------------ */
/* Resumen en lenguaje natural.                                        */
/* ------------------------------------------------------------------ */

function describeCondition(cond: Condition): string {
  const def = fieldDefById(cond.field);
  const verb = cond.operator === 'is' ? 'es' : 'no es';
  if (cond.values.length === 0) return `${def.noun} ${verb} …`;
  if (cond.values.length === 1) return `${def.noun} ${verb} ${cond.values[0]}`;
  const last = cond.values[cond.values.length - 1];
  const head = cond.values.slice(0, -1).join(', ');
  const link = cond.operator === 'is' ? ' o ' : ' ni ';
  return `${def.noun} ${verb} ${head}${link}${last}`;
}

function describeGroup(group: ConditionGroup): string {
  const sep = group.match === 'all' ? ' y ' : ' o ';
  return group.conditions.map(describeCondition).join(sep);
}

/** Traduce el árbol a una frase legible. Vacío → "todas las conversaciones". */
export function describeConditionTree(tree: ConditionTree): string {
  const groups = tree.groups.filter((g) => g.conditions.length > 0);
  if (groups.length === 0) return 'Esta regla se aplica a todas las conversaciones.';
  const sep = tree.match === 'all' ? ' Y ' : ' O ';
  const parts = groups.map((g) => {
    const text = describeGroup(g);
    return groups.length > 1 && g.conditions.length > 1 ? `(${text})` : text;
  });
  return `Aplica cuando ${parts.join(sep)}.`;
}
