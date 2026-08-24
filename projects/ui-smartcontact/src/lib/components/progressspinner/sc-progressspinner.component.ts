import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
    selector: 'sc-progressspinner',
    standalone: true,
    imports: [ProgressSpinnerModule],
    templateUrl: './sc-progressspinner.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScProgressSpinnerComponent {
    readonly strokeWidth = input('2');

    readonly fill = input('transparent');

    readonly animationDuration = input('2s');

    readonly ariaLabel = input('Cargando');
}
