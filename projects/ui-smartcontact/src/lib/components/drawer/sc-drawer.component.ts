import { booleanAttribute, ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';

import { ScOverlayPosition } from '../../core/types/theme-component.types';

@Component({
    selector: 'sc-drawer',
    standalone: true,
    imports: [DrawerModule],
    templateUrl: './sc-drawer.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScDrawerComponent {
    /**
     * `model()` sustituye al trío `@Input() visible` + `@Output() visibleChange`
     * + `onVisibleChange()`, que existía solo para escribir el input desde
     * dentro y re-emitirlo. Un `model` hace las tres cosas, y de paso quita un
     * método que asignaba a un `@Input` — algo que la era de señales prohíbe.
     */
    readonly visible = model(false);

    readonly header = input<string | null>(null);

    readonly position = input<ScOverlayPosition>('left');

    readonly modal = input(true, { transform: booleanAttribute });

    readonly dismissible = input(true, { transform: booleanAttribute });

    readonly closeOnEscape = input(true, { transform: booleanAttribute });

    readonly showCloseIcon = input(true, { transform: booleanAttribute });

    readonly fullScreen = input(false, { transform: booleanAttribute });

    /**
     * Ancho del panel en `left`/`right` (p. ej. `'44rem'`). Sin él manda el de PrimeNG (20rem),
     * que no deja sitio a una tabla ni a un formulario de dos columnas. Mismo contrato que
     * `sc-dialog [width]`.
     */
    readonly width = input<string | null>(null);

    readonly shown = output<unknown>();

    readonly hidden = output<unknown>();
}
