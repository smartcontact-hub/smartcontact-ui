import { computed, Injectable, signal } from '@angular/core';

import { MOCK_RULES } from '../data/rules-mock';
import type { Rule } from '../data/rule.types';

/**
 * Signal store de reglas Memory.
 *
 * Transcripción: dos estados, activa o inactiva. **Puede haber varias reglas
 * activas a la vez** — activar una no desactiva al resto. Expone la lista mock +
 * los computeds de las dos secciones del listado (Activas / Inactivas) y el CRUD.
 */
@Injectable({ providedIn: 'root' })
export class RulesStore {
  private readonly _rules = signal<readonly Rule[]>(MOCK_RULES);

  readonly rules = this._rules.asReadonly();

  /** Reglas activas, más recientes primero. */
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
   * Activa o desactiva una regla. Pueden coexistir varias activas: activar una
   * NO toca a las demás; desactivar solo la apaga.
   */
  toggleActive(id: number): void {
    this._rules.update((rules) => {
      const target = rules.find((r) => r.id === id);
      if (!target) return rules;
      const now = new Date().toISOString();
      return rules.map((r) =>
        r.id === id ? { ...r, active: !r.active, lastModified: now } : r,
      );
    });
  }

  /**
   * Crear una regla nueva. Asigna id auto-incremental + lastModified now. Puede
   * nacer activa sin afectar a las demás (varias activas permitidas).
   */
  addRule(partial: Omit<Rule, 'id' | 'lastModified'>): Rule {
    const now = new Date().toISOString();
    const nextId = this._rules().reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const newRule: Rule = { ...partial, id: nextId, lastModified: now };
    this._rules.update((rules) => [...rules, newRule]);
    return newRule;
  }

  /**
   * Actualizar una regla existente. Marca lastModified. Varias reglas pueden
   * quedar activas a la vez.
   */
  updateRule(id: number, patch: Partial<Rule>): void {
    this._rules.update((rules) => {
      const now = new Date().toISOString();
      const target = rules.find((r) => r.id === id);
      if (!target) return rules;
      return rules.map((r) => (r.id === id ? { ...r, ...patch, lastModified: now } : r));
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
