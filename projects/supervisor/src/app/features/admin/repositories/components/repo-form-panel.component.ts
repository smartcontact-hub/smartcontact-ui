import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PrimeTemplate } from 'primeng/api';

import {
  ScInputTextComponent as InputTextComponent,
  ScSelectComponent as SelectComponent,
} from '@smartcontact-hub/components';
import { RepoEntity, RepoFieldDef } from './repo-types';

export type RepoFormSubmission = Readonly<Record<string, string>>;

/**
 * Generic create / edit panel rendered by `<sc-repo-list-page>` for every
 * repository instance. Field set is data-driven; supports text, textarea and
 * select inputs. Validates required fields and the duplicate-name constraint
 * (case-insensitive, ignoring the current record).
 */
@Component({
  selector: 'sc-repo-form-panel',
  imports: [
    FormsModule,
    IconComponent,
    InputTextComponent,
    PrimeTemplate,
    SelectComponent,
    TranslateModule,
  ],
  templateUrl: './repo-form-panel.component.html',
  styleUrl: './repo-form-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepoFormPanelComponent<T extends RepoEntity> implements OnInit, AfterViewInit {
  private readonly translate = inject(TranslateService);

  readonly fields = input.required<readonly RepoFieldDef[]>();
  readonly initial = input<T | null>(null);
  readonly existingNames = input.required<readonly string[]>();
  /** Nombre singular de la entidad ya traducido (resuelto en el caller via
   *  `translate.instant(config().entitySingularKey)`). S51 sweep AED i18n. */
  readonly entitySingular = input.required<string>();

  readonly save = output<RepoFormSubmission>();
  readonly cancelled = output<void>();

  protected readonly alertIcon = 'warning';
  protected readonly values = signal<Record<string, string>>({});
  protected readonly error = signal('');

  @ViewChild('firstInput', { read: ElementRef })
  private readonly firstInput?: ElementRef<HTMLElement>;

  ngOnInit(): void {
    const seed = this.initial();
    const next: Record<string, string> = {};
    for (const field of this.fields()) {
      if (seed) {
        const raw = (seed as unknown as Record<string, unknown>)[field.key];
        next[field.key] = raw == null ? '' : String(raw);
      } else if (field.type === 'select' && field.options?.length) {
        next[field.key] = field.options[0]!.value;
      } else {
        next[field.key] = '';
      }
    }
    this.values.set(next);
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.firstInput?.nativeElement.querySelector('input')?.focus());
  }

  protected onChange(key: string, value: string): void {
    this.values.update((current) => ({ ...current, [key]: value }));
    if (this.error()) this.error.set('');
  }

  protected onSelectValueChange(key: string, value: unknown): void {
    if (typeof value === 'string') this.onChange(key, value);
  }

  protected onKey(event: KeyboardEvent, allowEnterSave = true): void {
    if (event.key === 'Enter' && !event.shiftKey && allowEnterSave) {
      event.preventDefault();
      this.onSave();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelled.emit();
    }
  }

  protected onSave(): void {
    if (!this.validate()) return;
    const trimmed: Record<string, string> = {};
    for (const field of this.fields()) {
      trimmed[field.key] = this.values()[field.key]?.trim() ?? '';
    }
    this.save.emit(trimmed);
  }

  private validate(): boolean {
    const values = this.values();
    const name = (values['name'] ?? '').trim();
    if (!name) {
      this.error.set(this.translate.instant('repositories.errors.name_required'));
      return false;
    }
    const initialName = this.initial()?.name ?? '';
    const duplicate = this.existingNames().some(
      (n) =>
        n.toLowerCase() === name.toLowerCase() && n.toLowerCase() !== initialName.toLowerCase(),
    );
    if (duplicate) {
      this.error.set(
        this.translate.instant('repositories.errors.duplicate_name', {
          entity: this.entitySingular(),
        }),
      );
      return false;
    }
    for (const field of this.fields()) {
      if (field.required && !(values[field.key] ?? '').trim()) {
        this.error.set(
          this.translate.instant('repositories.errors.field_required', {
            field: this.translate.instant(field.labelKey),
          }),
        );
        return false;
      }
    }
    this.error.set('');
    return true;
  }
}
