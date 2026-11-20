import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScIconComponent } from '@smartcontact-hub/icons';

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
  imports: [ScIconComponent, TranslateModule],
  templateUrl: './sc-inline-rename-cell.component.html',
  styleUrl: './sc-inline-rename-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScInlineRenameCellComponent implements OnInit {
  /** El texto con el que empieza la edición. */
  readonly initialValue = input.required<string>();
  /** Texto guía mientras el campo está vacío. */
  readonly placeholder = input<string>('');
  /** aria-label del input. Si se omite, cae a `sc.inlineRenameCell.defaultAriaLabel`. */
  readonly ariaLabel = input<string>('');

  /** El usuario ha confirmado el nombre nuevo. Lleva el texto final. */
  readonly commit = output<string>();
  /** El usuario ha cancelado; el nombre se queda como estaba. */
  readonly cancelled = output<void>();

  protected readonly checkIcon = 'check';
  protected readonly closeIcon = 'close';

  protected readonly value = signal('');

  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('input');

  constructor() {
    // Copy fijo colocado: registra solo el diccionario del componente.
    const translate = inject(TranslateService);
    for (const [language, dict] of Object.entries(SC_INLINE_RENAME_CELL_TRANSLATIONS)) {
      translate.setTranslation(language, dict, true);
    }
    // El foco y la selección van DESPUÉS del render, cuando el campo ya tiene el nombre. Antes se hacían en una
    // microtarea desde `ngAfterViewInit`, y el valor llegaba al campo por `ngModel`, que también lo escribe en
    // una microtarea pero encolada más tarde: `select()` seleccionaba un campo vacío, el nombre entraba después
    // con el cursor al final y lo tecleado se pegaba detrás del nombre copiado.
    afterNextRender(() => {
      const el = this.inputRef().nativeElement;
      el.focus();
      el.select();
    });
  }

  ngOnInit(): void {
    // Se siembra antes del primer render para que el campo nazca con el nombre: el binding `[value]` lo escribe
    // en el mismo ciclo, sin la escritura diferida de `ngModel`.
    this.value.set(this.initialValue());
  }

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
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
