import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
    selector: 'sc-progressspinner',
    standalone: true,
    imports: [ProgressSpinnerModule],
    templateUrl: './sc-progressspinner.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScProgressSpinnerComponent {
    @Input() strokeWidth = '2';

    @Input() fill = 'transparent';

    @Input() animationDuration = '2s';

    @Input() ariaLabel = 'Cargando';
}
