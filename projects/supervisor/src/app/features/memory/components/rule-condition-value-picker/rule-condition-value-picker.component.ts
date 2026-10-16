import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScMultiSelectComponent as MultiSelectComponent } from '@smartcontact-hub/components';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  untracked,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { injectLangChange } from '@core/utils/lang-change';
import { ConditionResolverService } from '../../data/condition-resolver.service';
import type { ConditionRef, ConditionValue, RefKind } from '../../data/condition.types';

interface PickerOption {
  /** Valor de la opción en el multiselect (`refKey`). */
  readonly key: string;
  readonly ref: ConditionRef;
  /** Nombre completo: lo que se busca y lo que oye el lector (en tipificación, la ruta entera). */
  readonly label: string;
  /** Lo que se lee en la fila: en tipificación, la ruta sin su categoría, que ya es la cabecera del grupo. */
  readonly itemLabel: string;
  /** Subtexto (la familia de una categoría IA). */
  readonly sub?: string;
  /** Solo los grupos como miembros vivos (`agentGroup`). */
  readonly memberCount?: number;
  /** Una hoja de tipificación, bajo su categoría. */
  readonly nested?: boolean;
}

interface PickerGroup {
  readonly label: string;
  readonly items: readonly PickerOption[];
}

export function refKey(ref: ConditionRef): string {
  if (ref.kind === 'service') return `service:${ref.name}`;
  if (ref.kind === 'category') return `category:${ref.id}`;
  return `${ref.kind}:${ref.id}`;
}

/**
 * Picker de valor de una condición lista (constructor v2), sobre `sc-multiselect` (candidato 6 del barrido de PrimeNG:
 * el desplegable hecho a mano no tenía flechas ni lector).
 *
 * Mecanismo "ambas": para `refKind='agent'` la lista trae los grupos (con su contador de miembros vivo) y los agentes
 * individuales, en dos secciones. Elegir un grupo guarda `{kind:'agentGroup', id}` → "los miembros del grupo X ahora".
 * Las tipificaciones van por categorías; marcar la categoría es esa categoría, no sus hijas (como antes).
 *
 * Marcar todo es el comodín (`mode: 'any'`): cualquiera, también los que se añadan.
 */
@Component({
  selector: 'sc-rule-condition-value-picker',
  imports: [IconComponent, MultiSelectComponent, TranslateModule],
  templateUrl: './rule-condition-value-picker.component.html',
  styleUrl: './rule-condition-value-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleConditionValuePickerComponent {
  readonly refKind = input.required<RefKind>();
  readonly value = model.required<ConditionValue>();
  readonly placeholder = input('Seleccionar…');
  /** Flujo guiado: al pasar a true, la lista se abre sola (tras elegir el campo). */
  readonly autoOpen = input(false);

  private readonly resolver = inject(ConditionResolverService);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  private readonly picker = viewChild.required(MultiSelectComponent);

  constructor() {
    // Después de que el desplegable de «Campo», al cerrarse, devuelva el foco a su campo: si no, se lo quita.
    effect(() => {
      if (!this.autoOpen()) return;
      const picker = this.picker();
      untracked(() => setTimeout(() => picker.show()));
    });
  }

  protected readonly isAny = computed(() => this.value().mode === 'any');

  private readonly selectedRefs = computed<readonly ConditionRef[]>(() => {
    const v = this.value();
    return v.mode === 'refs' ? v.refs : [];
  });

  /** Los grupos como sus miembros vivos (`agentGroup`), solo para `agent`. */
  private readonly memberGroups = computed<PickerOption[]>(() =>
    this.refKind() === 'agent'
      ? this.resolver.groups.map((g) => {
          const ref: ConditionRef = { kind: 'agentGroup', id: g.id };
          return { key: refKey(ref), ref, label: g.name, itemLabel: g.name, memberCount: this.resolver.memberCount(g.id) };
        })
      : [],
  );

  /** El catálogo del refKind (agentes, grupos, servicios, tipificaciones o categorías IA). */
  private readonly entities = computed<PickerOption[]>(() => {
    const option = (ref: ConditionRef, label: string, extra: Partial<PickerOption> = {}): PickerOption => ({
      key: refKey(ref),
      ref,
      label,
      itemLabel: label,
      ...extra,
    });
    switch (this.refKind()) {
      case 'service':
        return this.resolver.services.map((name) => option({ kind: 'service', name }, name));
      case 'group':
        return this.resolver.groups.map((g) => option({ kind: 'group', id: g.id }, g.name));
      case 'agent':
        return this.resolver.agents.map((a) => option({ kind: 'agent', id: a.id }, a.name));
      case 'tipificacion':
        return this.resolver.tipificaciones.map((t) =>
          option({ kind: 'tipificacion', id: t.id }, t.path.join(' / '), {
            itemLabel: t.path.length > 1 ? t.path.slice(1).join(' / ') : t.path[0],
            nested: t.path.length > 1,
            sub: t.path[0],
          }),
        );
      case 'category':
        return this.resolver.categories().map((c) => option({ kind: 'category', id: c.id }, c.name, { sub: c.group }));
    }
  });

  /** Con secciones: los agentes (grupos e individuales) y las tipificaciones (por su categoría). */
  protected readonly grouped = computed(() => this.refKind() === 'agent' || this.refKind() === 'tipificacion');

  protected readonly options = computed<readonly (PickerOption | PickerGroup)[]>(() => {
    this.lang();
    const entities = this.entities();
    if (this.refKind() === 'agent') {
      return [
        { label: this.translate.instant('memory.rules.builder.cond.pick_groups'), items: this.memberGroups() },
        { label: this.translate.instant('memory.rules.builder.cond.pick_individuals'), items: entities },
      ];
    }
    if (this.refKind() === 'tipificacion') {
      const byCategory = new Map<string, PickerOption[]>();
      for (const o of entities) {
        const category = o.sub ?? o.label;
        byCategory.set(category, [...(byCategory.get(category) ?? []), { ...o, sub: undefined }]);
      }
      return [...byCategory].map(([label, items]) => ({ label, items }));
    }
    return entities;
  });

  private readonly allOptions = computed(() => [...this.memberGroups(), ...this.entities()]);

  /** Lo marcado, como claves; con el comodín, todas. */
  protected readonly selectedKeys = computed<string[]>(() =>
    this.isAny() ? this.allOptions().map((o) => o.key) : this.selectedRefs().map(refKey),
  );

  protected readonly anyLabel = computed(() => {
    this.lang();
    return `${this.translate.instant('memory.rules.builder.cond.pick_all')} (${this.translate.instant('memory.rules.builder.cond.pick_all_hint')})`;
  });

  protected onChange(keys: unknown[]): void {
    const all = this.allOptions();
    if (all.length > 0 && keys.length === all.length) {
      this.value.set({ mode: 'any' });
      return;
    }
    const byKey = new Map(all.map((o) => [o.key, o.ref]));
    // Lo marcado que ya no está en el catálogo (un agente dado de baja) se conserva: no se ve en la lista, así que
    // nadie lo ha desmarcado.
    const fuera = this.selectedRefs().filter((r) => !byKey.has(refKey(r)));
    const refs = keys.flatMap((k) => byKey.get(String(k)) ?? []);
    this.value.set({ mode: 'refs', refs: [...fuera, ...refs] });
  }
}
