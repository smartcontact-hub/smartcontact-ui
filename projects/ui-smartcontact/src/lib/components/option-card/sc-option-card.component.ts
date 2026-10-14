import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    output,
    ViewEncapsulation
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RadioButtonModule } from 'primeng/radiobutton';

/** Una opción de un `sc-option-cards`. */
export interface ScOptionCardItem {
    /** Valor que emite al elegirla. */
    value: string;
    /** Rótulo corto: es lo que se lee primero. */
    label: string;
    /** Una línea que dice QUÉ HACE. Es la razón de ser de este componente. */
    description?: string;
}

let seq = 0;

/**
 * `sc-option-cards` — elección excluyente con las opciones A LA VISTA.
 *
 * Un `<sc-select>` esconde las opciones detrás de un clic y solo enseña su nombre. Eso
 * está bien cuando el nombre se explica solo («España», «Español»), y mal cuando lo que
 * distingue a una opción de otra es su COMPORTAMIENTO: en `config/aed/grupos`, «Estrategia
 * de reparto» o «Tipo de cola de espera» son decisiones de producto cuyo nombre no dice qué
 * pasa, y el administrador tiene que abrir el menú, leer tres nombres y adivinar.
 *
 * Aquí las tres se ven a la vez, cada una con una línea que explica su efecto, y elegir es
 * un clic en vez de dos. Es el patrón correcto para POCAS opciones (2–4) con diferencias
 * que importan; con más, o con nombres que se explican solos, el desplegable gana y este
 * componente no debe usarse.
 *
 * Es el ejemplo «Card» de primeng.dev/radiobutton, tal cual (revisión del 2026-10-14): la tarjeta es
 * el `<label>`, con el rótulo y su línea a la izquierda y el `p-radiobutton` nativo al final, arriba;
 * el borde se pone del color primario en la elegida y el fondo se aclara al pasar. Antes pintaba su
 * propia marca a la izquierda y un fondo tintado en la elegida: dos cosas que el ejemplo no tiene.
 * Por dentro siguen siendo RADIOS nativos (los de `p-radiobutton`): la navegación con flechas, el
 * nombre accesible y el estado los pone el navegador, y el anillo de foco es el del radio.
 */
@Component({
    selector: 'sc-option-cards',
    standalone: true,
    imports: [FormsModule, RadioButtonModule],
    templateUrl: './sc-option-card.component.html',
    styleUrl: './sc-option-card.component.scss',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScOptionCardsComponent {
    /** Las opciones entre las que elegir, cada una con su título y su explicación. */
    readonly options = input.required<readonly ScOptionCardItem[]>();

    /** Cuál está elegida, o `null` si ninguna. */
    readonly value = input<string | null>(null);

    /** Nombre del grupo de radios. Si no se da, uno estable por instancia. */
    readonly name = input<string>();

    /** `id` del rótulo que nombra el grupo entero (el `<label>` de la sección). */
    readonly ariaLabelledBy = input<string>();

    /** En fila (por defecto, a lo ancho) o en columna, como el ejemplo de primeng.dev: una debajo de otra. */
    readonly orientation = input<'horizontal' | 'vertical'>('horizontal');

    /** Deshabilita la elección entera. */
    readonly disabled = input(false, { transform: booleanAttribute });

    /** El usuario ha elegido otra opción. */
    readonly valueChange = output<string>();

    private readonly fallbackName = `sc-option-cards-${seq++}`;

    protected readonly groupName = computed(() => this.name() ?? this.fallbackName);

    protected pick(value: string): void {
        if (this.disabled() || value === this.value()) return;
        this.valueChange.emit(value);
    }
}
