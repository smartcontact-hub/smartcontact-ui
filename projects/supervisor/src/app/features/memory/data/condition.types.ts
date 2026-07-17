/**
 * Modelo de condiciones del constructor de reglas (v2: referencias dinámicas).
 *
 * Una condición es `campo · operador · valor`. El valor guarda **referencias
 * tipadas** (no nombres) que se resuelven a etiqueta/membresía en vivo, o un
 * **comodín** "cualquiera" (incluye entidades futuras), o un número (duración) o
 * un enum (dirección). Dos niveles de agrupación (raíz → grupos → condiciones),
 * cada uno con `match: 'all'|'any'`.
 *
 * La proyección a `Rule.servicios/grupos/agentes` planos (`deriveLegacyScope`)
 * mantiene vivo el listado + la detección de conflictos sin tocarlos. La
 * resolución de etiquetas/membresía la provee un `RefResolver` (el componente
 * inyecta `ConditionResolverService`); las funciones de aquí son puras.
 */
import type { FilterOption } from './conversation-filter-options';
import {
  AGENT_OPTIONS,
  GROUP_OPTIONS,
  SERVICE_OPTIONS,
  TIPIFICACION_OPTIONS,
} from './conversation-filter-options';

export type ConditionFieldId =
  | 'servicio'
  | 'grupo'
  | 'agente'
  | 'tipificacion'
  | 'direccion'
  | 'duracion'
  | 'categoria';

export type ConditionOperator = 'is' | 'is_not' | 'gt' | 'lt' | 'between';
export type GroupMatch = 'all' | 'any';
export type ConditionFieldKind = 'list' | 'enum' | 'number';
export type ConditionFieldGroup = 'conversacion' | 'clasificacion';
export type RefKind = 'service' | 'group' | 'agent' | 'tipificacion' | 'category';

/**
 * Referencia tipada a una entidad. Reemplaza el snapshot de nombre.
 * - `service` no tiene ID → por nombre.
 * - `group` = la cola; `agentGroup` = ese grupo usado como sus agentes-miembros.
 */
export type ConditionRef =
  | { readonly kind: 'service'; readonly name: string }
  | { readonly kind: 'group'; readonly id: number }
  | { readonly kind: 'agent'; readonly id: number }
  | { readonly kind: 'agentGroup'; readonly id: number }
  | { readonly kind: 'tipificacion'; readonly id: number }
  | { readonly kind: 'category'; readonly id: string };

export type DurationUnit = 'seconds' | 'minutes';

/** Operando de una condición, según el kind del campo. */
export type ConditionValue =
  | { readonly mode: 'any' }
  | { readonly mode: 'refs'; readonly refs: readonly ConditionRef[] }
  | { readonly mode: 'enum'; readonly value: string }
  | {
      readonly mode: 'number';
      readonly amount: number;
      readonly amount2?: number;
      readonly unit: DurationUnit;
    };

export interface ConditionFieldDef {
  readonly id: ConditionFieldId;
  readonly label: string;
  /** Sustantivo con artículo para el resumen en prosa ("el servicio"). */
  readonly noun: string;
  readonly kind: ConditionFieldKind;
  readonly group: ConditionFieldGroup;
  readonly icon: string;
  /** Solo campos lista: a qué entidad apuntan sus valores. */
  readonly refKind?: RefKind;
  /** Solo enum: las opciones (p.ej. dirección). */
  readonly options: readonly FilterOption[];
  readonly placeholder: string;
}

export const DIRECTION_OPTIONS: readonly FilterOption[] = [
  { value: 'inbound', label: 'Entrante' },
  { value: 'outbound', label: 'Saliente' },
];

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
    id: 'direccion',
    label: 'Dirección',
    noun: 'la dirección',
    kind: 'enum',
    group: 'conversacion',
    icon: 'swap_horiz',
    options: DIRECTION_OPTIONS,
    placeholder: '',
  },
  {
    id: 'duracion',
    label: 'Duración',
    noun: 'la duración',
    kind: 'number',
    group: 'conversacion',
    icon: 'schedule',
    options: [],
    placeholder: '',
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
  {
    id: 'categoria',
    label: 'Categoría IA',
    noun: 'la categoría',
    kind: 'list',
    group: 'clasificacion',
    icon: 'auto_awesome',
    refKind: 'category',
    options: [],
    placeholder: 'Selecciona categorías…',
  },
];

