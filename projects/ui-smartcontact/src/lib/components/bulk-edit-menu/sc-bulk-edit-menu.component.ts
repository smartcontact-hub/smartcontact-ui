import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonModule } from 'primeng/button';

import { ScSelectComponent } from '../select/sc-select.component';

import { SC_BULK_EDIT_MENU_TRANSLATIONS } from './i18n/sc-bulk-edit-menu.translations';

export interface BulkEditFieldOption {
  /** Stable key passed back to the caller. */
  readonly key: string;
  /** Translated label shown in the field selector. */
  readonly label: string;
  /** Choices for this field. The first one becomes the default. */
  readonly values: readonly BulkEditValueOption[];
}

export interface BulkEditValueOption {
  readonly value: string;
  readonly label: string;
}

export interface BulkEditCommit {
  readonly fieldKey: string;
  readonly fieldLabel: string;
  readonly value: string;
  readonly valueLabel: string;
}

/** «Todos los que tienen `value` en `fieldKey`»: el consumidor rehace la selección con esas filas. */
export interface BulkEditMatch {
  readonly fieldKey: string;
  readonly value: string;
}

/**
 * Inline `Cambiar [field] a [value] [Aplicar]` editor that lives in the
 * bulk action bar. Caller supplies the fields and value choices; this
 * component orchestrates the picker and emits a single `commit` once
 * Aplicar is pressed.
 *
 * The actual mutation typically opens an `ImpactPreviewDialog` on top so the
 * user can prune affected rows before applying. This menu intentionally does
 * not own that dialog — caller can pipe `commit` straight into the preview.
 *
 * i18n: las etiquetas de campos/valores las suministra el consumidor ya
 * traducidas; las palabras de conexión de la frase + el rótulo del grupo
 * viven en el diccionario colocado `sc.bulkEditMenu.*` (sin claves `common.*`).
 */
@Component({
  selector: 'sc-bulk-edit-menu',
  standalone: true,
  imports: [ButtonModule, ScSelectComponent, TranslateModule],
  templateUrl: './sc-bulk-edit-menu.component.html',
  styleUrl: './sc-bulk-edit-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScBulkEditMenuComponent {
  /** Qué campos se pueden cambiar en bloque, con el tipo de cada uno. */
  readonly fields = input.required<readonly BulkEditFieldOption[]>();
  /** Retained for source compatibility; no longer rendered. */
  readonly buttonLabel = input<string>('Editar');
  /** Añade «de [valor]» a la frase: elegir un valor pide seleccionar todas las filas que lo tienen (`match`). */
  readonly matchable = input(false, { transform: booleanAttribute });

  /**
   * El usuario ha confirmado el cambio masivo. Lleva qué campo y con qué valor; **aplicarlo es de
   * la app**.
   */
  readonly commit = output<BulkEditCommit>();
  readonly match = output<BulkEditMatch>();

  protected readonly selectedFieldKey = signal<string>('');
  protected readonly selectedValue = signal<string>('');
  /** '' = la selección tal cual. */
  protected readonly fromValue = signal<string>('');

  protected readonly fromOptions = computed<readonly BulkEditValueOption[]>(() => [
    { value: '', label: this.translate.instant('sc.bulkEditMenu.fromSelection') },
    ...(this.selectedField()?.values ?? []),
  ]);

  protected readonly selectedField = computed<BulkEditFieldOption | null>(
    () => this.fields().find((f) => f.key === this.selectedFieldKey()) ?? this.fields()[0] ?? null,
  );

  protected readonly canApply = computed(() => {
    const field = this.selectedField();
    if (!field) return false;
    return field.values.some((v) => v.value === this.selectedValue());
  });

  private readonly translate = inject(TranslateService);

  constructor() {
    // Copy fijo colocado: registra solo el diccionario del componente.
    for (const [language, dict] of Object.entries(SC_BULK_EDIT_MENU_TRANSLATIONS)) {
      this.translate.setTranslation(language, dict, true);
    }

    effect(() => {
      const first = this.fields()[0];
      if (!first) return;
      if (!this.selectedFieldKey()) this.selectedFieldKey.set(first.key);
      if (!this.selectedValue()) this.selectedValue.set(first.values[0]?.value ?? '');
    });
  }

  protected onFieldValueChange(value: unknown): void {
    if (typeof value !== 'string') return;
    this.selectedFieldKey.set(value);
    /* Cascade reset: el nuevo field puede no soportar el value previo. Caer
     * al primer value del nuevo field garantiza un commit consistente. */
    const next = this.fields().find((f) => f.key === value)?.values[0]?.value ?? '';
    this.selectedValue.set(next);
    this.fromValue.set('');
  }

  protected onFromValueChange(value: unknown): void {
    if (typeof value !== 'string') return;
    this.fromValue.set(value);
    const field = this.selectedField();
    if (!value || !field) return;
    // «de Baja a Baja» no cambia nada: el destino salta al primer valor distinto.
    if (this.selectedValue() === value) {
      this.selectedValue.set(field.values.find((v) => v.value !== value)?.value ?? value);
    }
    this.match.emit({ fieldKey: field.key, value });
  }

  protected onValueValueChange(value: unknown): void {
    if (typeof value === 'string') this.selectedValue.set(value);
  }

  protected onApply(): void {
    const field = this.selectedField();
    if (!field) return;
    const value = this.selectedValue();
    const valueOpt = field.values.find((v) => v.value === value);
    if (!valueOpt) return;
    this.commit.emit({
      fieldKey: field.key,
      fieldLabel: field.label,
      value: valueOpt.value,
      valueLabel: valueOpt.label,
    });
  }
}
