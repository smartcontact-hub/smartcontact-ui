import { ChangeDetectionStrategy, Component, computed, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListboxModule } from 'primeng/listbox';
import { PopoverModule } from 'primeng/popover';
import { ScInputTextComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import type { FilterOption, OptionsTextValue } from './list-filters';

/**
 * Filtro de una opción de una lista corta Y un texto libre, a la vez: el de ID (Todos, Nuevo, Actualizado + el
 * número que se escribe) y el de Productos (Todos, Con servicio activo, Sin servicio activo, Sin servicios + el
 * producto que se escribe). Es la lógica de producción con los componentes del DS: un disparador con la caja de un
 * campo que abre un `p-popover` con un `p-listbox` de una sola opción y un `sc-inputtext`.
 *
 * La primera opción es «sin filtro». Lo escrito filtra en vivo y el panel se queda abierto hasta clicar fuera.
 */
@Component({
  selector: 'app-options-text-filter',
  imports: [FormsModule, ListboxModule, PopoverModule, ScIconComponent, ScInputTextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './options-text-filter.component.html',
  styleUrl: './options-text-filter.component.scss',
})
export class OptionsTextFilterComponent {
  readonly options = input.required<readonly FilterOption[]>();
  readonly value = input<OptionsTextValue | undefined>(undefined);
  readonly textPlaceholder = input('Search');
  /** Lo que dice el campo mientras no hay filtro: una acción, como los otros desplegables de la fila. */
  readonly placeholder = input('Select');
  readonly columnLabel = input.required<string>();
  readonly valueChange = output<OptionsTextValue>();

  /**
   * El `p-listbox` sin su marco: el panel del popover ya es la caja, y el borde, el fondo y la sombra del listbox
   * dibujaban un segundo trazo alrededor de las opciones. Con los tokens del propio componente, no con CSS sobre él.
   */
  protected readonly listboxTokens = { root: { borderColor: 'transparent', background: 'transparent', shadow: 'none' } };

  /**
   * El popover con el mismo borde que los desplegables de la fila: sin caret y pegado al campo. El caret del popover se
   * dibuja con `gutter`; con `0`, desaparece, y el hueco queda como el de un select (0,5 px).
   */
  protected readonly popoverTokens = { gutter: '0px' };

  protected readonly open = signal(false);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  /** Al abrir, el foco va al buscador, como en los demás filtros de la fila. */
  protected onShow(): void {
    this.open.set(true);
    queueMicrotask(() => this.panel()?.nativeElement.querySelector('input')?.focus());
  }

  private readonly neutral = computed<OptionsTextValue>(() => ({ mode: this.options()[0]?.value ?? '', text: '' }));
  protected readonly state = computed(() => this.value() ?? this.neutral());
  protected readonly active = computed(
    () => this.state().mode !== this.neutral().mode || this.state().text.trim() !== '',
  );

  /** Lo que enseña el disparador: lo escrito, o la opción elegida. */
  protected readonly summary = computed(() => {
    const { mode, text } = this.state();
    const label = this.options().find((o) => o.value === mode)?.label ?? '';
    const typed = text.trim();
    return mode === this.neutral().mode ? typed : typed ? `${label}: ${typed}` : label;
  });

  protected setMode(mode: string | null): void {
    // Pulsar la opción ya elegida la deja como está: siempre hay una (la primera es «sin filtro»).
    this.valueChange.emit({ ...this.state(), mode: mode ?? this.neutral().mode });
  }

  protected setText(text: string): void {
    this.valueChange.emit({ ...this.state(), text });
  }

  protected clear(): void {
    this.valueChange.emit(this.neutral());
  }
}
