import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  input,
  model,
  output,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';


import { SC_ICON_SIZE_DEFAULT, SC_ICON_SIZE_MD, ScIconComponent } from '@smartcontact/icons';

export type ScSearchSize = 'sm' | 'md' | 'lg';

let scSearchIdCounter = 0;

/**
 * Smart Contact search input. Compone `<p-iconfield>` + `<p-inputicon>` +
 * `<input pInputText>` siguiendo el patrón nativo PrimeNG para inputs con
 * icon overlay decorativo (vs `<p-inputgroup>` que es para addons con border
 * merge — distinta semántica). Añade:
 *   - clear button (×) opcional que aparece cuando hay texto.
 *   - shortcut hint opcional (`⌘K`/`/`) visible cuando el campo está vacío
 *     y sin foco — pista de que existe un atajo global para enfocarlo.
 *
 * Patrón replicado en AED: list-pages (agents/groups/labels/templates/repos)
 * + pickers (agendas, plantillas dentro de agent-form). 7 consumers reales
 * que antes copiaban la chrome `.page__search-*` en 6 SCSS distintos.
 *
 * Pairs con `[(value)]` signals, `[(ngModel)]`, y Reactive Forms via
 * ControlValueAccessor.
 */
@Component({
  selector: 'sc-search',
  standalone: true,
  imports: [IconFieldModule, InputIconModule, InputTextModule, ScIconComponent, FormsModule],
  templateUrl: './sc-search.component.html',
  styleUrl: './sc-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ScSearchComponent),
      multi: true,
    },
  ],
  host: {
    class: 'sc-search',
    '[class.sc-search--sm]': "size() === 'sm'",
    '[class.sc-search--lg]': "size() === 'lg'",
    '[class.sc-search--disabled]': 'disabled()',
    '[class.sc-search--filled]': 'filled()',
  },
})
export class ScSearchComponent implements ControlValueAccessor {
  // ─── Chrome inputs ─────────────────────────────────────────────────
  readonly size = input<ScSearchSize>('md');
  readonly placeholder = input<string>('');
  readonly disabled = model<boolean>(false);
  readonly inputId = input<string>();
  readonly name = input<string>();
  readonly autoFocus = input<boolean>(false);
  /** Background "filled" variant (bg slate-50, alineado con sc-inputtext). */
  readonly filled = input<boolean>(false);

  // ─── Search-specific ───────────────────────────────────────────────
  /** Muestra el botón "×" cuando hay texto. Default true. */
  readonly showClear = input<boolean>(true);
  /**
   * Pista de atajo visible cuando el campo está vacío y sin foco
   * (ej. `⌘K`, `/`). Sigue el patrón de GitHub / Linear. Cuando undefined,
   * no se renderiza.
   */
  readonly shortcutHint = input<string>();
  /** Aria-label del botón clear (i18n key resuelto por el consumer). */
  readonly clearAriaLabel = input<string>('Clear search');

  // ─── Two-way value binding ─────────────────────────────────────────
  readonly value = model<string>('');

  // ─── Events ────────────────────────────────────────────────────────
  /**
   * Re-emite keydown del input para que el consumer maneje atajos (Esc, Enter, etc).
   * El nombre `keydown` conflicta con el evento DOM nativo del host por diseño —
   * el output reproduce semánticamente el evento del input interno, no del host.
   * Renombrarlo rompería 9 consumers AED (list-pages + picker-search).
   */
  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly keydown = output<KeyboardEvent>();

  // ─── Derived / internal ────────────────────────────────────────────
  protected readonly searchIcon = 'search';
  protected readonly clearIcon = 'close';
  protected readonly iconSizeDefault = SC_ICON_SIZE_DEFAULT;
  protected readonly iconSizeMd = SC_ICON_SIZE_MD;
  protected readonly resolvedId = computed(
    () => this.inputId() ?? `sc-search-${++scSearchIdCounter}`,
  );

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('input');

  /** Public API — permite al consumer enfocar el campo (atajos globales). */
  focus(): void {
    this.inputEl()?.nativeElement.focus();
  }

  // ─── ControlValueAccessor ──────────────────────────────────────────
  private _onChange: (v: string) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(v: string | null | undefined): void {
    /* `untracked` aísla la escritura del signal (defensa CVA + signals). */
    untracked(() => this.value.set(v ?? ''));
  }
  registerOnChange(fn: (v: string) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  setDisabledState(state: boolean): void {
    this.disabled.set(state);
  }

  protected onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this._onChange(next);
  }

  protected onBlur(): void {
    this._onTouched();
  }

  protected onClear(): void {
    this.value.set('');
    this._onChange('');
    this.inputEl()?.nativeElement.focus();
  }

  protected onKeydown(event: KeyboardEvent): void {
    this.keydown.emit(event);
  }
}
