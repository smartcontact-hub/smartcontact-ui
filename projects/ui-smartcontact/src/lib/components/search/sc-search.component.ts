import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  model,
  output,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

import { ScIconComponent } from '@smartcontact-hub/icons';
import { createScFieldState, type ScFieldSize } from '../field/sc-field';

/** @deprecated Usa `ScFieldSize`. Alias conservado por compatibilidad de imports. */
export type ScSearchSize = ScFieldSize;

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
 * Se consume con `[(value)]` (signals). El CVA que daba soporte a
 * ngModel/Reactive Forms se retiró (DD, 2026-08-30): no lo usaba ningún
 * consumidor —los 9 de AED pasan `[(value)]`—.
 */
@Component({
  selector: 'sc-search',
  standalone: true,
  imports: [IconFieldModule, InputIconModule, InputTextModule, ScIconComponent],
  templateUrl: './sc-search.component.html',
  styleUrl: './sc-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'sc-search',
    '[class.sc-search--sm]': "size() === 'sm'",
    '[class.sc-search--lg]': "size() === 'lg'",
    '[class.sc-search--disabled]': 'disabled()',
    '[class.sc-search--filled]': 'filled()',
  },
})
export class ScSearchComponent {
  // ─── Chrome inputs ─────────────────────────────────────────────────
  readonly size = input<ScFieldSize>('md');
  readonly placeholder = input<string>('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly inputId = input<string>();
  readonly name = input<string>();
  readonly autoFocus = input(false, { transform: booleanAttribute });
  /** Background "filled" variant (bg slate-50, alineado con sc-inputtext). */
  readonly filled = input(false, { transform: booleanAttribute });

  // ─── Search-specific ───────────────────────────────────────────────
  /** Muestra el botón "×" cuando hay texto. Default true. */
  readonly showClear = input(true, { transform: booleanAttribute });
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
  private readonly field = createScFieldState('sc-search', { inputId: this.inputId });
  protected readonly resolvedId = this.field.resolvedId;

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('input');

  /** Public API — permite al consumer enfocar el campo (atajos globales). */
  focus(): void {
    this.inputEl()?.nativeElement.focus();
  }

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }

  protected onClear(): void {
    this.value.set('');
    this.inputEl()?.nativeElement.focus();
  }

  protected onKeydown(event: KeyboardEvent): void {
    this.keydown.emit(event);
  }
}
