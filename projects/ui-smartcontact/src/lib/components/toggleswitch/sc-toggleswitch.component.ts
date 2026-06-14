import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { ScComponentSize } from '../../core/types/theme-component.types';

let toggleIdCounter = 0;

/**
 * Accessible toggle switch. Wrapper Extended sobre `<p-toggleswitch>` —
 * heredamos keyboard support (Space toggles, Tab focuses), screen-reader
 * semantics (`role="switch"`), form association y validación nativas.
 *
 * API pública estable del catálogo de diseño: `[checked]`, `[disabled]`,
 * `[ariaLabel]`, `[ariaLabelledBy]`, `(checkedChange)`. Fusión Mitad B
 * (lote 3): se suma del catálogo de desarrollo `size` (sm/md/lg) y `readonly`
 * (interacción bloqueada sin el look disabled). `checked` se relaja a opcional
 * (default false) para no obligar a fijarlo en cada uso.
 *
 * Bind el `id` de un label externo via `[ariaLabelledBy]` cuando el toggle
 * está pareado con texto descriptivo al lado (form-row pattern: label +
 * helper viven aparte, no envolviendo).
 *
 * Figma reference: `❖ ToggleSwitch` (node 6738:22645) del Smart Contact Prime
 * kit. Wrapper sobre `<p-toggleswitch>` para heredar keyboard support (Space
 * toggles, Tab focuses), `role="switch"` y form association nativas.
 */
@Component({
  selector: 'sc-toggleswitch',
  standalone: true,
  imports: [FormsModule, ToggleSwitchModule],
  templateUrl: './sc-toggleswitch.component.html',
  styleUrl: './sc-toggleswitch.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScToggleSwitchComponent {
  readonly checked = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Bloquea la interacción sin pintar el estado disabled (del catálogo de desarrollo). */
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly size = input<ScComponentSize>('md');
  readonly ariaLabel = input<string | null>(null);
  readonly ariaLabelledBy = input<string | null>(null);
  /**
   * Override del id interno del `<input>` real renderizado por PrimeNG. Útil
   * cuando un `<label for="X">` externo necesita enlazar el toggle para
   * click-to-toggle. Si se omite, el wrapper genera id único `sc-toggle-N`
   * (default a11y safe).
   */
  readonly inputId = input<string | null>(null);

  readonly checkedChange = output<boolean>();
  /** Evento nativo de PrimeNG (`onChange`) expuesto para casos avanzados
   * (paridad con el catálogo de desarrollo). */
  readonly changed = output<unknown>();

  private readonly internalInputId = `sc-toggle-${++toggleIdCounter}`;
  protected readonly effectiveInputId = (): string => this.inputId() ?? this.internalInputId;

  /** Mapea sm/md/lg a la prop `size` de PrimeNG (md = sin atributo). */
  protected readonly pSize = computed<'small' | 'large' | undefined>(() => {
    const s = this.size();
    return s === 'sm' ? 'small' : s === 'lg' ? 'large' : undefined;
  });

  protected onChange(value: boolean): void {
    if (this.readonly()) return;
    this.checkedChange.emit(value);
  }
}
