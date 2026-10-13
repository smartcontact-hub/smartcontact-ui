import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    inject,
    input,
    model,
    output,
    signal,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';

import { ScComponentSize, ScInputVariant } from '../../core/types/theme-component.types';
import { ScButtonComponent } from '../button/sc-button.component';
import { createScFieldState, joinDescribedBy } from '../field/sc-field';
import { ScFieldMsgComponent } from '../field/sc-field-msg.component';
import { SC_TEXTAREA_TRANSLATIONS } from './i18n/sc-textarea.translations';

type PrimeTextareaSize = 'small' | 'large' | undefined;

@Component({
    selector: 'sc-textarea',
    standalone: true,
    imports: [TextareaModule, ScButtonComponent, ScFieldMsgComponent, TooltipModule, TranslateModule],
    templateUrl: './sc-textarea.component.html',
    styleUrl: './sc-textarea.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class.sc-textarea--copyable]': 'copyable()',
        '[class.sc-textarea--fluid]': 'fluid()',
        // Con ayuda o con copiar, el campo se apila (control y debajo su ayuda) y pierde el hueco de línea de debajo.
        '[class.sc-textarea--stack]': 'copyable() || !!footerText()',
    },
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

    /**
     * Ids, separados por espacios, de la ayuda que describe el campo desde fuera: la que va a su lado (la fila de un
     * ajuste, de un interruptor). Se oye después de la ayuda propia (`helperText`), si la hay (DD-133).
     */
    readonly ariaDescribedBy = input<string | null>(null);

    /** La ayuda del campo, debajo, como en el resto de campos del DS (DD-198). Se anuncia con el campo. */
    readonly helperText = input<string>();

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

    /**
     * Un botón de copiar, solo con su icono, dentro del campo arriba a la derecha (DD-198): para lo que se lee y se
     * copia (un script, una clave). Al pulsarlo, el icono pasa a ✓ dos segundos y el lector oye «Copiado». El texto no
     * pasa por debajo del botón.
     */
    readonly copyable = input(false, { transform: booleanAttribute });
    /** Nombre del botón de copiar («Copiar código»). Sin él, el del diccionario del DS («Copiar»). */
    readonly copyLabel = input<string>();
    /** Lo que dice tras copiar («Código copiado»). Sin él, «Copiado». */
    readonly copiedLabel = input<string>();
    /** Se ha copiado el valor. */
    readonly copied = output<void>();

    private readonly field = createScFieldState('sc-textarea', {
        inputId: computed(() => this.inputId() ?? undefined),
        helperText: this.helperText,
    });
    protected readonly msgId = this.field.msgId;
    protected readonly footerText = this.field.footerText;
    /** Primero su ayuda y después lo de fuera (`ariaDescribedBy`). */
    protected readonly describedBy = computed(() =>
        joinDescribedBy(this.footerText() ? this.msgId() : null, this.ariaDescribedBy()),
    );

    private readonly translate = inject(TranslateService);
    protected readonly copiado = signal(false);
    private temporizador: ReturnType<typeof setTimeout> | undefined;
    private readonly alSalir = inject(DestroyRef).onDestroy(() => clearTimeout(this.temporizador));

    protected readonly rotuloCopiar = computed(() =>
        this.copiado()
            ? (this.copiedLabel() ?? this.translate.instant('sc.textarea.copied'))
            : (this.copyLabel() ?? this.translate.instant('sc.textarea.copy')),
    );

    constructor() {
        for (const [language, dict] of Object.entries(SC_TEXTAREA_TRANSLATIONS)) {
            this.translate.setTranslation(language, dict, true);
        }
    }

    protected copiar(): void {
        void navigator.clipboard?.writeText(this.value());
        this.copiado.set(true);
        this.copied.emit();
        clearTimeout(this.temporizador);
        this.temporizador = setTimeout(() => this.copiado.set(false), 2000);
    }

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
