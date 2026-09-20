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

    /**
     * Qué tan presente es el botón: `filled` lo rellena, `outlined` deja solo el borde, `text` solo
     * la etiqueta y `link` lo pinta como un enlace. En PrimeNG son tres booleanos sueltos
     * (`outlined`/`text`/`link`); aquí es un valor único para que no puedan darse dos a la vez.
     */
    readonly appearance = input<ScButtonAppearance>('filled');

    readonly size = input<ScButtonSize>('md');

    readonly disabled = input(false, { transform: booleanAttribute });

    readonly loading = input(false, { transform: booleanAttribute });

    /** El botón ocupa todo el ancho disponible. Llega a PrimeNG como `fluid`. */
    readonly fullWidth = input(false, { transform: booleanAttribute });

    readonly type = input<ScButtonType>('button');

    readonly icon = input<string | null>(null);

    /** De qué lado de la etiqueta va el icono. Llega a PrimeNG como `iconPos`. */
    readonly iconPosition = input<ScButtonIconPosition>('left');

    /**
     * Talla del icono, si tiene que ser distinta de la que le tocaría por la del botón. `null` deja
     * que la herede.
     */
    readonly iconSize = input<ScButtonIconSize | null>(null);

    /**
     * Pinta el icono en su versión rellena (el eje `FILL` de Material Symbols), no en la de solo
     * trazo.
     */
    readonly iconFilled = input(false, { transform: booleanAttribute });

    /**
     * Nombre accesible del icono, para cuando el icono es el que lleva el significado y no hay
     * etiqueta que lo diga. Sin esto, un botón de solo icono no se anuncia.
     */
    readonly iconAriaLabel = input<string | null>(null);

    readonly ariaLabel = input<string | null>(null);

    readonly rounded = input(false, { transform: booleanAttribute });

    /** El botón se ha pulsado. Es el `onClick` de PrimeNG renombrado a la convención del DS. */
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
