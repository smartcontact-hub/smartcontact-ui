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

    /**
     * El estilo en línea del panel.
     *
     * En `left`/`right`, además de ancho y alto, dos arreglos de piel (2026-09-15, medidos en el
     * Supervisor):
     *   · BORDES. PrimeNG declara `border-style: solid` y solo da ancho al filo interior; los otros
     *     tres se quedaban con el ancho por defecto del navegador (`medium`, 3px). Bajo la barra de
     *     la app eso pintaba una franja gris de 4px encima del panel. Solo queda el filo interior.
     *   · SOMBRA. La del Kit (`--sc-cmp-drawer-shadow`) cae hacia ABAJO, como la de un diálogo; en un
     *     panel lateral apenas asomaba por el filo. Aquí va con las MISMAS medidas del Kit, giradas
     *     hacia el lado por el que entra el panel, y con el color de sombra del DS. Se recorta por
     *     arriba, por abajo y por fuera (`clip-path`): sin desplazamiento vertical, su desenfoque
     *     subía sobre la barra de la app y ensuciaba su línea. El margen del recorte (3rem) cubre
     *     todo lo que alcanza la sombra hacia dentro (20px + 25px de desenfoque − 5px).
     */
    protected readonly panelStyle = computed(() => {
        const style: Record<string, string> = {};
        const width = this.width();
        const top = this.topOffset();
        const side = this.position();
        if (width) style['width'] = width;
        if (top) {
            style['top'] = top;
            style['height'] = `calc(100% - ${top})`;
        }
        if (!this.fullScreen() && (side === 'left' || side === 'right')) {
            const toward = side === 'right' ? '-' : '';
            style['border-block-width'] = '0';
            style[side === 'right' ? 'border-inline-end-width' : 'border-inline-start-width'] = '0';
            style['box-shadow'] =
                `${toward}8px 0 10px -6px rgb(var(--sc-shadow-color-rgb) / 0.1), ` +
                `${toward}20px 0 25px -5px rgb(var(--sc-shadow-color-rgb) / 0.1)`;
            style['clip-path'] = side === 'right' ? 'inset(0 0 0 -3rem)' : 'inset(0 -3rem 0 0)';
        }
        return Object.keys(style).length > 0 ? style : undefined;
    });

    /** El panel lateral ha terminado de abrirse. */
    readonly shown = output<unknown>();

    /** Ha terminado de cerrarse. Es el momento seguro para liberar lo que tuviera dentro. */
    readonly hidden = output<unknown>();

    constructor() {
        // Copy fijo colocado: registra solo el diccionario del componente (el nombre de la X).
        const translate = inject(TranslateService);
        for (const [language, dict] of Object.entries(SC_DRAWER_TRANSLATIONS)) {
            translate.setTranslation(language, dict, true);
        }
    }
}