export function fieldDefById(id: ConditionFieldId): ConditionFieldDef {
  return CONDITION_FIELDS.find((f) => f.id === id) ?? CONDITION_FIELDS[0];
}

/* ── Operadores ── */

export interface OperatorDef {
  readonly id: ConditionOperator;
  readonly label: string;
  /** Solo aplica a campos número (Duración). En otros se muestra bloqueado. */
  readonly numberOnly: boolean;
}

export const OPERATORS: readonly OperatorDef[] = [
  { id: 'is', label: 'es', numberOnly: false },
  { id: 'is_not', label: 'no es', numberOnly: false },
  { id: 'gt', label: 'más de', numberOnly: true },
  { id: 'lt', label: 'menos de', numberOnly: true },
  { id: 'between', label: 'entre', numberOnly: true },
];

export function operatorsForKind(kind: ConditionFieldKind): readonly ConditionOperator[] {
  return kind === 'number' ? ['gt', 'lt', 'between'] : ['is', 'is_not'];
}

export function operatorLabel(op: ConditionOperator): string {
  return OPERATORS.find((o) => o.id === op)?.label ?? op;
}

export interface Condition {
  readonly id: string;
  readonly field: ConditionFieldId;
  readonly operator: ConditionOperator;
  readonly value: ConditionValue;
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

/* ── Validación / guía de errores (lógica pura en condition-validate.core.mjs) ── */

export type IssueSeverity = 'error' | 'warning';
export type IssueCode =
  | 'incomplete'
  | 'invalid_range'
  | 'duplicate'
  | 'contradiction'
  | 'tautology';

/**
 * Incidencia de validación, SIN prosa: el componente mapea `code` → i18n y la
 * pinta junto a la(s) condición(es) marcada(s). `condId` para incidencias de una
 * sola condición (incompleta, rango); `condIds` para las de un par
 * (contradicción, tautología). `error` bloquea guardar; `warning` solo avisa.
 */
export interface ValidationIssue {
  readonly severity: IssueSeverity;
  readonly code: IssueCode;
  readonly groupId: string;
  readonly condId?: string;
  readonly condIds?: readonly string[];
}

/* ── Factories (ids secuenciales por sesión, deterministas) ── */

let _seq = 0;
function nextId(prefix: string): string {
  _seq += 1;
  return `${prefix}-${_seq}`;
}

export function emptyValueFor(field: ConditionFieldId): ConditionValue {
  const def = fieldDefById(field);
  if (def.kind === 'number') return { mode: 'number', amount: 30, unit: 'seconds' };
  if (def.kind === 'enum') return { mode: 'enum', value: def.options[0]?.value ?? '' };
  return { mode: 'refs', refs: [] };
}

export function defaultOperatorFor(field: ConditionFieldId): ConditionOperator {
  return fieldDefById(field).kind === 'number' ? 'gt' : 'is';
}

export function makeCondition(field: ConditionFieldId = 'servicio'): Condition {
  return { id: nextId('c'), field, operator: defaultOperatorFor(field), value: emptyValueFor(field) };
}

export function makeGroup(): ConditionGroup {
  return { id: nextId('g'), match: 'all', conditions: [makeCondition()] };
}

/** Árbol por defecto de una regla nueva: un grupo con una condición vacía. */
export function emptyConditionTree(): ConditionTree {
  return { match: 'all', groups: [makeGroup()] };
}

/* ── Puentes con el modelo plano legacy + resolución ── */

/** Lo mínimo que las funciones puras necesitan del resolver (lo implementa
 *  `ConditionResolverService`). Mantiene este módulo libre de DI. */
export interface RefResolver {
  label(ref: ConditionRef): string;
  memberAgentNames(groupId: number): readonly string[];
}

/**
 * Deriva el alcance plano (`servicios/grupos/agentes` por nombre) desde el árbol,
 * para que listado + detección de conflictos sigan funcionando. Sobre-aproxima
 * (solo condiciones `is` de campos lista; `agentGroup` expande a miembros vivos).
 * Comodín "any" → dimensión vacía = "cualquiera".
 */
export function deriveLegacyScope(
  tree: ConditionTree,
  resolver: RefResolver,
): { servicios: string[]; grupos: string[]; agentes: string[] } {
  const acc = {
    servicios: new Set<string>(),
    grupos: new Set<string>(),
    agentes: new Set<string>(),
  };
  for (const group of tree.groups) {
    for (const cond of group.conditions) {
      if (cond.operator !== 'is' || cond.value.mode !== 'refs') continue;
      for (const ref of cond.value.refs) {
        switch (ref.kind) {
          case 'service':
            acc.servicios.add(ref.name);
            break;
          case 'group':
            acc.grupos.add(resolver.label(ref));
            break;
          case 'agent':
            acc.agentes.add(resolver.label(ref));
            break;
          case 'agentGroup':
            resolver.memberAgentNames(ref.id).forEach((n) => acc.agentes.add(n));
            break;
          // tipificacion / category: sin dimensión plana legacy
        }
      }
    }
  }
  return {
    servicios: [...acc.servicios],
    grupos: [...acc.grupos],
    agentes: [...acc.agentes],
  };
}

/**
 * Reconstruye un árbol desde el alcance plano (reglas antiguas sin árbol). Mejor
 * esfuerzo: servicios por nombre; grupos/agentes intentan resolver id por nombre
 * (vía el reverse-lookup del catálogo), y se omiten los que no casan. Las reglas
 * de demo traen su `conditionTree` ya tipado, así que este camino es marginal.
 */
export function deriveTreeFromLegacy(
  scope: {
    servicios?: readonly string[];
    grupos?: readonly string[];
    agentes?: readonly string[];
  },
  reverse?: { groupIdByName(name: string): number | undefined; agentIdByName(name: string): number | undefined },
): ConditionTree {
  const conditions: Condition[] = [];
  const push = (field: ConditionFieldId, refs: ConditionRef[]) => {
    if (refs.length) conditions.push({ id: nextId('c'), field, operator: 'is', value: { mode: 'refs', refs } });
  };
  push('servicio', (scope.servicios ?? []).map((name) => ({ kind: 'service', name })));
  if (reverse) {
    push(
      'grupo',
      (scope.grupos ?? [])
        .map((n) => reverse.groupIdByName(n))
        .filter((id): id is number => id !== undefined)
        .map((id) => ({ kind: 'group', id })),
    );
    push(
      'agente',
      (scope.agentes ?? [])
        .map((n) => reverse.agentIdByName(n))
        .filter((id): id is number => id !== undefined)
        .map((id) => ({ kind: 'agent', id })),
    );
  }
  if (conditions.length === 0) return emptyConditionTree();
  return { match: 'all', groups: [{ id: nextId('g'), match: 'all', conditions }] };
}

/* ── Resumen en lenguaje natural ── */

function describeCondition(cond: Condition, labelFor: (ref: ConditionRef) => string): string {
  const def = fieldDefById(cond.field);
  const v = cond.value;
  if (v.mode === 'any') return `${def.noun} es cualquiera`;
  if (v.mode === 'number') {
    const unit = v.unit === 'minutes' ? 'min' : 's';
    if (cond.operator === 'between') {
      return `${def.noun} está entre ${v.amount} y ${v.amount2 ?? v.amount} ${unit}`;
    }
    const opTxt = cond.operator === 'gt' ? 'supera' : 'es menor que';
    return `${def.noun} ${opTxt} ${v.amount} ${unit}`;
  }
  if (v.mode === 'enum') {
    const lbl = def.options.find((o) => o.value === v.value)?.label ?? v.value;
    return `${def.noun} ${cond.operator === 'is' ? 'es' : 'no es'} ${lbl}`;
  }
  const verb = cond.operator === 'is' ? 'es' : 'no es';
  if (v.refs.length === 0) return `${def.noun} ${verb} …`;
  // `agentGroup` = el agente es MIEMBRO del grupo (no "es el grupo").
  const labels = v.refs.map((r) => (r.kind === 'agentGroup' ? `miembro de ${labelFor(r)}` : labelFor(r)));
  if (labels.length === 1) return `${def.noun} ${verb} ${labels[0]}`;
  const link = cond.operator === 'is' ? ' o ' : ' ni ';
  return `${def.noun} ${verb} ${labels.slice(0, -1).join(', ')}${link}${labels[labels.length - 1]}`;
}

function describeGroup(group: ConditionGroup, labelFor: (ref: ConditionRef) => string): string {
  const sep = group.match === 'all' ? ' y ' : ' o ';
  return group.conditions.map((c) => describeCondition(c, labelFor)).join(sep);
}

/** Traduce el árbol a una frase legible. Vacío → "todas las conversaciones". */
export function describeConditionTree(
  tree: ConditionTree,
  labelFor: (ref: ConditionRef) => string,
): string {
  const groups = tree.groups.filter((g) => g.conditions.length > 0);
  if (groups.length === 0) return 'Esta regla se aplica a todas las conversaciones.';
  const sep = tree.match === 'all' ? ' Y ' : ' O ';
  const parts = groups.map((g) => {
    const text = describeGroup(g, labelFor);
    return groups.length > 1 && g.conditions.length > 1 ? `(${text})` : text;
  });
  return `Aplica cuando ${parts.join(sep)}.`;
}

/* ── Descripción estructurada del alcance (vista "Se cumple si…" con badges Y/O
 *    + campos y valores en negrita). Misma lógica que describeConditionTree pero
 *    devuelve estructura para que la plantilla pinte negritas y badges. ── */

/** Una condición resuelta a texto: campo + operador + valor (campo/valor en negrita). */
export interface ScopeDescCondition {
  readonly field: string;
  readonly operator: string;
  /** Valor(es) resueltos; '…' si la condición aún está incompleta. */
  readonly value: string;
}

/** Un grupo + su conector interno ('Y' = all · 'O' = any). */
export interface ScopeDescGroup {
  readonly conditions: readonly ScopeDescCondition[];
  readonly join: 'Y' | 'O';
}

/** Árbol completo listo para pintar con negritas + badges. `empty` = sin condiciones. */
export interface ScopeDesc {
  readonly empty: boolean;
  readonly groups: readonly ScopeDescGroup[];
  /** Conector entre grupos ('Y' = all · 'O' = any). */
  readonly rootJoin: 'Y' | 'O';
}

function conditionToDesc(
  cond: Condition,
  labelFor: (ref: ConditionRef) => string,
): ScopeDescCondition {
  const def = fieldDefById(cond.field);
  const v = cond.value;
  if (v.mode === 'any') return { field: def.label, operator: 'es', value: 'cualquiera' };
  if (v.mode === 'number') {
    const unit = v.unit === 'minutes' ? 'min' : 's';
    if (cond.operator === 'between') {
      return {
        field: def.label,
        operator: 'entre',
        value: `${v.amount} y ${v.amount2 ?? v.amount} ${unit}`,
      };
    }
    return {
      field: def.label,
      operator: cond.operator === 'gt' ? 'mayor que' : 'menor que',
      value: `${v.amount} ${unit}`,
    };
  }
  if (v.mode === 'enum') {
    const lbl = def.options.find((o) => o.value === v.value)?.label ?? v.value;
    return { field: def.label, operator: cond.operator === 'is' ? 'es' : 'no es', value: lbl };
  }
  const verb = cond.operator === 'is' ? 'es' : 'no es';
  if (v.refs.length === 0) return { field: def.label, operator: verb, value: '…' };
  const labels = v.refs.map((r) => (r.kind === 'agentGroup' ? `miembro de ${labelFor(r)}` : labelFor(r)));
  const link = cond.operator === 'is' ? ' o ' : ' ni ';
  const value =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(', ')}${link}${labels[labels.length - 1]}`;
  return { field: def.label, operator: verb, value };
}

/**
 * Igual que `describeConditionTree` pero estructurado: la plantilla pinta los
 * campos/valores en negrita y los conectores Y/O como badges. Vacío → `empty`.
 */
export function describeConditionScope(
  tree: ConditionTree,
  labelFor: (ref: ConditionRef) => string,
): ScopeDesc {
  const groups = tree.groups.filter((g) => g.conditions.length > 0);
  const rootJoin: 'Y' | 'O' = tree.match === 'all' ? 'Y' : 'O';
  if (groups.length === 0) return { empty: true, groups: [], rootJoin };
  return {
    empty: false,
    rootJoin,
    groups: groups.map((g) => ({
      join: g.match === 'all' ? 'Y' : 'O',
      conditions: g.conditions.map((c) => conditionToDesc(c, labelFor)),
    })),
  };
}
