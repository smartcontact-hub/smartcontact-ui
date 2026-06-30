import { ChangeDetectionStrategy, Component, computed, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IconComponent } from '@shared/components';
import { ScMultiSelectComponent as MultiSelectComponent } from '@smartcontact-hub/components';
import { ScSelectComponent as SelectComponent } from '@smartcontact-hub/components';

import {
  CONDITION_FIELDS,
  type Condition,
  type ConditionFieldId,
  type ConditionGroup,
  type ConditionOperator,
  type ConditionTree,
  describeConditionTree,
  fieldDefById,
  type GroupMatch,
  makeCondition,
  makeGroup,
} from '../../data/condition.types';

/**
 * Constructor de condiciones — Variante B (match all/any · AND/OR · grupos).
 *
 * Dos niveles: la raíz combina GRUPOS (TODAS/CUALQUIERA) y cada grupo combina
 * CONDICIONES (TODAS/CUALQUIERA). Los conectores Y/O entre filas y entre grupos
 * son clicables: alternan el `match` de ese nivel. Emite el árbol por `value`
 * (two-way con `model`).
 */
@Component({
  selector: 'sc-rule-condition-builder',
  imports: [FormsModule, IconComponent, MultiSelectComponent, SelectComponent],
  templateUrl: './rule-condition-builder.component.html',
  styleUrl: './rule-condition-builder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleConditionBuilderComponent {
  /** Árbol de condiciones (two-way). El padre lo siembra y lo persiste. */
  readonly value = model.required<ConditionTree>();

  protected readonly fieldOptions = CONDITION_FIELDS.map((f) => ({ value: f.id, label: f.label }));
  protected readonly operatorOptions = [
    { value: 'is' as ConditionOperator, label: 'es' },
    { value: 'is_not' as ConditionOperator, label: 'no es' },
  ];

  protected readonly addIcon = 'add';
  protected readonly closeIcon = 'close';
  protected readonly sparklesIcon = 'auto_awesome';
  protected readonly layersIcon = 'workspaces';

  /** Resumen en prosa, recalculado en vivo. */
  protected readonly summary = computed(() => describeConditionTree(this.value()));

  protected fieldOptionsFor(field: ConditionFieldId) {
    return fieldDefById(field).options;
  }

  protected placeholderFor(field: ConditionFieldId): string {
    return fieldDefById(field).placeholder;
  }

  protected trackGroup = (_: number, g: ConditionGroup) => g.id;
  protected trackCondition = (_: number, c: Condition) => c.id;

  /* ------------------------------ raíz ------------------------------ */

  protected setRootMatch(match: GroupMatch): void {
    this.value.update((t) => ({ ...t, match }));
  }

  protected toggleRootMatch(): void {
    this.value.update((t) => ({ ...t, match: t.match === 'all' ? 'any' : 'all' }));
  }

  protected addGroup(): void {
    this.value.update((t) => ({ ...t, groups: [...t.groups, makeGroup()] }));
  }

  protected removeGroup(groupId: string): void {
    this.value.update((t) => ({ ...t, groups: t.groups.filter((g) => g.id !== groupId) }));
  }

  /* ----------------------------- grupos ----------------------------- */

  protected setGroupMatch(groupId: string, match: GroupMatch): void {
    this.patchGroup(groupId, (g) => ({ ...g, match }));
  }

  protected toggleGroupMatch(groupId: string): void {
    this.patchGroup(groupId, (g) => ({ ...g, match: g.match === 'all' ? 'any' : 'all' }));
  }

  protected addCondition(groupId: string): void {
    this.patchGroup(groupId, (g) => ({ ...g, conditions: [...g.conditions, makeCondition()] }));
  }

  protected removeCondition(groupId: string, condId: string): void {
    this.patchGroup(groupId, (g) => ({
      ...g,
      conditions: g.conditions.filter((c) => c.id !== condId),
    }));
  }

  /* --------------------------- condiciones -------------------------- */

  protected setField(groupId: string, condId: string, field: unknown): void {
    // Cambiar de campo invalida los valores (otro catálogo) → se limpian.
    this.patchCondition(groupId, condId, (c) => ({
      ...c,
      field: field as ConditionFieldId,
      values: [],
    }));
  }

  protected setOperator(groupId: string, condId: string, operator: unknown): void {
    this.patchCondition(groupId, condId, (c) => ({
      ...c,
      operator: operator as ConditionOperator,
    }));
  }

  protected setValues(groupId: string, condId: string, values: unknown): void {
    const arr = (values ?? []) as readonly string[];
    this.patchCondition(groupId, condId, (c) => ({ ...c, values: arr }));
  }

  /* ----------------------------- helpers ---------------------------- */

  private patchGroup(groupId: string, fn: (g: ConditionGroup) => ConditionGroup): void {
    this.value.update((t) => ({
      ...t,
      groups: t.groups.map((g) => (g.id === groupId ? fn(g) : g)),
    }));
  }

  private patchCondition(
    groupId: string,
    condId: string,
    fn: (c: Condition) => Condition,
  ): void {
    this.patchGroup(groupId, (g) => ({
      ...g,
      conditions: g.conditions.map((c) => (c.id === condId ? fn(c) : c)),
    }));
  }
}
