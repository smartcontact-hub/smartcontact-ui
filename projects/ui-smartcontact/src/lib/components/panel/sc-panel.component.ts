import { booleanAttribute, ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { PanelModule } from 'primeng/panel';

@Component({
    selector: 'sc-panel',
    standalone: true,
    imports: [PanelModule],
    templateUrl: './sc-panel.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
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

    readonly beforeToggle = output<unknown>();

    readonly afterToggle = output<unknown>();
}
