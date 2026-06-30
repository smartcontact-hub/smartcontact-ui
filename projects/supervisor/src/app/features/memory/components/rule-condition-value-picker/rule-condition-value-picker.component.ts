import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { IconComponent } from '@shared/components';

import { ConditionResolverService } from '../../data/condition-resolver.service';
import type { ConditionRef, ConditionValue, RefKind } from '../../data/condition.types';

interface PickerOption {
  readonly ref: ConditionRef;
  readonly label: string;
  /** Subtexto (p.ej. "12 agentes" en un grupo, o el rol del agente). */
  readonly sub?: string;
}

export function refKey(ref: ConditionRef): string {
  if (ref.kind === 'service') return `service:${ref.name}`;
  if (ref.kind === 'category') return `category:${ref.id}`;
  return `${ref.kind}:${ref.id}`;
}

/**
 * Picker de valor de una condición lista (constructor v2). Feature-scoped (NO en
 * el DS lib: `sc-multiselect` no reenvía `pTemplate`, así que el picker rico —
 * buscador + seleccionados/disponibles + "seleccionar todo"→comodín + grupos
 * como miembros vivos — es custom).
 *
 * Mecanismo "ambas": para `refKind='agent'` el panel lista agentes individuales
 * Y grupos (con contador de miembros vivo). Elegir un grupo guarda
 * `{kind:'agentGroup', id}` → "los miembros del grupo X ahora".
 */
@Component({
  selector: 'sc-rule-condition-value-picker',
  imports: [FormsModule, IconComponent, TranslateModule],
  templateUrl: './rule-condition-value-picker.component.html',
  styleUrl: './rule-condition-value-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleConditionValuePickerComponent {
  readonly refKind = input.required<RefKind>();
  readonly value = model.required<ConditionValue>();
  readonly placeholder = input('Seleccionar…');

  private readonly resolver = inject(ConditionResolverService);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly addIcon = 'add';
  protected readonly closeIcon = 'close';
  protected readonly checkIcon = 'check';
  protected readonly searchIcon = 'search';

  protected readonly open = signal(false);
  /** El panel se abre hacia arriba si no cabe debajo (evita tapar el resumen +
   *  el preview de impacto cuando la condición está en la parte baja del form). */
  protected readonly openUp = signal(false);
  protected readonly search = signal('');

  protected readonly isAny = computed(() => this.value().mode === 'any');

  protected readonly selectedRefs = computed<readonly ConditionRef[]>(() => {
    const v = this.value();
    return v.mode === 'refs' ? v.refs : [];
  });

  private readonly selectedKeys = computed(() => new Set(this.selectedRefs().map(refKey)));

  protected readonly chips = computed(() =>
    this.selectedRefs().map((r) => ({ ref: r, key: refKey(r), label: this.resolver.label(r) })),
  );

  /** Catálogo base del refKind (agentes/grupos/servicios/tipificaciones). */
  private readonly entityOptions = computed<PickerOption[]>(() => {
    switch (this.refKind()) {
      case 'service':
        return this.resolver.services.map((name) => ({ ref: { kind: 'service', name }, label: name }));
      case 'group':
        return this.resolver.groups.map((g) => ({ ref: { kind: 'group', id: g.id }, label: g.name }));
      case 'agent':
        return this.resolver.agents.map((a) => ({ ref: { kind: 'agent', id: a.id }, label: a.name }));
      case 'tipificacion':
        return this.resolver.tipificaciones.map((t) => ({
          ref: { kind: 'tipificacion', id: t.id },
          label: t.name,
        }));
      case 'category':
        return [];
    }
  });

  /** Solo `agent`: grupos como sus miembros vivos (`agentGroup`). */
  private readonly groupOptions = computed<PickerOption[]>(() =>
    this.refKind() === 'agent'
      ? this.resolver.groups.map((g) => ({
          ref: { kind: 'agentGroup', id: g.id },
          label: g.name,
          sub: `${this.resolver.memberCount(g.id)} agentes`,
        }))
      : [],
  );

  protected readonly filteredEntities = computed(() => filterBy(this.entityOptions(), this.search()));
  protected readonly filteredGroups = computed(() => filterBy(this.groupOptions(), this.search()));

  protected isSelected(ref: ConditionRef): boolean {
    return this.selectedKeys().has(refKey(ref));
  }

  protected toggleOpen(): void {
    if (!this.open()) {
      // Decide la dirección antes de abrir: si debajo no caben ~320px (descontando
      // el footer sticky) y arriba hay más sitio, abre hacia arriba.
      const r = this.host.nativeElement.getBoundingClientRect();
      const below = window.innerHeight - r.bottom - 80;
      this.openUp.set(below < 320 && r.top > below);
    }
    this.open.update((o) => !o);
    if (!this.open()) this.search.set('');
  }

  protected close(): void {
    this.open.set(false);
    this.search.set('');
  }

  protected toggle(ref: ConditionRef): void {
    const current = this.selectedRefs();
    const k = refKey(ref);
    const next = this.selectedKeys().has(k)
      ? current.filter((r) => refKey(r) !== k)
      : [...current, ref];
    this.value.set({ mode: 'refs', refs: next });
  }

  protected removeChip(ref: ConditionRef): void {
    this.toggle(ref);
  }

  protected selectAll(): void {
    this.value.set({ mode: 'any' });
    this.close();
  }

  protected clearAny(): void {
    this.value.set({ mode: 'refs', refs: [] });
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onDocPointerDown(ev: PointerEvent): void {
    if (this.open() && !this.host.nativeElement.contains(ev.target as Node)) this.close();
  }
}

function filterBy(opts: readonly PickerOption[], q: string): PickerOption[] {
  const s = q.trim().toLowerCase();
  return s ? opts.filter((o) => o.label.toLowerCase().includes(s)) : [...opts];
}
