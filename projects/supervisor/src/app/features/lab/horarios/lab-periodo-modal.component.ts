import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  ScButtonComponent,
  ScColorDotPickerComponent,
  ScCustomModalComponent,
  ScCustomModalFooterDirective,
  ScDatepickerComponent,
  ScInputTextComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { TooltipModule } from 'primeng/tooltip';

import { HorarioPeriodoModalComponent } from '@features/admin/repositories/components/horario/horario-periodo-modal.component';

import { LabSemanaComponent } from './lab-semana.component';

/**
 * LABORATORIO: el diálogo de periodo de siempre, con la semana por tramos del laboratorio en vez de siete filas. Hereda
 * toda la lógica del de producción y solo cambia la plantilla: así el periodo se edita igual que la semana habitual.
 */
@Component({
  selector: 'sc-lab-periodo-modal',
  imports: [
    LabSemanaComponent,
    ScButtonComponent,
    ScColorDotPickerComponent,
    ScCustomModalComponent,
    ScCustomModalFooterDirective,
    ScDatepickerComponent,
    ScInputTextComponent,
    ScToggleSwitchComponent,
    TooltipModule,
    TranslateModule,
  ],
  templateUrl: './lab-periodo-modal.component.html',
  styleUrls: ['../../admin/repositories/components/horario/horario-modal.scss'],
  styles: `.periodo__error { margin: 0; color: var(--sc-text-danger); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabPeriodoModalComponent extends HorarioPeriodoModalComponent {
  protected readonly dias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
}
