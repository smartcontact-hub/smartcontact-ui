import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'sc-card',
    standalone: true,
    imports: [CardModule],
    templateUrl: './sc-card.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScCardComponent {
    @Input() header: string | null = null;

    @Input() subheader: string | null = null;
}
