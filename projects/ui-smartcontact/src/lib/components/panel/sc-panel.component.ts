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
        '[class.sc-panel--fill]': 'fill()'
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

    readonly beforeToggle = output<unknown>();

    readonly afterToggle = output<unknown>();

    /**
     * Acciones de la cabecera, a la derecha del título: `<ng-template #icons>`. Es la plantilla `icons` de
     * Panel en primeng.dev, y en Figma la variante `Custom Icon=True` de `panel` (`229:10217`). Se pinta
     * delante del botón de colapsar si lo hay.
     */
    protected readonly iconsTemplate = contentChild<TemplateRef<unknown>>('icons');

    /* Clases propias en las piezas de dentro por `pt` (la vía pública de PrimeNG): `fill` se estila sobre
     * ellas y no sobre `.p-panel-*`, que no es API y cuenta en `audit:primeng-coupling`. */
    protected readonly pt = {
        root: { class: 'sc-panel__root' },
        contentContainer: { class: 'sc-panel__body' },
        contentWrapper: { class: 'sc-panel__wrapper' },
        content: { class: 'sc-panel__content' }
    };
}
