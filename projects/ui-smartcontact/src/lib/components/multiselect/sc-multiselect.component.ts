import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
// `FormsModule` sigue haciendo falta: la plantilla usa `[ngModel]` como puente
// INTERNO hacia `<p-multiselect>` (no es el CVA exterior, que se retiró).
import { FormsModule } from '@angular/forms';
import { ChipModule } from 'primeng/chip';
import { TimesCircleIcon } from 'primeng/icons/timescircle';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { Tooltip } from 'primeng/tooltip';
import type { MultiSelectPassThroughOptions } from 'primeng/types/multiselect';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SC_SELECT_TRANSLATIONS } from '../select/i18n/sc-select.translations';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { ScFieldLabelComponent } from '../field/sc-field-label.component';
import { ScFieldMsgComponent } from '../field/sc-field-msg.component';
import {
  createScFieldState,
  createScOptionState,
  createScPanelSizing,
  joinDescribedBy,
  type ScFieldSize,
} from '../field/sc-field';

/**
 * `hiddenInput` es la sección del `<input role="combobox">` del multiselect: PrimeNG 22.1 la pinta con
 * `ptm('hiddenInput')`, aunque sus tipos no la declaren.
 */
type ScMultiSelectPassThrough = MultiSelectPassThroughOptions & {
  hiddenInput?: Record<string, string | null>;
};

/** @deprecated Usa `ScFieldSize`. Alias conservado por compatibilidad de imports. */
export type ScMultiSelectSize = ScFieldSize;
export type ScMultiSelectDisplay = 'chip' | 'comma';
/**
 * Con `display="chip"`, qué pasa al pasar de `maxSelectedLabels`. `count` (el de PrimeNG): las etiquetas se cambian por
 * «N seleccionados». `more`: se quedan las primeras y otra dice cuántas faltan («+2 más»). `fit`: como `more`, pero sin
 * tope fijo: se quedan las que caben en el ancho del campo, y la última dice cuántas faltan (revisión de producto del
 * 2026-10-20, DD-217: con tres fijas sobraba medio campo). Con `more` y `fit`, un nombre más largo que el campo se acorta
 * con «…» y se lee entero al pasar; su «×» y «+N más» quedan a la vista.
 */
export type ScMultiSelectChipOverflow = 'count' | 'more' | 'fit';

/**
 * Smart Contact multi-select. Wraps PrimeNG `<p-multiselect>` with the
 * SCDS field-pattern chrome (label + required + helper + error).
 *
 * Aligned 1:1 with Figma `Smart Contact Prime → ❖ MultiSelect` (canvas
 * 6738:22651): tokens `multiselect/*` mirror `select/*` exactly (border
 * slate-300, padding 10/6, shadow #1212170D, dropdown 35px slate-400).
 * Sizes Sm/Lg use the same decimal Figma values as sc-inputtext/sc-select.
 *
 * Two display modes via `[display]`:
 *   - 'chip'  → selected items render as removable pills inside the input
 *   - 'comma' → selected items render as comma-separated text
 */
@Component({
  selector: 'sc-multiselect',
  standalone: true,
  imports: [
    ChipModule,
    MultiSelectModule,
    FormsModule,
    NgTemplateOutlet,
    ScFieldLabelComponent,
    ScFieldMsgComponent,
    ScIconComponent,
    TimesCircleIcon,
    Tooltip,
    TranslateModule,
  ],
  templateUrl: './sc-multiselect.component.html',
  styleUrl: './sc-multiselect.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'sc-multiselect',
    '[class.sc-multiselect--icon-only]': 'iconOnly()',
    '[class.sc-multiselect--sm]': "size() === 'sm'",
    '[class.sc-multiselect--lg]': "size() === 'lg'",
    '[class.sc-multiselect--invalid]': 'isInvalid()',
    '[class.sc-multiselect--disabled]': 'disabled()',
    '[class.sc-multiselect--filled]': 'filled()',
    '[class.sc-multiselect--ifta]': 'iftaLabel()',
  },
})
export class ScMultiSelectComponent {
  /**
   * La fila de cada opción, como `#item` de `p-multiselect` (primeng.dev/multiselect «Template»): el consumer escribe
   * `<ng-template #item let-option>` dentro de `<sc-multiselect>` y aquí se re-emite hacia el control, porque su
   * consulta no ve plantillas a través de doble proyección (mismo puente, y por qué el nombre es estático, que en
   * `sc-select`).
   */
  protected readonly itemTpl = contentChild<TemplateRef<unknown>>('item');

