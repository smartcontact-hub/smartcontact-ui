import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input, model, output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DrawerModule } from 'primeng/drawer';

import { ScOverlayPosition } from '../../core/types/theme-component.types';

import { SC_DRAWER_TRANSLATIONS } from './i18n/sc-drawer.translations';

@Component({
    selector: 'sc-drawer',
    standalone: true,
    imports: [DrawerModule, TranslateModule],
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

    /**
     * Cuánto baja el panel desde arriba en `left`/`right` (p. ej. `'var(--sc-spacing-4)'`, la barra
     * de la app). Sin él ocupa toda la altura y tapa lo que haya arriba: la barra con Guardar, la
     * miga. El alto se descuenta solo.
     */
    readonly topOffset = input<string | null>(null);

    /** El estilo en línea del panel: solo lo que se ha pedido, para no pisar el de PrimeNG. */
    protected readonly panelStyle = computed(() => {
        const style: Record<string, string> = {};
        const width = this.width();
        const top = this.topOffset();
        if (width) style['width'] = width;
        if (top) {
            style['top'] = top;
            style['height'] = `calc(100% - ${top})`;
        }
        return Object.keys(style).length > 0 ? style : undefined;
    });

    readonly shown = output<unknown>();

    readonly hidden = output<unknown>();

    constructor() {
        // Copy fijo colocado: registra solo el diccionario del componente (el nombre de la X).
        const translate = inject(TranslateService);
        for (const [language, dict] of Object.entries(SC_DRAWER_TRANSLATIONS)) {
            translate.setTranslation(language, dict, true);
        }
    }
}
