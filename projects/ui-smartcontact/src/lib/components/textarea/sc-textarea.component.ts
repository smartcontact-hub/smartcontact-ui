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
     * aplica aquí. Los seis componentes del field-pattern tampoco lo llevan ya
     * (retirado por DD-44, 2026-08-30) — nadie en el DS implementa CVA hoy.
     */
    readonly value = model('');

    /** Texto dentro del campo mientras está vacío. No sustituye a `label`: desaparece al escribir. */
    readonly placeholder = input('');

    /**
     * Alto inicial en líneas de texto. Es el alto de partida: si el campo puede crecer, crece desde
     * aquí.
     */
    readonly rows = input(3);

    /**
     * Ancho en caracteres. Normalmente no se usa —el ancho lo manda el contenedor—; está para el
     * caso en que haga falta fijarlo.
     */
    readonly cols = input<number | null>(null);

    /**
     * Id del control interno. Si no se pasa se genera uno, así que solo hace falta para atar una
     * etiqueta externa o un `aria-describedby` de fuera.
     */
    readonly inputId = input<string | null>(null);

    /**
     * Atributo `name` del control, para el envío nativo del formulario y para que el navegador sepa
     * qué autocompletar.
     */
    readonly name = input<string | null>(null);

    /** Deshabilita el campo. No se puede enfocar ni editar, y no viaja en el envío del formulario. */
    readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * El valor se ve pero no se edita. A diferencia de `disabled`, **sigue siendo enfocable y se
     * puede copiar**.
     */
    readonly readonly = input(false, { transform: booleanAttribute });

    readonly invalid = input(false, { transform: booleanAttribute });

    readonly fluid = input(false, { transform: booleanAttribute });

    readonly autoResize = input(false, { transform: booleanAttribute });

    /**
     * Talla del campo: `sm`, `md` o `lg`. Mueve alto, tipografía y espaciado a la rampa del Kit; no
     * cambia el comportamiento.
     */
    readonly size = input<ScComponentSize>('md');

    readonly variant = input<ScInputVariant>('outlined');

    /** El usuario ha arrastrado la esquina para cambiar el tamaño del campo. */
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
