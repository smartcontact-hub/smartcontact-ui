import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    output
} from '@angular/core';
import { ButtonModule } from 'primeng/button';

import { resolveScComponentIconClass } from '../../core/icons/sc-component-icon-resolver';
import {
    ScButtonAppearance,
    ScButtonIconPosition,
    ScButtonIconSize,
    ScButtonSize,
    ScButtonType,
    ScButtonVariant
} from '../../core/types/button.types';

type PrimeButtonSeverity = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast';
type PrimeButtonSize = 'small' | 'large' | undefined;

/**
 * Wrapper de `<p-button>` y **componente de referencia de la era de señales**
 * (DD-38): `AGENTS.md` manda inspeccionarlo antes de generar nada, así que lo
 * que declara aquí se copia. API pública `input()/output()`, booleanos con
 * `booleanAttribute` y estado derivado en `computed()`, nunca en getters.
 *
 * El contrato de plantilla no cambió al migrar: `[label]="x"` y `(clicked)`
 * se escriben igual en las dos eras. Lo que cambia es solo la lectura interna
 * (`this.label()`), que es privada del componente.
 */
@Component({
    selector: 'sc-button',
    standalone: true,
    imports: [ButtonModule],
    templateUrl: './sc-button.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScButtonComponent {
    readonly label = input('');

    readonly variant = input<ScButtonVariant>('primary');

    readonly appearance = input<ScButtonAppearance>('filled');

    readonly size = input<ScButtonSize>('md');

    readonly disabled = input(false, { transform: booleanAttribute });

    readonly loading = input(false, { transform: booleanAttribute });

    readonly fullWidth = input(false, { transform: booleanAttribute });

    readonly type = input<ScButtonType>('button');

    readonly icon = input<string | null>(null);

    readonly iconPosition = input<ScButtonIconPosition>('left');

    readonly iconSize = input<ScButtonIconSize | null>(null);

    readonly iconFilled = input(false, { transform: booleanAttribute });

    readonly iconAriaLabel = input<string | null>(null);

    readonly ariaLabel = input<string | null>(null);

    readonly rounded = input(false, { transform: booleanAttribute });

    readonly clicked = output<MouseEvent>();

    protected readonly isInteractionDisabled = computed(() => this.disabled() || this.loading());

    protected readonly buttonSeverity = computed<PrimeButtonSeverity>(() => this.variant());

    protected readonly buttonSize = computed<PrimeButtonSize>(() => {
        const size = this.size();

        if (size === 'sm') {
            return 'small';
        }

        if (size === 'lg') {
            return 'large';
        }

        return undefined;
    });

    protected readonly outlined = computed(() => this.appearance() === 'outlined');

    protected readonly text = computed(() => this.appearance() === 'text');

    protected readonly link = computed(() => this.appearance() === 'link');

    protected readonly buttonIcon = computed(() =>
        resolveScComponentIconClass(this.icon(), {
            filled: this.iconFilled(),
            size: this.iconSize()
        })
    );

    protected readonly iconAccessibleLabel = computed<string | null>(
        () => this.iconAriaLabel()?.trim() || null
    );

    protected readonly buttonAriaLabel = computed<string | undefined>(() => {
        const ariaLabel = this.ariaLabel()?.trim();

        if (ariaLabel) {
            return ariaLabel;
        }

        if (!this.label().trim()) {
            return this.iconAccessibleLabel() ?? undefined;
        }

        return undefined;
    });

    protected readonly iconAriaHidden = computed<'true' | null>(() =>
        this.iconAccessibleLabel() ? null : 'true'
    );

    protected readonly iconRole = computed<'img' | null>(() =>
        this.iconAccessibleLabel() ? 'img' : null
    );

    protected buttonIconClass(iconClass: string, buttonIcon: string): string {
        return [iconClass, buttonIcon].filter(Boolean).join(' ');
    }

    protected onClick(event: MouseEvent): void {
        if (this.isInteractionDisabled()) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        this.clicked.emit(event);
    }
}
