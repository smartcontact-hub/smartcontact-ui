import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SC_ICON_SIZE_MD, ScIconComponent } from '@smartcontact/icons';

import { SC_INLINE_RENAME_CELL_TRANSLATIONS } from './i18n/sc-inline-rename-cell.translations';

/**
 * Celda de nombre editable in-place. La usan las list pages justo tras un
 * duplicado, para renombrar el borrador recién creado sin un round-trip de
 * router — manteniendo la fila en su posición original para que el layout de la
 * tabla nunca salte.
 *
 * Comportamiento:
 *   - autofocus + select-all al montar (Fitts: el usuario ya está en modo "rename")
 *   - Enter o botón check → emite `commit` con el valor trimmeado
 *   - Esc o botón X → emite `cancelled` (el caller decide si borra el borrador o
 *     revierte el nombre)
 *   - valores vacíos / solo-espacios deshabilitan el commit
 *
 * Dimensionada para igualar la celda de nombre en reposo (misma fuente,
 * line-height, sin borde, fondo transparente); los botones colapsan a iconos para
 * que el ancho de la celda no cambie. Renderer agnóstico de la tabla: se proyecta
 * dentro de cualquier celda (cell-template de `sc-datatable`, `<td>` bespoke…).
 */
@Component({
  selector: 'sc-inline-rename-cell',
  imports: [FormsModule, ScIconComponent, TranslateModule],
  templateUrl: './sc-inline-rename-cell.component.html',
  styleUrl: './sc-inline-rename-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScInlineRenameCellComponent implements AfterViewInit {
  readonly initialValue = input.required<string>();
  readonly placeholder = input<string>('');
  /** aria-label del input. Si se omite, cae a `sc.inlineRenameCell.defaultAriaLabel`. */
  readonly ariaLabel = input<string>('');

  readonly commit = output<string>();
  readonly cancelled = output<void>();

  protected readonly checkIcon = 'check';
  protected readonly closeIcon = 'close';
  protected readonly iconSizeMd = SC_ICON_SIZE_MD;

  protected readonly value = signal('');

  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('input');

  constructor() {
    // Copy fijo colocado: registra solo el diccionario del componente.
    const translate = inject(TranslateService);
    for (const [language, dict] of Object.entries(SC_INLINE_RENAME_CELL_TRANSLATIONS)) {
      translate.setTranslation(language, dict, true);
    }
  }

  ngAfterViewInit(): void {
    this.value.set(this.initialValue());
    queueMicrotask(() => {
      const el = this.inputRef().nativeElement;
      el.focus();
      el.select();
    });
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onCommit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelled.emit();
    }
  }

  protected onCommit(): void {
    const next = this.value().trim();
    if (!next) return;
    this.commit.emit(next);
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}
