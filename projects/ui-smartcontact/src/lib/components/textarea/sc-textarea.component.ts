import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { TextareaModule } from 'primeng/textarea';

import { ScComponentSize, ScInputVariant } from '../../core/types/theme-component.types';

type PrimeTextareaSize = 'small' | 'large' | undefined;

@Component({
    selector: 'sc-textarea',
    standalone: true,
    imports: [TextareaModule],
    templateUrl: './sc-textarea.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScTextareaComponent {
    /**
     * `model()` sustituye a `@Input() value` + `@Output() valueChange`, que era
     * un doble binding escrito a mano: `onInput()` asignaba al `@Input` y luego
     * emitía. El handler se queda —hace falta para sacar el valor del evento
     * DOM— pero ahora hace `set()` en vez de asignar.
     *
     * Esto NO es un `ControlValueAccessor`: el componente no lo implementa, así
     * que la regla 6 de `migration-safety.md` (el `untracked()` sin efectos) no
     * aplica aquí. Los campos que SÍ llevan CVA son los cinco del field-pattern.
     */
    readonly value = model('');

    readonly placeholder = input('');

    readonly rows = input(3);

    readonly cols = input<number | null>(null);

    readonly inputId = input<string | null>(null);

    readonly name = input<string | null>(null);

    readonly disabled = input(false, { transform: booleanAttribute });

    readonly readonly = input(false, { transform: booleanAttribute });

    readonly invalid = input(false, { transform: booleanAttribute });

    readonly fluid = input(false, { transform: booleanAttribute });

    readonly autoResize = input(false, { transform: booleanAttribute });

    readonly size = input<ScComponentSize>('md');

    readonly variant = input<ScInputVariant>('outlined');

    readonly resized = output<unknown>();

    protected readonly textareaSize = computed<PrimeTextareaSize>(() => {
        const size = this.size();

        if (size === 'sm') {
            return 'small';
        }

        if (size === 'lg') {
            return 'large';
        }

        return undefined;
    });

    protected onInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;

        this.value.set(textarea.value);
    }
}
