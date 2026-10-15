import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ProgressBarModule } from 'primeng/progressbar';

import { ScProgressBarMode } from '../../core/types/theme-component.types';

@Component({
    selector: 'sc-progressbar',
    standalone: true,
    imports: [ProgressBarModule],
    templateUrl: './sc-progressbar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScProgressBarComponent {
    readonly value = input<number | null>(null);

    readonly showValue = input(true, { transform: booleanAttribute });

    readonly unit = input('%');

    readonly mode = input<ScProgressBarMode>('determinate');

    /**
     * Nombre accesible de la barra (WCAG 4.1.2): qué progreso mide ("Subida del fichero"). Sin él, el lector de
     * pantalla anuncia "barra de progreso" a secas. Si ya hay un texto visible que la nombra, `ariaLabelledBy`.
     */
    readonly ariaLabel = input<string | null>(null);

    /** El id de un texto visible que nombra la barra; tiene prioridad sobre `ariaLabel`. */
    readonly ariaLabelledBy = input<string | null>(null);
}
