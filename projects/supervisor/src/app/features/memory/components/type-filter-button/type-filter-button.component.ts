import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ChangeDetectionStrategy, Component, computed, model } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
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
@Component({
  selector: 'sc-memory-type-filter-button',
  imports: [IconComponent, PopoverModule, TranslateModule],
  templateUrl: './type-filter-button.component.html',
  styleUrl: './type-filter-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeFilterButtonComponent {
  readonly filters = model.required<MemoryConversationFilters>();

  protected readonly filterIcon = 'filter_alt';

  protected readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    if (!f.types.interna || !f.types.externa) return true;
    if (!f.channels.llamada || !f.channels.chat) return true;
    if (!f.directions.entrante || !f.directions.saliente) return true;
    if (f.rules.recording || f.rules.transcription || f.rules.classification) {
      return true;
    }
    if (f.status.onlyFailed) return true;
    if (f.multirec.onlyMulti || f.multirec.onlyPartial) return true;
    return false;
  });

  protected updateTypes(key: 'interna' | 'externa', value: boolean): void {
    const f = this.filters();
    this.filters.set({ ...f, types: { ...f.types, [key]: value } });
  }

  protected updateChannels(key: 'llamada' | 'chat', value: boolean): void {
    const f = this.filters();
    this.filters.set({ ...f, channels: { ...f.channels, [key]: value } });
  }

  protected updateDirections(key: 'entrante' | 'saliente', value: boolean): void {
    const f = this.filters();
    this.filters.set({ ...f, directions: { ...f.directions, [key]: value } });
  }

  protected updateRules(
    key: 'recording' | 'transcription' | 'classification',
    value: boolean,
  ): void {
    const f = this.filters();
    this.filters.set({ ...f, rules: { ...f.rules, [key]: value } });
  }

  protected updateStatus(value: boolean): void {
    const f = this.filters();
    this.filters.set({ ...f, status: { ...f.status, onlyFailed: value } });
  }

  protected updateMultirec(key: 'onlyMulti' | 'onlyPartial', value: boolean): void {
    const f = this.filters();
    this.filters.set({ ...f, multirec: { ...f.multirec, [key]: value } });
  }

  protected resetPopoverFilters(): void {
    const f = this.filters();
    // Limpia solo las dimensiones del popover, preserva header top-bar
    this.filters.set({
      ...f,
      types: EMPTY_FILTERS.types,
      channels: EMPTY_FILTERS.channels,
      directions: EMPTY_FILTERS.directions,
      rules: EMPTY_FILTERS.rules,
      status: EMPTY_FILTERS.status,
      multirec: EMPTY_FILTERS.multirec,
    });
  }

  protected toCheckbox(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }
}
