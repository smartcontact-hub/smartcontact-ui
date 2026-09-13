import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    output,
    ViewEncapsulation
} from '@angular/core';

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
 * Por dentro es un grupo de RADIOS nativos: la navegación con flechas, el nombre accesible
 * y el estado los pone el navegador, no una reimplementación. La tarjeta es el `<label>`.
 */
@Component({
    selector: 'sc-option-cards',
    standalone: true,
    templateUrl: './sc-option-card.component.html',
    styleUrl: './sc-option-card.component.scss',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScOptionCardsComponent {
    readonly options = input.required<readonly ScOptionCardItem[]>();

    readonly value = input<string | null>(null);

    /** Nombre del grupo de radios. Si no se da, uno estable por instancia. */
    readonly name = input<string>();

    /** `id` del rótulo que nombra el grupo entero (el `<label>` de la sección). */
    readonly ariaLabelledBy = input<string>();

    readonly disabled = input(false, { transform: booleanAttribute });

    readonly valueChange = output<string>();

    private readonly fallbackName = `sc-option-cards-${seq++}`;

    protected readonly groupName = computed(() => this.name() ?? this.fallbackName);

    protected pick(value: string): void {
        if (this.disabled() || value === this.value()) return;
        this.valueChange.emit(value);
    }
}
