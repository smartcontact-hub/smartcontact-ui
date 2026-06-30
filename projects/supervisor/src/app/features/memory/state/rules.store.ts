import { computed, Injectable, signal } from '@angular/core';

import { MOCK_RULES } from '../data/rules-mock';
import type { Rule } from '../data/rule.types';

/**
 * Signal store de reglas Memory.
 *
 * Iter 9a (S38): expone la lista mock readonly + computeds para las 2
 * secciones del listado (Activas ordenables / Inactivas+Borradores).
 *
 * Iter 9b: + reorderActive (drag-drop priorización), toggleActive, deleteRule.
 * Iter 9c: + CRUD vía constructor.
 * Iter 9d: + duplicateRule, conflict detection.
 */
function scopeOverlaps(a: Rule, b: Rule): boolean {
  return (
    dimensionOverlaps(a.servicios, b.servicios) &&
    dimensionOverlaps(a.grupos, b.grupos) &&
    dimensionOverlaps(a.agentes, b.agentes)
  );
}

function dimensionOverlaps(a: readonly string[], b: readonly string[]): boolean {
  // Vacío = "cualquiera" → siempre overlap con esa dimensión.
  if (a.length === 0 || b.length === 0) return true;
  return a.some((v) => b.includes(v));
}

function appendTo(map: Map<number, number[]>, key: number, value: number): void {
  const curr = map.get(key);
  if (curr) curr.push(value);
  else map.set(key, [value]);
}

@Injectable({ providedIn: 'root' })
export class RulesStore {
  private readonly _rules = signal<readonly Rule[]>(MOCK_RULES);

  readonly rules = this._rules.asReadonly();

  /** Reglas activas ordenadas por prioridad ascendente (1 = más alta). */
  readonly activeRules = computed(() => {
    return [...this._rules()]
      .filter((r) => r.active && !r.isDraft)
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  });

  /** Reglas inactivas + borradores, sin orden de prioridad. */
  readonly inactiveOrDraftRules = computed(() => {
    return [...this._rules()]
      .filter((r) => !r.active || r.isDraft)
      .sort((a, b) => b.lastModified.localeCompare(a.lastModified));
  });

  readonly hasActive = computed(() => this.activeRules().length > 0);
  readonly isEmpty = computed(() => this._rules().length === 0);

