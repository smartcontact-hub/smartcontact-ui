import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

/**
 * Hueco libre de una caja, con las dos acciones del original: añadir un widget (abre el asistente,
 * que solo ofrece tipos de este tamaño) y dividir la caja en cuatro huecos o juntarlos en uno.
 *
 * `splitAction`: `split` en un hueco grande, `gather` en uno pequeño cuando toda su caja está
 * vacía, `null` cuando la caja tiene widgets (el original lo deshabilita en ese caso).
 */
@Component({
  selector: 'sc-dashboard-empty-slot',
  imports: [TranslateModule, ButtonComponent],
  templateUrl: './empty-slot.component.html',
  styleUrl: './empty-slot.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptySlotComponent {
  readonly splitAction = input<'split' | 'gather' | null>(null);

  readonly add = output<void>();
  readonly split = output<void>();
  readonly gather = output<void>();
}
