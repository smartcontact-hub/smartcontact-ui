import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { IconComponent } from '@shared/components';
import { ScSelectComponent as SelectComponent } from '@smartcontact-hub/components';

import { validateConditionTree } from '../../data/condition-validate';
import {
  DURATION_PRESETS,
  durationPresetBySecs,
  matchDurationPreset,
} from '../../data/duration-presets.core.mjs';
import {
  type Condition,
  CONDITION_FIELDS,
  type ConditionFieldId,
  type ConditionGroup,
  type ConditionOperator,
  type ConditionTree,
  type ConditionValue,
  defaultOperatorFor,
  type DurationUnit,
  emptyValueFor,
  fieldDefById,
  type GroupMatch,
  makeCondition,
  makeGroup,
  operatorLabel,
  operatorsForKind,
  type ValidationIssue,
} from '../../data/condition.types';
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
    TranslateModule,
  ],
  templateUrl: './rule-condition-builder.component.html',
  styleUrl: './rule-condition-builder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleConditionBuilderComponent {
  readonly value = model.required<ConditionTree>();
  /** Tras intentar guardar: revela los errores de "falta elegir un valor". Antes,
   *  una condición recién añadida NO se marca incompleta (no acusa al crearla).
   *  El resto de avisos (duplicado/contradicción/rango) sí son en vivo. */
  readonly revealEmpty = input(true);

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

  /** Presets de duración (idea PPT) + escape "Personalizado…" (value -1). */
  protected readonly durationPresetOptions = [
    ...DURATION_PRESETS.map((p) => ({ value: p.secs, label: p.label })),
    { value: -1, label: 'Personalizado…' },
  ];
  /** Condiciones de duración con input libre (en vez del desplegable de presets). */
  private readonly customDur = signal(new Set<string>());

  /** Flujo guiado: id de la condición cuyo value-picker debe auto-abrirse al
   *  elegir el campo (se despliega el 2º desplegable). */
  protected readonly autoOpenCondId = signal<string | null>(null);

  protected readonly addIcon = 'add';
  protected readonly closeIcon = 'close';
  protected readonly summaryIcon = 'rule';

  /* ── Validación / guía de errores (lógica pura; ver condition-validate) ── */
  private readonly issues = computed(() => validateConditionTree(this.value()));

  /** Incidencias indexadas por la condición donde se pintan. Un par
   *  (contradicción/tautología) se asigna a su 2ª condición para no duplicar. */
  private readonly issuesByCond = computed(() => {
    const map = new Map<string, ValidationIssue[]>();
    for (const issue of this.issues()) {
      const target = issue.condId ?? issue.condIds?.[issue.condIds.length - 1];
      if (!target) continue;
      const list = map.get(target);
      if (list) list.push(issue);
      else map.set(target, [issue]);
    }
    return map;
  });

  protected issuesForCond(id: string): readonly ValidationIssue[] {
    const all = this.issuesByCond().get(id) ?? [];
    return this.revealEmpty() ? all : all.filter((i) => i.code !== 'incomplete');
  }

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

  /* ── Presets de duración (gt/lt) ── */
  protected isCustomDur(cond: Condition): boolean {
    if (this.customDur().has(cond.id)) return true;
    if (cond.value.mode !== 'number') return false;
    return matchDurationPreset(cond.value.amount, cond.value.unit) === null;
  }
  protected durationPresetValue(cond: Condition): number {
    if (this.customDur().has(cond.id)) return -1;
    if (cond.value.mode !== 'number') return 30;
    return matchDurationPreset(cond.value.amount, cond.value.unit)?.secs ?? -1;
  }
  protected setDurationPreset(groupId: string, condId: string, value: unknown): void {
    const secs = Number(value);
    if (secs === -1) {
      this.customDur.update((s) => new Set(s).add(condId));
      return;
    }
    this.customDur.update((s) => {
      const next = new Set(s);
      next.delete(condId);
      return next;
    });
    const preset = durationPresetBySecs(secs);
    if (!preset) return;
    this.patchCondition(groupId, condId, (c) =>
      c.value.mode === 'number'
        ? { ...c, value: { ...c.value, amount: preset.amount, unit: preset.unit } }
        : c,
    );
  }

  protected trackGroup = (_: number, g: ConditionGroup) => g.id;
  protected trackCondition = (_: number, c: Condition) => c.id;

  /* ── Raíz ── */
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
    // Flujo guiado: si el nuevo campo usa el value-picker (lista), auto-abrirlo.
    this.autoOpenCondId.set(fieldDefById(f).kind === 'list' ? condId : null);
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
