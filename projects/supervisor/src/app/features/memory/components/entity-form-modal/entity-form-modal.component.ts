import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { ScInputTextComponent as InputTextComponent } from '@smartcontact-hub/components';
import { ScDialogComponent as DialogComponent } from '@smartcontact-hub/components';
import { ScSelectComponent as SelectComponent } from '@smartcontact-hub/components';

import type { Entity, EntityListValue, EntityType } from '../../data/entity.types';
import { EntitiesStore } from '../../state/entities.store';

interface EntityTypeOption {
  readonly value: EntityType;
  readonly labelKey: string;
}

interface ListValueDraft {
  value: string;
  synonymsCsv: string;
  expanded: boolean;
}

/**
 * EntityFormModal · Crear + Editar entidades user · iter 10b + S48 synonyms.
 *
 * Unifica `CreateEntityModal` (288 líneas) + `EditEntitySidepanel`
 * (575 líneas) del prototipo React. Usa `sc-dialog` SCDS — no
 * sidepanel separado: el modal con form es suficiente y consistente
 * con el patrón Memory (BulkTranscriptionModal, ConversationPlayerModal).
 *
 * Campos:
 *   - Name (required, min 3 chars, unique)
 *   - Description (opcional)
 *   - Type (select 18 tipos, locked en edit)
 *   - Format (opcional, hint string)
 *   - List values (solo si type === 'list'): por valor, opcional
 *     synonyms (CSV en UI, array al persistir). Trigger collapsable
 *     "Añadir sinónimos" por row — patrón 1:1 con React legacy.
 *
 * Modos:
 *   - `entity` undefined → Create mode.
 *   - `entity` Entity → Edit mode (carga datos, type locked).
 */
@Component({
  selector: 'sc-memory-entity-form-modal',
  imports: [
    ButtonComponent,
    FormsModule,
    IconComponent,
    InputTextComponent,
    DialogComponent,
    SelectComponent,
    TranslateModule,
  ],
  templateUrl: './entity-form-modal.component.html',
  styleUrl: './entity-form-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityFormModalComponent {
  private readonly entitiesStore = inject(EntitiesStore);

  // input con default false: previene NG0950 cuando el effect del
  // constructor lee `this.visible()` antes del primer binding.
  readonly visible = input<boolean>(false);
  /** Si se pasa, el modal entra en edit mode. Si null/undefined → create. */
  readonly entity = input<Entity | null>(null);

  readonly closed = output<void>();
  readonly saved = output<Entity>();

  protected readonly databaseIcon = 'database';
  protected readonly plusIcon = 'add';
  protected readonly trashIcon = 'delete';

  protected readonly typeOptions: EntityTypeOption[] = [
    { value: 'text', labelKey: 'memory.entities.types.text' },
    { value: 'number', labelKey: 'memory.entities.types.number' },
    { value: 'date', labelKey: 'memory.entities.types.date' },
    { value: 'datetime', labelKey: 'memory.entities.types.datetime' },
    { value: 'email', labelKey: 'memory.entities.types.email' },
    { value: 'phone', labelKey: 'memory.entities.types.phone' },
    { value: 'phone_number', labelKey: 'memory.entities.types.phone_number' },
    { value: 'list', labelKey: 'memory.entities.types.list' },
    { value: 'name', labelKey: 'memory.entities.types.name' },
    { value: 'age', labelKey: 'memory.entities.types.age' },
    { value: 'url', labelKey: 'memory.entities.types.url' },
    { value: 'ordinal', labelKey: 'memory.entities.types.ordinal' },
    { value: 'currency', labelKey: 'memory.entities.types.currency' },
    { value: 'dimension', labelKey: 'memory.entities.types.dimension' },
    { value: 'geography', labelKey: 'memory.entities.types.geography' },
    { value: 'key_phrase', labelKey: 'memory.entities.types.key_phrase' },
    { value: 'percentage', labelKey: 'memory.entities.types.percentage' },
    { value: 'temperature', labelKey: 'memory.entities.types.temperature' },
  ];

  protected readonly name = signal('');
  protected readonly description = signal('');
  protected readonly type = signal<EntityType>('text');
  protected readonly format = signal('');
  protected readonly listValues = signal<readonly ListValueDraft[]>([]);

  protected readonly isEditMode = computed(() => this.entity() !== null);

  protected readonly nameInvalidLength = computed(
    () => this.name().trim().length > 0 && this.name().trim().length < 3,
  );

  protected readonly nameInvalidDuplicate = computed(() => {
    const trimmed = this.name().trim();
    if (trimmed.length < 3) return false;
    return this.entitiesStore.isNameTaken(trimmed, this.entity()?.id);
  });

  protected readonly nameError = computed<string | null>(() => {
    if (this.nameInvalidLength()) {
      return 'memory.entities.form.name_error_short';
    }
    if (this.nameInvalidDuplicate()) {
      return 'memory.entities.form.name_error_duplicate';
    }
    return null;
  });

  protected readonly canSave = computed(
    () =>
      this.name().trim().length >= 3 &&
      !this.nameInvalidDuplicate() &&
      (this.type() !== 'list' || this.listValues().length > 0),
  );

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      const e = this.entity();
      if (e) {
        this.name.set(e.name);
        this.description.set(e.description);
        this.type.set(e.type);
        this.format.set(e.format ?? '');
        this.listValues.set(
          e.config?.listValues?.map((v) => ({
            value: v.value,
            synonymsCsv: v.synonyms.join(', '),
            expanded: v.synonyms.length > 0,
          })) ?? [],
        );
      } else {
        this.name.set('');
        this.description.set('');
        this.type.set('text');
        this.format.set('');
        this.listValues.set([]);
      }
    });
  }

  protected setName(v: string): void {
    this.name.set(v);
  }

  protected setDescription(v: string): void {
    this.description.set(v);
  }

  protected setFormat(v: string): void {
    this.format.set(v);
  }

  protected addListValue(): void {
    this.listValues.update((arr) => [...arr, { value: '', synonymsCsv: '', expanded: false }]);
  }

  protected updateListValueText(index: number, value: string): void {
    this.listValues.update((arr) => arr.map((d, i) => (i === index ? { ...d, value } : d)));
  }

  protected updateListValueSynonyms(index: number, synonymsCsv: string): void {
    this.listValues.update((arr) => arr.map((d, i) => (i === index ? { ...d, synonymsCsv } : d)));
  }

  protected toggleListValueSynonyms(index: number): void {
    this.listValues.update((arr) =>
      arr.map((d, i) => (i === index ? { ...d, expanded: !d.expanded } : d)),
    );
  }

  protected removeListValue(index: number): void {
    this.listValues.update((arr) => arr.filter((_, i) => i !== index));
  }

  protected onCancel(): void {
    this.closed.emit();
  }

  protected onSave(): void {
    if (!this.canSave()) return;
    const listValuesClean: EntityListValue[] = this.listValues()
      .filter((d) => d.value.trim().length > 0)
      .map((d) => ({
        value: d.value.trim(),
        synonyms: d.synonymsCsv
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
      }));

    const base = {
      name: this.name().trim(),
      description: this.description().trim(),
      type: this.type(),
      format: this.format().trim() || undefined,
      config:
        this.type() === 'list' && listValuesClean.length > 0
          ? { listValues: listValuesClean }
          : undefined,
    };

    const editing = this.entity();
    if (editing) {
      this.entitiesStore.updateEntity(editing.id, base);
      const updated = this.entitiesStore.getEntity(editing.id)!;
      this.saved.emit(updated);
    } else {
      const created = this.entitiesStore.addEntity(base);
      this.saved.emit(created);
    }
  }
}
