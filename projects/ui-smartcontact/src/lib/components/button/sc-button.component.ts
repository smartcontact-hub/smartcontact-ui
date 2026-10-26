import { NgTemplateOutlet } from '@angular/common';
import {
    afterEveryRender,
    afterNextRender,
    afterRenderEffect,
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    ElementRef,
    inject,
    input,
    isDevMode,
    output,
    signal,
    TemplateRef
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';

import { resolveScComponentIconClass } from '../../core/icons/sc-component-icon-resolver';
import {
    ScButtonAppearance,
    ScButtonAriaHasPopup,
    ScButtonIconPosition,
    ScButtonIconSize,
    ScButtonSize,
    ScButtonType,
    ScButtonVariant
} from '../../core/types/button.types';

type PrimeButtonSeverity = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast';
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
    imports: [ButtonModule, NgTemplateOutlet, Tooltip],
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
     * etiqueta que lo diga.
     *
     * @deprecated Usa `ariaLabel` (DD-200): dos entradas para el mismo nombre dejaban decidir cuál gana. Se queda
     * mientras alguien la use; hace lo mismo que antes.
     */
    readonly iconAriaLabel = input<string | null>(null);

    readonly ariaLabel = input<string | null>(null);

    /**
     * Qué tipo de popup abre el botón (`menu`, `dialog`, `listbox`…), el `aria-haspopup` nativo. El
     * host `<sc-button>` nunca recibe el foco: sin esto en el `<button>` real, el lector no dice que
     * el botón abre algo (la «Columnas» de una lista, el ⋮ de un widget).
     */
    readonly ariaHasPopup = input<ScButtonAriaHasPopup | null>(null);

    /**
     * Si el popup que abre el botón está abierto, el `aria-expanded` nativo. `null` lo omite; `false`
     * SÍ se anuncia (cerrado), no es lo mismo que no tenerlo.
     */
    readonly ariaExpanded = input<boolean | null>(null);

    /** Id del popup que abre el botón, el `aria-controls` nativo. */
    readonly ariaControls = input<string | null>(null);

    readonly rounded = input(false, { transform: booleanAttribute });

    /** El «+» (`icon="add"`) es siempre redondo: círculo en solo icono, píldora con rótulo. */
    protected readonly isRounded = computed(() => this.rounded() || this.icon() === 'add');

    /**
     * Solo el icono, como la propiedad «Icon Only» del Kit: el rótulo no se pinta y pasa a ser el nombre accesible y el
     * tooltip. Necesita `icon`. Sin esto, un botón de solo icono es el que no lleva `label`.
     */
    readonly iconOnly = input(false, { transform: booleanAttribute });

    /**
     * Le da la sombra de «Raised» del Kit (`button.raisedShadow` en el preset): el botón que flota sobre
     * un contenido, no el de una barra. Llega a PrimeNG como `raised`.
     */
    readonly raised = input(false, { transform: booleanAttribute });

    /**
     * Icono propio para lo que no está en Material (un SVG de la librería): `<ng-template
     * #scButtonIcon>`. Llega a PrimeNG como su plantilla `icon`, así que el botón toma la forma
     * y la talla de icono como con `icon`. El SVG mide `1em` y `fill="currentColor"`.
     */
    protected readonly customIcon = contentChild<TemplateRef<unknown>>('scButtonIcon');

    /** El botón se ha pulsado. Es el `onClick` de PrimeNG renombrado a la convención del DS. */
    readonly clicked = output<MouseEvent>();

    /** Un `pTooltip` puesto en el propio `<sc-button>` por quien lo usa: si lo hay, el suyo manda y no se pinta otro. */
    private readonly tooltipDeFuera = inject(Tooltip, { self: true, optional: true });

    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

    /**
     * Texto que quien lo usa proyecta dentro (`<sc-button>Cancelar</sc-button>`, 64 usos): no pasa por `label`, así
     * que solo se sabe mirando el `<button>` ya pintado. Con él el botón no es de solo icono.
     */
    private readonly textoDentro = signal(false);

    protected readonly isInteractionDisabled = computed(() => this.disabled() || this.loading());

    /** El rótulo que se pinta: ninguno con `iconOnly`, que lo deja para el nombre accesible. */
    protected readonly visibleLabel = computed(() => (this.iconOnly() ? '' : this.label()));

    /** `plain` no es una severidad de PrimeNG sino su booleano `plain`: sin severidad, con la clase gris. */
    protected readonly buttonSeverity = computed<PrimeButtonSeverity | undefined>(() => {
        const variant = this.variant();
        return variant === 'plain' ? undefined : variant;
    });

    protected readonly plain = computed(() => this.variant() === 'plain');

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

        if (this.iconOnly() && this.label().trim()) {
            return this.label().trim();
        }

        if (!this.label().trim()) {
            return this.iconAccessibleLabel() ?? undefined;
        }

        return undefined;
    });

    /** El `<button>` que pinta PrimeNG: el que recibe el foco y el que anuncia el lector. */
    private boton(): HTMLButtonElement | null {
        return this.host.nativeElement.querySelector('button');
    }

    /** Lleva icono: por nombre o por plantilla propia. */
    private readonly tieneIcono = computed(() => !!this.icon()?.trim() || !!this.customIcon());

    /**
     * El tooltip de un botón de solo icono (DD-200): su nombre accesible, al pasar el ratón **y al enfocar con
     * teclado**, como el `IconButton` de Primer («the tooltip visually replicates the accessible name»). Antes lo ponía
     * cada pantalla a mano, en 16 de 66 botones, y con el `tooltipEvent` por defecto de PrimeNG (`hover`) no salía
     * con teclado en ninguno. Si quien lo usa pone su propio `pTooltip` (otra cosa que el nombre), manda el suyo.
     */
    protected readonly tooltipAutomatico = computed<string | null>(() => {
        if (this.tooltipDeFuera || !this.tieneIcono() || this.visibleLabel().trim() || this.textoDentro()) {
            return null;
        }

        return this.buttonAriaLabel() ?? null;
    });

    constructor() {
        afterEveryRender(() => {
            const hay = !!this.boton()?.textContent?.trim();
            if (hay !== this.textoDentro()) {
                this.textoDentro.set(hay);
            }
        });

        // `p-button` no tiene entrada para `aria-haspopup`/`aria-expanded`/`aria-controls`, y el host `<sc-button>`
        // nunca recibe el foco: van al `<button>` real. Antes iban por su passthrough (`[pt]`), pero el `pTooltip` del
        // botón de solo icono vive en el mismo `<p-button>` y también tiene una entrada `pt` (DD-200): el binding le
        // llegaba a los dos. Sin valor, el atributo no se escribe.
        afterRenderEffect({
            write: () => {
                const boton = this.boton();
                if (!boton) {
                    return;
                }
                const expandido = this.ariaExpanded();
                ponerAtributo(boton, 'aria-haspopup', this.ariaHasPopup());
                ponerAtributo(boton, 'aria-expanded', expandido === null ? null : String(expandido));
                ponerAtributo(boton, 'aria-controls', this.ariaControls());
            }
        });

        // Un botón de solo icono sin nombre no se anuncia y no tiene tooltip: en desarrollo, que se note.
        if (isDevMode()) {
            afterNextRender(() => {
                if (this.tieneIcono() && !this.visibleLabel().trim() && !this.textoDentro() && !this.buttonAriaLabel()) {
                    console.warn(
                        `sc-button: botón de solo icono («${this.icon() ?? 'plantilla propia'}») sin nombre. Ponle ariaLabel (DD-200).`
                    );
                }
            });
        }
    }

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

function ponerAtributo(el: HTMLElement, nombre: string, valor: string | null): void {
    if (valor === null || valor === '') {
        el.removeAttribute(nombre);
    } else {
        el.setAttribute(nombre, valor);
    }
}
