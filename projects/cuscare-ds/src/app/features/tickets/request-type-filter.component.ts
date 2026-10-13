import { ChangeDetectionStrategy, Component, computed, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { Listbox, ListboxModule } from 'primeng/listbox';
import { PopoverModule } from 'primeng/popover';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ScTagComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import type { RequestOrigin } from '../../data/seed';
import { plain } from '../../shared/list-page/list-filters';
import {
  DEFAULT_REQUEST_TYPE_FILTER,
  isRequestTypeActive,
  ORIGIN_LABEL,
  ORIGINS,
  type RequestTypeFilter,
} from './request-type';

/**
 * Filtro de la columna «Request type», calcado del Figma «Para desarrollo / Recorrido y reglas del filtro»
 * (2404:35544). Un disparador (campo con contador y ×) que abre un `p-popover` con:
 *   · «Clasificado por»: dos `p-togglebutton` independientes, IA y Agente, unidos por «AND»;
 *   · un `p-divider`;
 *   · «Request type»: un `p-listbox` con casillas, buscador y «seleccionar todo», con scroll.
 * Se aplica al momento, sin botón de aplicar. Cierra con Escape, clic fuera o el propio disparador.
 *
 * Reglas del diseño: sin tipos no hay filtro (cerrar sin tipos reinicia los orígenes); la búsqueda reduce las
 * opciones, no los tickets, y se borra al cerrar; «Match» aparece junto a los tipos marcados cuando están los dos
 * orígenes. La lógica está en `request-type.ts`.
 */
@Component({
  selector: 'app-request-type-filter',
  imports: [FormsModule, DividerModule, ListboxModule, PopoverModule, ScIconComponent, ScTagComponent, ToggleButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './request-type-filter.component.html',
  styleUrl: './request-type-filter.component.scss',
})
export class RequestTypeFilterComponent {
  readonly state = input.required<RequestTypeFilter>();
  readonly types = input.required<readonly string[]>();
  readonly stateChange = output<RequestTypeFilter>();

  /** El alto de la lista del Figma con seis filas visibles (175 px): el resto, con scroll. */
  protected readonly listHeight = 'var(--sc-spacing-12-5)';
  /** El `p-listbox` sin su marco propio (borde, fondo y sombra): el panel del popover ya es la caja. */
  protected readonly listboxTokens = { root: { borderColor: 'transparent', background: 'transparent', shadow: 'none' } };

  /**
   * El azul de «Agent» marcado en el Figma (#d5e6ff con texto #0a3ba0): la combinación de la etiqueta azul del DS. El
   * ToggleButton del DS no tiene variantes de color (solo el marcado por defecto, el de «AI»), así que esto es una
   * SOBRESCRITURA LOCAL con los tokens de la etiqueta (`--sc-cmp-tag-info-*`); no es una variante del ToggleButton ni
   * viene de sus tokens. El ToggleButton pinta el marcado como borde y fondo de color con una píldora blanca dentro; el Figma
   * pinta la píldora de color sobre fondo gris. El color es el del Figma; la composición, la del componente. Anotado en la auditoría.
   */
  protected readonly agentTokens = {
    root: {
      checkedBackground: 'var(--sc-cmp-tag-info-background)',
      checkedColor: 'var(--sc-cmp-tag-info-color)',
      checkedBorderColor: 'var(--sc-cmp-tag-info-background)',
    },
  };

  /** Popover sin caret, como los desplegables de la fila: el caret se dibuja con `gutter`, y con `0` desaparece. */
  protected readonly popoverTokens = { gutter: '0px' };

  protected readonly open = signal(false);

  /** Al abrir, el foco va al buscador de la lista, como en los demás filtros de la fila. */
  protected onShow(): void {
    this.open.set(true);
    queueMicrotask(() => document.querySelector<HTMLInputElement>('.p-popover .p-listbox-filter')?.focus());
  }
  private readonly listbox = viewChild(Listbox);

  protected readonly active = computed(() => isRequestTypeActive(this.state()));
  protected readonly both = computed(() => this.state().origins.length === ORIGINS.length);

  protected readonly originOptions = computed(() => ORIGINS.map((o) => ({ label: ORIGIN_LABEL[o], value: o })));

  /** `search` lleva el rótulo tal cual y sin tildes, para que el buscador encuentre las dos formas. */
  protected readonly typeOptions = computed(() =>
    this.types().map((t) => ({ label: t, value: t, search: `${t} ${plain(t)}` })),
  );

  protected readonly summary = computed(() => {
    const count = this.state().types.length;
    return `${count} ${count === 1 ? 'type' : 'types'}`;
  });

  protected readonly description = computed(() => {
    if (!this.active()) return 'No filter applied';
    const { origins, types } = this.state();
    const origin = origins.length
      ? `Classified by ${origins.map((o) => ORIGIN_LABEL[o]).join(' AND ')}`
      : 'Any classification origin';
    return `${this.summary()}. ${origin}. ${types.join(', ')}`;
  });

  /** Un origen sin tipos es preparación del panel, no un filtro persistente. */
  protected onClose(): void {
    this.open.set(false);
    this.listbox()?.resetFilter();
    if (!this.active() && this.state().origins.length) this.clear();
  }

  protected isOn(o: RequestOrigin): boolean {
    return this.state().origins.includes(o);
  }

  /** Enciende o apaga un origen. Ninguno encendido = cualquiera de los dos. */
  protected toggleOrigin(o: RequestOrigin, on: boolean): void {
    const current = this.state().origins;
    this.stateChange.emit({ ...this.state(), origins: ORIGINS.filter((x) => (x === o ? on : current.includes(x))) });
  }

  protected onTypes(types: string[] | null): void {
    const picked = types ?? [];
    this.stateChange.emit({ ...this.state(), types: this.types().filter((t) => picked.includes(t)) });
  }

  /** La × del disparador: vuelve al inicio (ningún origen, sin tipos), sin abrir el panel. */
  protected clear(): void {
    this.stateChange.emit(DEFAULT_REQUEST_TYPE_FILTER);
  }
}
