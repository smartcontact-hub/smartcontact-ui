import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MessageModule } from 'primeng/message';

import { resolveScComponentIconClass } from '../../core/icons/sc-component-icon-resolver';
import { ScComponentSize, ScSeverity } from '../../core/types/theme-component.types';

/* Sin `undefined` desde PrimeNG 22: allí `severity` es obligatorio (`input('info')`).
 * Antes, `undefined` significaba "sin modificador de severidad" y `primary` caía ahí. */
type PrimeMessageSeverity = 'secondary' | 'success' | 'info' | 'warn' | 'error' | 'contrast';
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

        /* `primary` NO es una severidad de mensaje en PrimeNG y nunca lo fue: antes caía
         * en `undefined` y renderizaba el mensaje base, sin modificador. Desde v22
         * `severity` es obligatorio, así que se mapea al neutro más cercano.
         * Verificado el 2026-08-24: NADIE pasa `severity="primary"` a `<sc-message>` en
         * todo el repo, así que esto no cambia ningún píxel hoy — es solo cerrar el
         * hueco del tipo. */
        if (severity === 'primary') {
            return 'secondary';
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
