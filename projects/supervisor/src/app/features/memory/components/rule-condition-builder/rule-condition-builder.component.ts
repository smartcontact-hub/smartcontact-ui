import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IconComponent } from '@shared/components';
import { ScSelectComponent as SelectComponent } from '@smartcontact-hub/components';

import { conversationMatchesTree, hasUnevaluableConditions } from '../../data/condition-eval';
import { ConditionResolverService } from '../../data/condition-resolver.service';
import {
  type Condition,
  CONDITION_FIELDS,
  type ConditionFieldId,
  type ConditionGroup,
  type ConditionOperator,
  type ConditionTree,
  type ConditionValue,
  defaultOperatorFor,
  describeConditionTree,
  type DurationUnit,
  emptyValueFor,
  fieldDefById,
  type GroupMatch,
  makeCondition,
  makeGroup,
  operatorLabel,
  operatorsForKind,
} from '../../data/condition.types';
import { ConversationsStore } from '../../state/conversations.store';
import { RuleConditionValuePickerComponent } from '../rule-condition-value-picker/rule-condition-value-picker.component';

/**
 * Constructor de condiciones (v2). Campos unificados (servicio/grupo/agente/
 * dirección/duración/tipificación/categoría) con operadores y editor de valor
 * contextuales según el kind del campo. Plano con 1 grupo; agrupación AND/OR al
 * añadir un 2º grupo. El resumen y la proyección legacy resuelven referencias en
 * vivo vía `ConditionResolverService`.
 */
@Component({
  selector: 'sc-rule-condition-builder',
  imports: [
    FormsModule,
    IconComponent,
    NgTemplateOutlet,
    RuleConditionValuePickerComponent,
    SelectComponent,
  ],
  templateUrl: './rule-condition-builder.component.html',
  styleUrl: './rule-condition-builder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleConditionBuilderComponent {
  readonly value = model.required<ConditionTree>();

  private readonly resolver = inject(ConditionResolverService);
  private readonly conversations = inject(ConversationsStore);

  protected readonly fieldOptions = CONDITION_FIELDS.map((f) => ({
    value: f.id,
    label: f.label,
    icon: f.icon,
    group: f.group,
  }));

  protected readonly durationUnitOptions = [
    { value: 'seconds', label: 'segundos' },
    { value: 'minutes', label: 'minutos' },
  ];

  protected readonly addIcon = 'add';
  protected readonly closeIcon = 'close';
  protected readonly summaryIcon = 'rule';

  protected readonly summary = computed(() =>
    describeConditionTree(this.value(), (ref) => this.resolver.label(ref)),
  );

  /** Preview de impacto: conversaciones del mock que casan con el árbol (en vivo;
   *  resuelve membresía de grupos al vuelo). Servicio/dirección/duración exactos;
   *  grupo/agente vía puente demo; tipificación/categoría no se evalúan aquí. */
  protected readonly impactTotal = computed(() => this.conversations.conversations().length);
  protected readonly impactCount = computed(() => {
    const tree = this.value();
    const ctx = { memberAgentIds: (id: number) => this.resolver.memberAgentIds(id) };
    return this.conversations
      .conversations()
      .filter((c) => conversationMatchesTree(c, tree, ctx)).length;
  });
  protected readonly hasUnevaluable = computed(() => hasUnevaluableConditions(this.value()));

  protected fieldDef = fieldDefById;

  protected refKindOf(field: ConditionFieldId) {
    return fieldDefById(field).refKind ?? 'service';
  }

  protected operatorOptionsFor(field: ConditionFieldId) {
    return operatorsForKind(fieldDefById(field).kind).map((op) => ({
      value: op,
      label: operatorLabel(op),
    }));
  }

  protected directionOptionsFor(field: ConditionFieldId) {
    return fieldDefById(field).options.map((o) => ({ value: o.value, label: o.label }));
  }

  /* ── Accesores de valor (para los editores enum/número) ── */
  protected enumValue(cond: Condition): string {
    return cond.value.mode === 'enum' ? cond.value.value : '';
  }
  protected numAmount(cond: Condition): number {
    return cond.value.mode === 'number' ? cond.value.amount : 0;
  }
  protected numAmount2(cond: Condition): number {
    return cond.value.mode === 'number' ? (cond.value.amount2 ?? 0) : 0;
  }
  protected numUnit(cond: Condition): DurationUnit {
    return cond.value.mode === 'number' ? cond.value.unit : 'seconds';
  }

  protected trackGroup = (_: number, g: ConditionGroup) => g.id;
  protected trackCondition = (_: number, c: Condition) => c.id;

  /* ── Raíz ── */
  protected setRootMatch(match: GroupMatch): void {
    this.value.update((t) => ({ ...t, match }));
  }
  protected toggleRootMatch(): void {
    this.value.update((t) => ({ ...t, match: t.match === 'all' ? 'any' : 'all' }));
  }
  protected addGroup(): void {
    this.value.update((t) => {
      const match: GroupMatch = t.groups.length === 1 ? 'any' : t.match;
      return { ...t, match, groups: [...t.groups, makeGroup()] };
    });
  }
  protected removeGroup(groupId: string): void {
    this.value.update((t) => ({ ...t, groups: t.groups.filter((g) => g.id !== groupId) }));
  }

  /* ── Grupos ── */
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

  /* ── Condiciones ── */
  protected setField(groupId: string, condId: string, field: unknown): void {
    const f = field as ConditionFieldId;
    this.patchCondition(groupId, condId, (c) => ({
      ...c,
      field: f,
      operator: defaultOperatorFor(f),
      value: emptyValueFor(f),
    }));
  }
  protected setOperator(groupId: string, condId: string, operator: unknown): void {
    const op = operator as ConditionOperator;
    this.patchCondition(groupId, condId, (c) => {
      // Al pasar a "entre" aseguramos un segundo umbral.
      if (c.value.mode === 'number' && op === 'between' && c.value.amount2 === undefined) {
        return { ...c, operator: op, value: { ...c.value, amount2: c.value.amount } };
      }
      return { ...c, operator: op };
    });
  }
  protected setValue(groupId: string, condId: string, value: ConditionValue): void {
    this.patchCondition(groupId, condId, (c) => ({ ...c, value }));
  }
  protected setEnum(groupId: string, condId: string, val: unknown): void {
    this.patchCondition(groupId, condId, (c) => ({ ...c, value: { mode: 'enum', value: String(val) } }));
  }
  protected setAmount(groupId: string, condId: string, raw: string, which: 1 | 2): void {
    const n = Math.max(0, Number(raw) || 0);
    this.patchCondition(groupId, condId, (c) => {
      if (c.value.mode !== 'number') return c;
      return { ...c, value: which === 1 ? { ...c.value, amount: n } : { ...c.value, amount2: n } };
    });
  }
  protected setUnit(groupId: string, condId: string, unit: unknown): void {
    this.patchCondition(groupId, condId, (c) => {
      if (c.value.mode !== 'number') return c;
      return { ...c, value: { ...c.value, unit: unit as DurationUnit } };
    });
  }

  /* ── Helpers ── */
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
