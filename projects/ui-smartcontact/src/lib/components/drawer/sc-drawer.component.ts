import {
    afterNextRender,
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    computed,
    DOCUMENT,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    model,
    output,
    untracked,
} from '@angular/core';
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
     * ACOPLADO: un panel de la página, no una capa encima (el panel lateral de GitHub). Para un cajón sin máscara que
     * convive con lo que tiene al lado sin taparlo (el hub de Repositorios, DD-179): sin sombra, porque no flota, con el
     * borde en su filo interior y la esquina interior de arriba redondeada con el radio de tarjeta (`--sc-radius-xl`).
     * Va con `topOffset` (la barra de la app): sin él, la esquina redondeada queda contra el borde de la ventana.
     */
    readonly docked = input(false, { transform: booleanAttribute });
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
            if (this.docked()) {
                // Acoplado: el filo interior y su esquina de arriba redondeada. Ni sombra (tampoco la del tema, que cae
                // hacia abajo como la de un diálogo) ni recorte.
                style[side === 'right' ? 'border-start-start-radius' : 'border-start-end-radius'] = 'var(--sc-radius-xl)';
                style['box-shadow'] = 'none';
            } else {
                style['box-shadow'] =
                    `${toward}8px 0 10px -6px rgb(var(--sc-shadow-color-rgb) / 0.1), ` +
                    `${toward}20px 0 25px -5px rgb(var(--sc-shadow-color-rgb) / 0.1)`;
                style['clip-path'] = side === 'right' ? 'inset(0 0 0 -3rem)' : 'inset(0 -3rem 0 0)';
            }
        }
        return Object.keys(style).length > 0 ? style : undefined;
    });

    /** El panel lateral ha terminado de abrirse. */
    readonly shown = output<unknown>();

    /** Ha terminado de cerrarse. Es el momento seguro para liberar lo que tuviera dentro. */
    readonly hidden = output<unknown>();

    /**
     * MODAL, EL CAJÓN ES UN DIÁLOGO (WCAG 2.4.3 y 4.1.2, 2026-10-05). `p-drawer` lo pinta como `complementary`, deja el
     * foco donde estaba y no lo devuelve al cerrar: medido en el panel de agentes, que lo devolvía a mano (DD-168), el
     * foco se quedaba en el botón que lo abría, FUERA del panel, y Escape no lo cerraba sin tabular antes. Ahora, modal:
     *   · se anuncia como diálogo, con su título por nombre (`pt` al nodo raíz, que es el que lleva el rol);
     *   · al abrirse, lleva el foco al primer control de su contenido;
     *   · al cerrarse, lo devuelve a quien lo tenía al abrir, si sigue en la página y el foco no se ha ido a otra
     *     parte. Se mira `visible` y no `onHide`: PrimeNG solo emite `onHide` cuando cierra él (la X, la máscara,
     *     Escape), no cuando lo cierra el padre, que es como se cierra el panel de agentes (medido el 2026-10-05).
     * Sin modal sigue siendo `complementary`: convive con la página y no se lleva el foco.
     */
    protected readonly drawerPt = computed(() =>
        this.modal() ? { root: { role: 'dialog', 'aria-modal': 'true', 'aria-label': this.header() || null } } : undefined,
    );

    private readonly document = inject(DOCUMENT);
    private readonly injector = inject(Injector);
    private readonly hostEl = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    /** Quien tenía el foco al abrir. */
    private opener: HTMLElement | null = null;

    protected onShow(event: unknown): void {
        if (this.modal()) {
            const control = this.hostEl.querySelector<HTMLElement>(
                '.p-drawer-content :is(button, [href], input, select, textarea, [tabindex]):not([disabled]):not([tabindex="-1"])',
            );
            control?.focus();
        }
        this.shown.emit(event);
    }

    /** Al cerrarse, cuando el contenido ya se ha ido: el foco que estaba dentro cae en `<body>`. */
    private devolverFoco(): void {
        const opener = this.opener;
        this.opener = null;
        if (!opener || !this.modal()) return;
        afterNextRender(
            () => {
                const active = this.document.activeElement;
                const focoSuelto = !active || active === this.document.body || this.hostEl.contains(active);
                if (opener.isConnected && focoSuelto) opener.focus();
            },
            { injector: this.injector },
        );
    }

    constructor() {
        // Copy fijo colocado: registra solo el diccionario del componente (el nombre de la X).
        const translate = inject(TranslateService);
        for (const [language, dict] of Object.entries(SC_DRAWER_TRANSLATIONS)) {
            translate.setTranslation(language, dict, true);
        }
        // Al abrirse, quién tenía el foco (todavía no se ha movido); al cerrarse, se le devuelve.
        effect(() => {
            const abierto = this.visible();
            untracked(() => {
                if (!abierto) return this.devolverFoco();
                const active = this.document.activeElement;
                this.opener = active instanceof HTMLElement && active !== this.document.body ? active : null;
            });
        });
    }
}