  /**
   * Mapa de conflictos · spec `rule-constructor-update-1.md §82-92`.
   * 2 reglas activas conflictúan si comparten al menos un valor en
   * cada una de las 3 dimensiones del alcance (o una de las
   * dimensiones está vacía = "cualquiera") Y son del mismo `type`.
   *
   * Retorna: Map<ruleId, ruleIds[]> con las reglas que conflictúan
   * con cada una.
   */
  readonly conflictsByRuleId = computed(() => {
    const active = this.activeRules();
    const map = new Map<number, number[]>();
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i];
        const b = active[j];
        if (a.type !== b.type) continue;
        if (!scopeOverlaps(a, b)) continue;
        appendTo(map, a.id, b.id);
        appendTo(map, b.id, a.id);
      }
    }
    return map;
  });

  isInConflict(id: number): boolean {
    return this.conflictsByRuleId().has(id);
  }

  /**
   * Mapa categoryId → reglas que la usan (en `rule.categorias`). Fuente de
   * verdad para la relación bidireccional Rule ↔ Category (S49 §10 #13).
   * Vista derivada de `Rule.categorias`; sin estado duplicado.
   */
  readonly rulesByCategoryId = computed(() => {
    const map = new Map<string, Rule[]>();
    for (const rule of this._rules()) {
      const cats = rule.categorias;
      if (!cats || cats.length === 0) continue;
      for (const catId of cats) {
        const curr = map.get(catId);
        if (curr) curr.push(rule);
        else map.set(catId, [rule]);
      }
    }
    return map;
  });

  rulesUsingCategory(categoryId: string): readonly Rule[] {
    return this.rulesByCategoryId().get(categoryId) ?? [];
  }

  /**
   * Vincula `categoryId` a la regla. Idempotente: si ya está, no duplica.
   */
  linkCategoryToRule(ruleId: number, categoryId: string): void {
    this._rules.update((rules) => {
      const target = rules.find((r) => r.id === ruleId);
      if (!target) return rules;
      const curr = target.categorias ?? [];
      if (curr.includes(categoryId)) return rules;
      const now = new Date().toISOString();
      return rules.map((r) =>
        r.id === ruleId ? { ...r, categorias: [...curr, categoryId], lastModified: now } : r,
      );
    });
  }

  /**
   * Desvincula `categoryId` de la regla.
   */
  unlinkCategoryFromRule(ruleId: number, categoryId: string): void {
    this._rules.update((rules) => {
      const target = rules.find((r) => r.id === ruleId);
      if (!target) return rules;
      const curr = target.categorias ?? [];
      if (!curr.includes(categoryId)) return rules;
      const now = new Date().toISOString();
      return rules.map((r) =>
        r.id === ruleId
          ? { ...r, categorias: curr.filter((c) => c !== categoryId), lastModified: now }
          : r,
      );
    });
  }

  getConflictingRules(id: number): readonly Rule[] {
    const ids = this.conflictsByRuleId().get(id) ?? [];
    const all = this._rules();
    return ids.map((cid) => all.find((r) => r.id === cid)!).filter(Boolean);
  }

  /**
   * Reorderar las reglas activas según un nuevo array de ids. Recompone
   * `priority` 1..N sobre la lista activa según el orden recibido.
   * Las inactivas/borradores no se tocan.
   */
  reorderActive(orderedIds: readonly number[]): void {
    this._rules.update((rules) => {
      const newPrioByid = new Map<number, number>();
      orderedIds.forEach((id, idx) => newPrioByid.set(id, idx + 1));
      const now = new Date().toISOString();
      return rules.map((r) => {
        if (!newPrioByid.has(r.id)) return r;
        const newPrio = newPrioByid.get(r.id);
        if (r.priority === newPrio) return r;
        return { ...r, priority: newPrio, lastModified: now };
      });
    });
  }

  /**
   * Toggle active/inactive. Si pasa de inactive→active, asigna priority
   * al final del orden actual (último). Si pasa active→inactive, deja
   * `priority` undefined y recompacta el resto de activas.
   */
  toggleActive(id: number): void {
    this._rules.update((rules) => {
      const target = rules.find((r) => r.id === id);
      if (!target) return rules;
      const now = new Date().toISOString();

      if (target.active) {
        // active → inactive: quitar priority + recompactar resto
        const updated = rules.map((r) =>
          r.id === id ? { ...r, active: false, priority: undefined, lastModified: now } : r,
        );
        // Recompactar prioridades de las activas restantes (1..N)
        const remainingActive = updated
          .filter((r) => r.active && !r.isDraft)
          .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
        return updated.map((r) => {
          if (!r.active || r.isDraft) return r;
          const idx = remainingActive.findIndex((a) => a.id === r.id);
          return idx >= 0 ? { ...r, priority: idx + 1 } : r;
        });
      } else {
        // inactive/draft → active: append al final del orden
        const maxPrio = rules
          .filter((r) => r.active && !r.isDraft)
          .reduce((max, r) => Math.max(max, r.priority ?? 0), 0);
        return rules.map((r) =>
          r.id === id
            ? {
                ...r,
                active: true,
                isDraft: false,
                priority: maxPrio + 1,
                lastModified: now,
              }
            : r,
        );
      }
    });
  }

  getRule(id: number): Rule | undefined {
    return this._rules().find((r) => r.id === id);
  }

  /**
   * Crear una regla nueva. Asigna id auto-incremental + lastModified now.
   * Si `active: true`, asigna priority al final del orden actual.
   */
  addRule(partial: Omit<Rule, 'id' | 'lastModified' | 'priority'>): Rule {
    const now = new Date().toISOString();
    const nextId = this._rules().reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const maxPrio = this._rules()
      .filter((r) => r.active && !r.isDraft)
      .reduce((max, r) => Math.max(max, r.priority ?? 0), 0);
    const newRule: Rule = {
      ...partial,
      id: nextId,
      lastModified: now,
      priority: partial.active && !partial.isDraft ? maxPrio + 1 : undefined,
    };
    this._rules.update((rules) => [...rules, newRule]);
    return newRule;
  }

  /**
   * Actualizar una regla existente. Si toggle active cambia, recompacta
   * prioridades como en `toggleActive`. Marca lastModified.
   */
  updateRule(id: number, patch: Partial<Rule>): void {
    this._rules.update((rules) => {
      const now = new Date().toISOString();
      const target = rules.find((r) => r.id === id);
      if (!target) return rules;
      // Si pasa a active y no tiene priority, asignar al final
      const wasActive = target.active && !target.isDraft;
      const willBeActive = (patch.active ?? target.active) && !(patch.isDraft ?? target.isDraft);
      let nextPriority = patch.priority ?? target.priority;
      if (!wasActive && willBeActive && nextPriority === undefined) {
        const maxPrio = rules
          .filter((r) => r.active && !r.isDraft && r.id !== id)
          .reduce((max, r) => Math.max(max, r.priority ?? 0), 0);
        nextPriority = maxPrio + 1;
      }
      if (wasActive && !willBeActive) {
        nextPriority = undefined;
      }
      return rules.map((r) =>
        r.id === id ? { ...r, ...patch, priority: nextPriority, lastModified: now } : r,
      );
    });
  }

  /**
   * Duplica una regla existente. Crea copia con prefijo "Copia de" en
   * el name + `isDraft: true` + `active: false` + `duplicatedFromId`
   * apuntando al original. Spec `rule-constructor-update-1.md` §94-108.
   */
  duplicateRule(id: number): Rule | null {
    const source = this.getRule(id);
    if (!source) return null;
    const copy = this.addRule({
      type: source.type,
      name: `Copia de ${source.name}`,
      description: source.description,
      servicios: source.servicios,
      grupos: source.grupos,
      agentes: source.agentes,
      conditionTree: source.conditionTree,
      recording: source.recording,
      transcripcion: source.transcripcion,
      clasificacion: source.clasificacion,
      active: false,
      direction: source.direction,
      schedule: source.schedule,
      durationMin: source.durationMin,
      aiAnalysis: source.aiAnalysis,
      categorias: source.categorias,
      isDraft: true,
      duplicatedFromId: id,
    });
    return copy;
  }

  deleteRule(id: number): void {
    this._rules.update((rules) => {
      const filtered = rules.filter((r) => r.id !== id);
      // Recompactar prioridades de las activas restantes (1..N)
      const remainingActive = filtered
        .filter((r) => r.active && !r.isDraft)
        .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
      return filtered.map((r) => {
        if (!r.active || r.isDraft) return r;
        const idx = remainingActive.findIndex((a) => a.id === r.id);
        return idx >= 0 ? { ...r, priority: idx + 1 } : r;
      });
    });
  }
}
