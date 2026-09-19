import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    contentChild,
    input,
    model,
    output,
    TemplateRef,
    ViewEncapsulation
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { PanelModule } from 'primeng/panel';

/** Aviso del panel: pinta el borde, y un anillo de 1 del mismo color, en el rol de estado. */
export type ScPanelSeverity = 'warn' | 'danger';

/** Contexto de `<ng-template #header>`: el id que debe llevar el título para que nombre la región del cuerpo. */
export interface ScPanelHeaderContext {
    $implicit: string;
    titleId: string;
}

let scPanelIdSeq = 0;

@Component({
    selector: 'sc-panel',
    standalone: true,
    imports: [PanelModule, NgTemplateOutlet],
    templateUrl: './sc-panel.component.html',
    styleUrl: './sc-panel.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    host: {
        class: 'sc-panel',
        '[class.sc-panel--fill]': 'fill()',
        '[class.sc-panel--warn]': "severity() === 'warn'",
        '[class.sc-panel--danger]': "severity() === 'danger'"
    }
})
export class ScPanelComponent {
    readonly header = input<string | null>(null);

    readonly toggleable = input(false, { transform: booleanAttribute });

    /**
     * `model()` y no `input()` + `output()` a mano: el par `collapsed` /
     * `collapsedChange` ES un doble binding, y en la era de señales eso se
     * declara una sola vez. El contrato de plantilla no cambia — `[collapsed]`
     * a secas y `[(collapsed)]` siguen escribiéndose igual.
     */
    readonly collapsed = model(false);

    readonly showHeader = input(true, { transform: booleanAttribute });

    /**
     * El panel ocupa el alto de su contenedor y el cuerpo se estira con él, para que dentro quepa una
     * tabla con `scrollHeight="flex"` o una rejilla que reparte el alto (las tarjetas del Dashboard).
     * Pensado para paneles fijos: con `toggleable`, al colapsar el hueco se queda.
     */
    readonly fill = input(false, { transform: booleanAttribute });

    /**
     * Panel en aviso: borde y anillo de 1 en `--sc-border-warning` o `--sc-border-danger`. El motivo lo dice
     * el contenido (una etiqueta en la cabecera); el borde solo lo hace visible de lejos. Decidido en código
     * (DD-109); Figma lo recoge en `docs/figma-pendiente.md`.
     */
    readonly severity = input<ScPanelSeverity | null>(null);

    /** El panel va a plegarse o desplegarse, ANTES de la animación. */
    readonly beforeToggle = output<unknown>();

    /**
     * El panel ya ha terminado de plegarse o desplegarse. Es el momento en el que su alto es el
     * definitivo.
     */
    readonly afterToggle = output<unknown>();

    /**
     * Acciones de la cabecera, a la derecha del título: `<ng-template #icons>`. Es la plantilla `icons` de
     * Panel en primeng.dev, y en Figma la variante `Custom Icon=True` de `panel` (`229:10217`). Se pinta
     * delante del botón de colapsar si lo hay.
     */
    protected readonly iconsTemplate = contentChild<TemplateRef<unknown>>('icons');

    /**
     * Cabecera propia: `<ng-template #header let-titleId>` (plantilla `header` de Panel en primeng.dev). Para
     * un título que es encabezado de verdad (`h2`, `h3`) o que lleva una línea debajo. Pon `[id]="titleId"` en
     * el título: es el id al que apunta el `aria-labelledby` de la región del cuerpo.
     */
    protected readonly headerTemplate = contentChild<TemplateRef<ScPanelHeaderContext>>('header');

    /* En la plantilla, `#header` (el nombre que busca `p-panel`) tapa al input `header`: se lee por aquí. */
    protected readonly headerText = this.header;

    /* Id propio y estable para `p-panel`: su título se llama `<id>_header`, y así el consumidor lo conoce. */
    protected readonly panelId = `sc-panel-${++scPanelIdSeq}`;
    protected readonly headerContext: ScPanelHeaderContext = {
        $implicit: `${this.panelId}_header`,
        titleId: `${this.panelId}_header`
    };

    /* Clases propias en las piezas de dentro por `pt` (la vía pública de PrimeNG): `fill` y `severity` se
     * estilan sobre ellas y no sobre `.p-panel-*`, que no es API y cuenta en `audit:primeng-coupling`. */
    protected readonly pt = {
        root: { class: 'sc-panel__root' },
        contentContainer: { class: 'sc-panel__body' },
        contentWrapper: { class: 'sc-panel__wrapper' },
        content: { class: 'sc-panel__content' }
    };
}
