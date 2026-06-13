import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

import { ScButtonComponent } from '../../../../../../ui-smartcontact/src/public-api';

/**
 * Contenido arbitrario abierto al vuelo por ScDynamicDialogService. Se cierra
 * a sí mismo con el `DynamicDialogRef` que PrimeNG inyecta en el componente
 * cargado (el wrapper ScDynamicDialogRef es el handle del LLAMADOR).
 */
@Component({
  selector: 'app-dynamic-content',
  imports: [ScButtonComponent],
  template: `
    <p data-testid="dyn-content">Contenido cargado dinámicamente.</p>
    <sc-button label="Cerrar con resultado" data-testid="dyn-close" (clicked)="ref.close('ok')" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicContentComponent {
  readonly ref = inject(DynamicDialogRef);
}
