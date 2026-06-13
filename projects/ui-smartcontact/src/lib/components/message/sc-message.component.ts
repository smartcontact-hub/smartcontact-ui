import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
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
    @Input() text: string | null = null;

    @Input() severity: ScSeverity = 'info';

    @Input() closable = false;

    @Input() icon: string | null = null;

    @Input() size: ScComponentSize = 'md';

    @Input() variant: 'simple' | 'outlined' | 'text' = 'simple';

    @Output() closed = new EventEmitter<unknown>();

    protected get messageSeverity(): PrimeMessageSeverity {
        if (this.severity === 'primary') {
            return undefined;
        }

        if (this.severity === 'warning') {
            return 'warn';
        }

        if (this.severity === 'danger') {
            return 'error';
        }

        return this.severity;
    }

    protected get messageSize(): PrimeMessageSize {
        if (this.size === 'sm') {
            return 'small';
        }

        if (this.size === 'lg') {
            return 'large';
        }

        return undefined;
    }

    protected get messageIcon(): string | undefined {
        return resolveScComponentIconClass(this.icon);
    }
}
