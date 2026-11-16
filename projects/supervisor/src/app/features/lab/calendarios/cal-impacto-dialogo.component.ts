import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ScButtonComponent, ScCustomModalComponent, ScCustomModalFooterDirective, ScRadioButtonComponent } from '@smartcontact-hub/components';

import type { Calendario } from './cal-modelo';

/**
 * PROTOTIPO DE DISCOVERY: antes de guardar un horario que usan varios calendarios, a cuáles afecta. Si se llega desde
 * un calendario, deja elegir: en todos, o solo en ese (se guarda como una copia y ese calendario pasa a usarla).
 */
@Component({
  selector: 'sc-cal-impacto-dialogo',
  imports: [ScButtonComponent, ScCustomModalComponent, ScCustomModalFooterDirective, ScRadioButtonComponent],
  template: `
    <sc-custom-modal [visible]="true" width="34rem" [title]="titulo()" (closed)="cancelado.emit()">
      <div class="impacto">
        <p class="sc-text-body-regular">Se usa en: {{ nombres() }}.</p>
        @if (desde(); as d) {
          <div class="opciones" role="radiogroup" aria-label="Dónde se aplica el cambio">
            <label class="radio sc-text-body-regular">
              <sc-radiobutton inputId="impacto-todos" name="impacto" [value]="'todos'" [modelValue]="eleccion()" (modelValueChange)="eleccion.set($any($event))" />
              <span>Cambiarlo en los {{ usos().length }} calendarios</span>
            </label>
            <label class="radio sc-text-body-regular">
              <sc-radiobutton inputId="impacto-solo" name="impacto" [value]="'solo'" [modelValue]="eleccion()" (modelValueChange)="eleccion.set($any($event))" />
              <span>Solo en «{{ d.nombre }}» (se guarda como una copia)</span>
            </label>
          </div>
        } @else {
          <p class="sc-text-body-regular">El cambio vale para todos ellos.</p>
        }
      </div>
      <div scCustomModalFooter class="pie">
        <sc-button size="sm" variant="secondary" appearance="outlined" label="Cancelar" (clicked)="cancelado.emit()" />
        <sc-button size="sm" variant="primary" label="Guardar" (clicked)="elegido.emit(desde() ? eleccion() : 'todos')" />
      </div>
    </sc-custom-modal>
  `,
  styles: `
    .impacto { display: flex; flex-direction: column; gap: var(--sc-spacing-1); }
    .impacto p { margin: 0; }
    .opciones { display: flex; flex-direction: column; gap: var(--sc-spacing-0-75); }
    .pie { display: flex; gap: var(--sc-spacing-0-5); justify-content: flex-end; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalImpactoDialogoComponent {
  readonly nombreHorario = input.required<string>();
  readonly usos = input.required<readonly Calendario[]>();
  /** El calendario desde el que se edita, si lo hay. */
  readonly desde = input<Calendario | null>(null);
  readonly elegido = output<'todos' | 'solo'>();
  readonly cancelado = output<void>();

  protected readonly eleccion = signal<'todos' | 'solo'>('todos');
  protected readonly titulo = computed(() => `«${this.nombreHorario()}» se usa en ${this.usos().length} calendarios`);
  protected readonly nombres = computed(() => this.usos().map((c) => c.nombre).join(', '));
}
