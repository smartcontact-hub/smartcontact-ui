import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScCheckboxComponent as CheckboxComponent } from '@smartcontact-hub/components';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';
import { ScBadgeComponent as BadgeComponent } from '@smartcontact-hub/components';
import { ScSelectButtonComponent as SelectButtonComponent } from '@smartcontact-hub/components';
import { ChangeDetectionStrategy, Component, computed, inject, model } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { injectLangChange } from '@core/utils/lang-change';
import { PopoverModule } from 'primeng/popover';


import {
  EMPTY_FILTERS,
  type MemoryConversationFilters,
} from '../../data/conversation-filters.types';

/**
 * TypeFilterButton + TypeFilterPanel · Memory iter 7.
 *
 * Réplica del par `TypeFilterButton.tsx` + `TypeFilterPanel.tsx` del
 * prototipo React. Botón trigger con icono Filter + dot accent cuando
 * hay filtros activos, + `<p-popover>` con 6 grupos de checkboxes:
 *
 *   Bloque "qué tipo de conversación":
 *     - Tipo de conversación: interna / externa
 *     - Canal: llamada / chat
 *     - Dirección: entrante / saliente
 *
 *   Bloque "qué le pasó":
 *     - Procesamiento aplicado: con grabación / con transcripción / con clasificación
 *     - Estado: solo fallidas
 *     - Multi-grabación: solo con varios tramos / solo con tramos parcialmente transcritos
 *
 * Defaults: types/channels/directions TODOS check (no filtra); rules/
 * status/multirec TODOS unchecked (no filtra). `hasActiveFilters`
 * detecta divergencia vs defaults para encender el dot accent.
 */
let typeFilterIdCounter = 0;

@Component({
  selector: 'sc-memory-type-filter-button',
  imports: [BadgeComponent, CheckboxComponent, ButtonComponent, IconComponent, PopoverModule, SelectButtonComponent, TranslateModule],
  templateUrl: './type-filter-button.component.html',
  styleUrl: './type-filter-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeFilterButtonComponent {
  readonly filters = model.required<MemoryConversationFilters>();

  protected readonly filterIcon = 'filter_alt';

  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  protected readonly panelId = `memory-type-filter-${++typeFilterIdCounter}`;

  /** Los tres pares, cada uno con lo marcado: un segmentado de varios que no se queda vacío. */
  protected readonly pares = computed(() => {
    const f = this.filters();
    this.lang();
    const par = (key: 'types' | 'channels' | 'directions', titleKey: string) => {
      const grupo = f[key] as unknown as Record<string, boolean>;
      return {
        key,
        titleKey,
        options: Object.keys(grupo).map((value) => ({ value, label: this.translate.instant(`memory.type_filter.${key}.${value}`) })),
        value: Object.keys(grupo).filter((k) => grupo[k]),
      };
    };
    return [
      par('types', 'memory.type_filter.groups.type'),
      par('channels', 'memory.type_filter.groups.channel'),
      par('directions', 'memory.type_filter.groups.direction'),
    ];
  });

  protected updatePair(key: 'types' | 'channels' | 'directions', value: unknown): void {
    const marcados = Array.isArray(value) ? (value as string[]) : [];
    const f = this.filters();
    const grupo = f[key] as unknown as Record<string, boolean>;
    this.filters.set({ ...f, [key]: Object.fromEntries(Object.keys(grupo).map((k) => [k, marcados.includes(k)])) });
  }

  /** Cuántos de los seis grupos del panel filtran algo. */
  protected readonly activeGroupCount = computed(() => {
    const f = this.filters();
    return [
      !f.types.interna || !f.types.externa,
      !f.channels.llamada || !f.channels.chat,
      !f.directions.entrante || !f.directions.saliente,
      f.rules.recording || f.rules.transcription || f.rules.classification,
      f.multirec.onlyMulti || f.multirec.onlyPartial,
    ].filter(Boolean).length;
  });

  protected readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    if (!f.types.interna || !f.types.externa) return true;
    if (!f.channels.llamada || !f.channels.chat) return true;
    if (!f.directions.entrante || !f.directions.saliente) return true;
    if (f.rules.recording || f.rules.transcription || f.rules.classification) {
      return true;
    }
    if (f.multirec.onlyMulti || f.multirec.onlyPartial) return true;
    return false;
  });

  protected updateRules(
    key: 'recording' | 'transcription' | 'classification',
    value: boolean,
  ): void {
    const f = this.filters();
    this.filters.set({ ...f, rules: { ...f.rules, [key]: value } });
  }

  protected updateMultirec(key: 'onlyMulti' | 'onlyPartial', value: boolean): void {
    const f = this.filters();
    this.filters.set({ ...f, multirec: { ...f.multirec, [key]: value } });
  }

  protected resetPopoverFilters(): void {
    const f = this.filters();
    // Limpia solo las dimensiones del popover: la barra y la vista rápida (`status`) se quedan
    this.filters.set({
      ...f,
      types: EMPTY_FILTERS.types,
      channels: EMPTY_FILTERS.channels,
      directions: EMPTY_FILTERS.directions,
      rules: EMPTY_FILTERS.rules,
      multirec: EMPTY_FILTERS.multirec,
    });
  }

  protected toCheckbox(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }
}
