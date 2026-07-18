import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
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

import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScInputTextComponent as InputTextComponent } from '@smartcontact-hub/components';
import {
  ColorDotOption,
  ScColorDotPickerComponent as ColorDotPickerComponent,
} from '@smartcontact-hub/components';
import { LABEL_COLOR_OPTIONS, Label, LabelColor } from '../../data/labels-data';

export interface LabelFormSubmission {
  readonly name: string;
  readonly color: LabelColor;
  readonly description: string;
}

/**
 * Inline create/edit panel anchored next to the row or "New" button.
 *
 * Validates locally (required name + duplicate detection ignoring the current
 * record) before emitting the payload. Closes on Enter (save) and Escape
 * (cancel).
 */
@Component({
  selector: 'sc-label-form-panel',
  imports: [
    ColorDotPickerComponent,
    FormsModule,
    IconComponent,
    InputTextComponent,
    TranslateModule,
  ],
  templateUrl: './label-form-panel.component.html',
  styleUrl: './label-form-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelFormPanelComponent implements OnInit, AfterViewInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly translate = inject(TranslateService);

  readonly initial = input<Label | null>(null);
  readonly existingNames = input.required<readonly string[]>();

  readonly save = output<LabelFormSubmission>();
  readonly cancelled = output<void>();

  protected readonly alertIcon = 'warning';
  protected readonly colorOptions = computed<readonly ColorDotOption[]>(() =>
    LABEL_COLOR_OPTIONS.map((option) => ({
      value: option.value,
      label: this.translate.instant(option.labelKey),
      color: option.color,
    })),
  );

  protected readonly name = signal('');
  protected readonly color = signal<LabelColor>('blue');
  protected readonly description = signal('');
  protected readonly error = signal('');

  @ViewChild('nameInput', { read: ElementRef })
  private readonly nameInput?: ElementRef<HTMLElement>;

  ngOnInit(): void {
    const seed = this.initial();
    if (seed) {
      this.name.set(seed.name);
      this.color.set(seed.color);
      this.description.set(seed.description ?? '');
    }
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.nameInput?.nativeElement.querySelector('input')?.focus());
  }

  protected onNameInput(value: string): void {
    this.name.set(value);
    if (this.error()) this.error.set('');
  }

  protected onSave(): void {
    if (!this.validate()) return;
    this.save.emit({
      name: this.name().trim(),
      color: this.color(),
      description: this.description().trim(),
    });
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSave();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelled.emit();
    }
  }

  /** True when the host element contains the focused/clicked element. */
  contains(target: Node | null): boolean {
    return !!target && this.host.nativeElement.contains(target);
  }

  private validate(): boolean {
    const trimmed = this.name().trim();
    if (!trimmed) {
      this.error.set('labels.errors.name_required');
      return false;
    }
    const initial = this.initial();
    const duplicate = this.existingNames().some(
      (n) =>
        n.toLowerCase() === trimmed.toLowerCase() &&
        n.toLowerCase() !== (initial?.name ?? '').toLowerCase(),
    );
    if (duplicate) {
      this.error.set('labels.errors.duplicate_name');
      return false;
    }
    this.error.set('');
    return true;
  }
}