  private readonly control = viewChild(MultiSelect);

  /** Cierra la lista: para una acción de la fila que abre otra ventana (editar el recurso de esa opción). */
  hide(): void {
    this.control()?.hide();
  }

  /** Abre la lista y le da el foco: para un flujo guiado que, al elegir lo anterior, lleva directo a este campo. */
  show(): void {
    this.control()?.show(true);
  }

  constructor() {
    // El mismo diccionario que `sc-select`: lista vacía, filtro sin resultados, buscador y «N seleccionados».
    const translate = inject(TranslateService);
    for (const [language, dict] of Object.entries(SC_SELECT_TRANSLATIONS)) {
      translate.setTranslation(language, dict, true);
    }

    // `fit`: se vuelve a medir al cambiar lo elegido y al cambiar el ancho del campo.
    effect(() => {
      if (!this.fitChips()) return;
      this.value();
      untracked(() => this.medir());
    });
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      let ancho = 0;
      const observador = new ResizeObserver(([entrada]) => {
        const nuevo = Math.round(entrada.contentRect.width);
        if (!this.fitChips() || nuevo === ancho) return;
        ancho = nuevo;
        this.medir();
      });
      observador.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => observador.disconnect());
    });
  }

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * En `fit`, cuántas etiquetas caben; `null` mientras se miden. Para medir se pintan todas y, detrás, la de «+N más»
   * oculta (la caja del campo recorta lo que no cabe, así que no se ve nada de más); en el siguiente render se cuenta
   * hasta dónde llegan sin pisar la de «+N más», y se pintan solo esas.
   */
  protected readonly fitCount = signal<number | null>(null);

  private medir(): void {
    this.fitCount.set(null);
    afterNextRender(
      () => {
        const raiz = this.host.nativeElement;
        const etiqueta = raiz.querySelector<HTMLElement>('.p-multiselect-label');
        const caja = raiz.querySelector<HTMLElement>('.p-multiselect-label-container');
        if (!etiqueta || !caja) return;
        const chips = [...etiqueta.querySelectorAll<HTMLElement>('.p-multiselect-chip-item:not(.sc-multiselect__more-item)')];
        const mas = etiqueta.querySelector<HTMLElement>('.sc-multiselect__more-item');
        const estilo = getComputedStyle(etiqueta);
        const hueco = parseFloat(estilo.columnGap) || 0;
        const tope = caja.getBoundingClientRect().right - (parseFloat(estilo.paddingRight) || 0);
        const derecha = (el: HTMLElement) => el.getBoundingClientRect().right;
        if (chips.length === 0 || derecha(chips[chips.length - 1]) <= tope + 0.5) {
          this.fitCount.set(chips.length);
          return;
        }
        const reserva = (mas?.getBoundingClientRect().width ?? 0) + hueco;
        let caben = 0;
        while (caben < chips.length && derecha(chips[caben]) + reserva <= tope + 0.5) caben++;
        // Al menos una: «+N más» sola no dice qué hay elegido.
        this.fitCount.set(Math.max(1, caben));
      },
      { injector: this.injector },
    );
  }

  /** Cuántas etiquetas se pintan con `more` o `fit`, de `total` elegidas. */
  protected visibleChips(total: number): number {
    if (this.fitChips()) return this.fitCount() ?? total;
    return this.maxSelectedLabels();
  }

  // ─── Chrome (mirrors sc-select) ─────────────────────────────────────
  readonly size = input<ScFieldSize>('md');
  /** Selector compacto; conserva el control nativo y exige ariaLabel o ariaLabelledBy. */
  readonly iconOnly = input(false, { transform: booleanAttribute });
  /** Icono del selector compacto. El desplegable normal conserva expand_more. */
  readonly icon = input('view_column');
  /**
   * Etiqueta del campo. Se pinta con `sc-field-label` y es la que ata su `for` al `id` del control,
   * así que **sin ella el campo no tiene nombre accesible** (o se le da uno por `ariaLabel`).
   */
  readonly label = input<string>();
  readonly required = input(false, { transform: booleanAttribute });
  /** Texto de ayuda bajo el campo. Lo tapa `error` cuando lo hay: nunca se ven los dos a la vez. */
  readonly helperText = input<string>();
  /**
   * Mensaje de error. Su sola presencia pone el campo en estado inválido, así que no hace falta
   * tocar `invalid` además.
   */
  readonly error = input<string>();
  /** Estado inválido explícito. Se combina con `error` (paridad con sc-inputtext). */
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly placeholder = input<string>('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly inputId = input<string>();
  /** `id` de un rótulo EXTERNO que nombra el control (ver `resolvedLabelledBy`). */
  readonly ariaLabelledBy = input<string>();
  /** Nombre accesible cuando no hay rótulo visible (p. ej. un selector en una barra de herramientas). */
  readonly ariaLabel = input<string>();
  /**
   * Ids, separados por espacios, de lo que describe el campo desde fuera: la ayuda que va al lado y no debajo (la fila
   * de un ajuste). Se oye después de la ayuda propia (`helperText`), si la hay (DD-133).
   */
  readonly ariaDescribedBy = input<string>();
  readonly name = input<string>();

  // ─── MultiSelect-specific ──────────────────────────────────────────
  readonly options = input<readonly unknown[]>([]);
  readonly optionLabel = input<string>('label');
  readonly optionValue = input<string>();
  /** Campo de la opción (o función) que la deja fija: se ve, pero no se puede marcar ni desmarcar. */
  readonly optionDisabled = input<string | ((option: unknown) => boolean)>();
  /**
   * Opciones por grupos, cada uno con su cabecera (primeng.dev/multiselect «Group»): `options` es entonces la lista de
   * grupos, con su rótulo en `optionGroupLabel` y sus opciones en `optionGroupChildren`. La cabecera no se marca.
   */
  readonly group = input(false, { transform: booleanAttribute });
  /** Campo del grupo con su rótulo. */
  readonly optionGroupLabel = input<string>('label');
  /** Campo del grupo con sus opciones. */
  readonly optionGroupChildren = input<string>('items');
  /** How to render selected items inside the input. */
  readonly display = input<ScMultiSelectDisplay>('comma');
  /** Show search/filter input inside the dropdown. */
  readonly filter = input(false, { transform: booleanAttribute });
  readonly filterBy = input<string>();
  /** Show "Select all" toggle at the top of the dropdown. */
  readonly showToggleAll = input(true, { transform: booleanAttribute });
  /** Hard limit on how many items can be selected. */
  readonly selectionLimit = input<number>();
  /** When `display='comma'`, fold to "N items selected" after this many. */
  readonly maxSelectedLabels = input<number>(3);
  /**
   * Con `display="chip"`, qué se ve al pasar de `maxSelectedLabels` (`ScMultiSelectChipOverflow`). Con `more`, lo elegido
   * se sigue leyendo sin abrir la lista (revisión de producto del 2026-10-15, los grupos de una plantilla).
   */
  readonly chipOverflow = input<ScMultiSelectChipOverflow>('count');
  /** Lo que dice el campo plegado con varias marcadas: «{0} seleccionados» en el idioma de la app
   *  (`sc.select.selected`), salvo que se pase. */
  readonly selectedItemsLabel = input<string>();
  /** Show the "×" clear button. */
  readonly showClear = input(false, { transform: booleanAttribute });
  /** Texto de ayuda del buscador del panel. Sin él, «Buscar» en el idioma de la app (`sc.select.search`). */
  readonly filterPlaceholder = input<string>();
  /** El filtro no deja ninguna opción. Sin él, «Sin resultados» en el idioma de la app. */
  readonly emptyFilterMessage = input<string>();
  /** La lista no tiene opciones. Sin él, «Sin opciones» en el idioma de la app. */
  readonly emptyMessage = input<string>();
  /** Background "filled" variant (Figma node 6220:7054): bg slate-50. */
  readonly filled = input(false, { transform: booleanAttribute });
  /**
   * Label dentro del campo (IftaLabel — *In-Field Top Aligned*, Figma node
   * `7462:106725`). El `label` se fija arriba-dentro del campo y el valor baja
   * (padding-top 21 / bottom 7, label 10.5px regular `#8f97a3` en x10.5/top7).
   * Opt-in; los multiselect con label-encima no cambian.
   */
  readonly iftaLabel = input(false, { transform: booleanAttribute });
  /** Dónde se pinta la lista. Por defecto en `<body>`, por lo mismo que `sc-select.appendTo`. */
  readonly appendTo = input<'body' | 'self'>('body');

  // ─── Two-way value binding ─────────────────────────────────────────
  /** Array of selected values (id-only if `optionValue` set, else whole objects). */
  readonly value = model<unknown[]>([]);

  // ─── Outputs (paridad con sc-inputtext / sc-select) ────────────────
  /** El campo ha recibido el foco. */
  readonly focused = output<FocusEvent>();
  /** El campo ha perdido el foco. Es el momento en el que suele validarse. */
  readonly blurred = output<FocusEvent>();

  // ─── Estado del field-pattern (compartido) ─────────────────────────
  private readonly field = createScFieldState('sc-multiselect', {
    inputId: this.inputId,
    error: this.error,
    helperText: this.helperText,
    invalid: this.invalid,
  });
  protected readonly resolvedId = this.field.resolvedId;
  protected readonly msgId = this.field.msgId;
  protected readonly labelId = this.field.labelId;
  /*
   * El rótulo del componente —encima o dentro (`iftaLabel`)— nombra el combobox por
   * `aria-labelledby`. En PrimeNG 22 el combobox del multiselect es un `<input>` oculto, así
   * que un `<label for>` también lo nombra (medido el 2026-10-05); el del select, un span, no.
   */
  protected readonly resolvedLabelledBy = computed(
    () => this.ariaLabelledBy() ?? (this.label() ? this.labelId() : undefined),
  );
  protected readonly isInvalid = this.field.isInvalid;
  protected readonly footerText = this.field.footerText;
  /**
   * Los `aria-*` del campo van al elemento que recibe el foco, el `<input role="combobox">`, como en `sc-select`.
   * Hasta el 2026-10-05 iban en la envoltura `<p-multiselect>`, y el lector no anunciaba la ayuda ni el error (DD-133).
   */
  protected readonly pt = computed<ScMultiSelectPassThrough>(() => ({
    hiddenInput: {
      'aria-describedby': joinDescribedBy(this.footerText() ? this.msgId() : null, this.ariaDescribedBy()),
      'aria-required': this.required() ? 'true' : null,
      'aria-invalid': this.isInvalid() ? 'true' : null,
    },
  }));

  private readonly panel = createScPanelSizing('sc-multiselect', this.size);
  protected readonly pSize = this.panel.pSize;
  protected readonly panelStyleClass = this.panel.panelStyleClass;

  private readonly optionState = createScOptionState({
    options: this.options,
    optionLabel: this.optionLabel,
    optionValue: this.optionValue,
  });
  protected readonly optionsMutable = this.optionState.optionsMutable;
  protected readonly hasPrimitiveOptions = this.optionState.hasPrimitiveOptions;
  protected readonly resolvedOptionLabel = this.optionState.resolvedOptionLabel;
  protected readonly resolvedOptionValue = this.optionState.resolvedOptionValue;

  /** Etiquetas con «+N más»: las corta la plantilla `#selecteditems`, y a PrimeNG no se le pasa tope (si no, cambiaría
   *  las etiquetas por «N seleccionados» y el campo dejaría de medir como un campo con etiquetas). */
  protected readonly moreChips = computed(() => this.display() === 'chip' && this.chipOverflow() !== 'count');
  /** `fit`: las que caben en el ancho, medidas (`fitCount`). */
  protected readonly fitChips = computed(() => this.display() === 'chip' && this.chipOverflow() === 'fit');
  protected readonly controlMaxSelectedLabels = computed(() => (this.moreChips() ? null : this.maxSelectedLabels()));

  /** El texto y el valor de una opción elegida, para pintar su etiqueta y quitarla. */
  protected chipLabel(option: unknown): string {
    const key = this.resolvedOptionLabel();
    return String(key && option && typeof option === 'object' ? (option as Record<string, unknown>)[key] : option);
  }

  protected chipValue(option: unknown): unknown {
    const key = this.resolvedOptionValue();
    return key && option && typeof option === 'object' ? (option as Record<string, unknown>)[key] : option;
  }

  protected onModelChange(v: unknown[]): void {
    this.value.set(v ?? []);
  }

  // p-multiselect envuelve el foco en `{ originalEvent }`, a diferencia de
  // p-select/p-datepicker que reenvían el Event directo. Se desenvuelve para
  // que `focused`/`blurred` emitan el mismo tipo que los demás campos.
  protected onFocus(event: { originalEvent: Event }): void {
    this.focused.emit(event.originalEvent as FocusEvent);
  }

  protected onBlur(event: { originalEvent: Event }): void {
    this.blurred.emit(event.originalEvent as FocusEvent);
  }
}
