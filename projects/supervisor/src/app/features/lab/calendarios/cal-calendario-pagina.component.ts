import { ChangeDetectionStrategy, Component, inject, type TemplateRef, viewChild } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { ScButtonComponent } from '@smartcontact-hub/components';

import { type DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { CalBorrador } from './cal-borrador';
import { CalCalendarioAComponent } from './cal-calendario-a.component';
import { CalCalendarioBComponent } from './cal-calendario-b.component';
import { CalPruebaService } from './cal-prueba.service';

/**
 * PROTOTIPO DE DISCOVERY: la página de un calendario. Según la variante de la prueba enseña A (separado: formularios
 * por piezas y el año para comprobar) o B (junto: el año es donde se trabaja, con un panel al lado). «Guardar» es el
 * mismo en las dos.
 */
@Component({
  selector: 'sc-cal-calendario-pagina',
  imports: [CalCalendarioAComponent, CalCalendarioBComponent, ScButtonComponent, TooltipModule],
  providers: [CalBorrador],
  template: `
    <ng-template #acciones>
      @if (borrador.dirty() && !borrador.esNuevo()) {
        <span class="form-save-reason sc-text-caption-regular" role="status">Cambios sin guardar</span>
      }
      <sc-button
        variant="primary"
        [disabled]="!!borrador.motivo()"
        [pTooltip]="borrador.motivo() ?? ''" tooltipPosition="bottom" tooltipEvent="both"
        [label]="borrador.esNuevo() ? 'Crear calendario' : 'Guardar'"
        (clicked)="borrador.guardar()"
      />
    </ng-template>

    @if (prueba.variante() === 'A') {
      <sc-cal-calendario-a />
    } @else {
      <sc-cal-calendario-b />
    }
  `,
  styles: `:host { display: block; height: 100%; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalCalendarioPaginaComponent implements DirtyAware {
  protected readonly borrador = inject(CalBorrador);
  protected readonly prueba = inject(CalPruebaService);
  private readonly acciones = viewChild<TemplateRef<unknown>>('acciones');
  readonly formDirty = this.borrador.dirty;

  constructor() {
    useTopbarActions(this.acciones);
  }
}
