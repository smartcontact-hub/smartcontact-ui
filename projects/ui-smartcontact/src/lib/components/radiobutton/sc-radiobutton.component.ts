import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RadioButtonModule } from 'primeng/radiobutton';

import { ScComponentSize, ScInputVariant } from '../../core/types/theme-component.types';

type PrimeRadioButtonSize = 'small' | 'large' | undefined;

@Component({
    selector: 'sc-radiobutton',
    standalone: true,
    imports: [FormsModule, RadioButtonModule],
    templateUrl: './sc-radiobutton.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScRadioButtonComponent {
    readonly value = input<unknown>(null);

    /**
     * `model()` sustituye a `@Input() modelValue` + `@Output() modelValueChange`
     * + `onModelValueChange()`. Ese método existía solo para escribir el input
     * desde dentro y re-emitirlo, que es exactamente lo que un `model` hace
     * solo — y de paso desaparece una asignación a un `@Input`, prohibida en la
     * era de señales.
     *
     * OJO: esto NO es un `ControlValueAccessor`. El componente no implementa
     * CVA; el `[ngModel]` de la plantilla es del `<p-radio-button>` interno. Por
     * eso no aplica aquí la regla 6 de `migration-safety.md`.
     */
    readonly modelValue = model<unknown>(null);

    readonly inputId = input<string | null>(null);

    readonly name = input<string | null>(null);

    readonly ariaLabel = input<string | null>(null);

    readonly size = input<ScComponentSize>('md');

    readonly variant = input<ScInputVariant>('outlined');

    readonly clicked = output<unknown>();

    protected readonly radioName = computed<string>(() => this.name() ?? '');

    protected readonly radioSize = computed<PrimeRadioButtonSize>(() => {
        const size = this.size();

        if (size === 'sm') {
            return 'small';
        }

        if (size === 'lg') {
            return 'large';
        }

        return undefined;
    });
}
