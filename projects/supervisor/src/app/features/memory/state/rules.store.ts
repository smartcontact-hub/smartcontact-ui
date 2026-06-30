import { computed, Injectable, signal } from '@angular/core';

import { MOCK_RULES } from '../data/rules-mock';
import type { Rule } from '../data/rule.types';

/**
 * Signal store de reglas Memory.
 *
 * MVP transcripción: dos estados, activa o inactiva. **Solo una regla puede
 * estar activa a la vez** → activar una desactiva el resto (patrón radio). Sin
 * borradores ni priorización: como nunca hay dos activas, no hay orden ni
 * conflictos que resolver. Expone la lista mock + los computeds de las dos
 * secciones del listado (Activa / Inactivas) y el CRUD que mantiene el invariante.
 */
@Injectable({ providedIn: 'root' })
export class RulesStore {
  private readonly _rules = signal<readonly Rule[]>(MOCK_RULES);

  readonly rules = this._rules.asReadonly();

  /** Regla activa. MVP: como mucho una; el array facilita el render del listado. */
  readonly activeRules = computed(() =>
    [...this._rules()]
      .filter((r) => r.active)
      .sort((a, b) => b.lastModified.localeCompare(a.lastModified)),
  );

  /** Reglas inactivas, más recientes primero. */
  readonly inactiveRules = computed(() =>
    [...this._rules()]
      .filter((r) => !r.active)
      .sort((a, b) => b.lastModified.localeCompare(a.lastModified)),
  );

  readonly hasActive = computed(() => this.activeRules().length > 0);
  readonly isEmpty = computed(() => this._rules().length === 0);

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

  getRule(id: number): Rule | undefined {
    return this._rules().find((r) => r.id === id);
  }

  /**
   * Activa o desactiva una regla. Invariante "una sola activa": al activar una,
   * cualquier otra activa pasa a inactiva (radio). Desactivar solo la apaga.
   */
  toggleActive(id: number): void {
    this._rules.update((rules) => {
      const target = rules.find((r) => r.id === id);
      if (!target) return rules;
      const now = new Date().toISOString();
      if (target.active) {
        return rules.map((r) => (r.id === id ? { ...r, active: false, lastModified: now } : r));
      }
      return rules.map((r) => {
        if (r.id === id) return { ...r, active: true, lastModified: now };
        if (r.active) return { ...r, active: false, lastModified: now };
        return r;
      });
    });
  }

  /**
   * Crear una regla nueva. Asigna id auto-incremental + lastModified now. Si
   * nace activa, desactiva el resto (solo una activa a la vez).
   */
  addRule(partial: Omit<Rule, 'id' | 'lastModified'>): Rule {
    const now = new Date().toISOString();
    const nextId = this._rules().reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const newRule: Rule = { ...partial, id: nextId, lastModified: now };
    this._rules.update((rules) => {
      const base = newRule.active
        ? rules.map((r) => (r.active ? { ...r, active: false } : r))
        : rules;
      return [...base, newRule];
    });
    return newRule;
  }

  /**
   * Actualizar una regla existente. Si queda activa, desactiva el resto para
   * mantener el invariante de "una sola activa". Marca lastModified.
   */
  updateRule(id: number, patch: Partial<Rule>): void {
    this._rules.update((rules) => {
      const now = new Date().toISOString();
      const target = rules.find((r) => r.id === id);
      if (!target) return rules;
      const willBeActive = patch.active ?? target.active;
      return rules.map((r) => {
        if (r.id === id) return { ...r, ...patch, lastModified: now };
        if (willBeActive && r.active) return { ...r, active: false, lastModified: now };
        return r;
      });
    });
  }

  /**
   * Duplica una regla existente. Crea una copia inactiva con prefijo "Copia de"
   * en el nombre; el usuario la edita y/o activa cuando quiera (sin borradores).
   */
  duplicateRule(id: number): Rule | null {
    const source = this.getRule(id);
    if (!source) return null;
    return this.addRule({
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
    });
  }

  deleteRule(id: number): void {
    this._rules.update((rules) => rules.filter((r) => r.id !== id));
  }
}
