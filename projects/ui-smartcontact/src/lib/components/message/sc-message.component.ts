import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MessageModule } from 'primeng/message';

import { resolveScComponentIconClass } from '../../core/icons/sc-component-icon-resolver';
import { ScComponentSize, ScSeverity } from '../../core/types/theme-component.types';

type PrimeMessageSeverity = 'secondary' | 'success' | 'info' | 'warn' | 'error' | 'contrast' | undefined;
type PrimeMessageSize = 'small' | 'large' | undefined;

@Component({
    selector: 'sc-message',
    standalone: true,
    imports: [MessageModule],
    templateUrl: './sc-message.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScMessageComponent {
    readonly text = input<string | null>(null);

    readonly severity = input<ScSeverity>('info');

    readonly closable = input(false, { transform: booleanAttribute });

    readonly icon = input<string | null>(null);

    readonly size = input<ScComponentSize>('md');

    readonly variant = input<'simple' | 'outlined' | 'text'>('simple');

    readonly closed = output<unknown>();

    protected readonly messageSeverity = computed<PrimeMessageSeverity>(() => {
        const severity = this.severity();

        if (severity === 'primary') {
            return undefined;
        }

        if (severity === 'warning') {
            return 'warn';
        }

        if (severity === 'danger') {
            return 'error';
        }

        return severity;
    });

    protected readonly messageSize = computed<PrimeMessageSize>(() => {
        const size = this.size();

        if (size === 'sm') {
            return 'small';
        }

        if (size === 'lg') {
            return 'large';
        }

        return undefined;
    });

    protected readonly messageIcon = computed<string | undefined>(() =>
        resolveScComponentIconClass(this.icon())
    );
}
