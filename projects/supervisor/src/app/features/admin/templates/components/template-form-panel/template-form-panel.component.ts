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
import { TranslateModule } from '@ngx-translate/core';

import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScInputTextComponent as InputTextComponent } from '@smartcontact-hub/components';
import { Template, TemplateType } from '../../data/templates-data';

export interface TemplateFormSubmission {
  readonly title: string;
  readonly type: TemplateType;
  readonly body: string;
}

/**
 * Inline create / edit panel for templates. Shows a title input, a chat /
 * email channel toggle, and a body textarea with a variables hint
 * (`{agente}`, `{cliente}`, `{ref}`, `{fecha}`). Validation: required title,
 * required body, no duplicate titles (case-insensitive, ignoring the current
 * record).
 */
@Component({
  selector: 'sc-template-form-panel',
  imports: [FormsModule, IconComponent, InputTextComponent, TranslateModule],
  templateUrl: './template-form-panel.component.html',
  styleUrl: './template-form-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateFormPanelComponent implements OnInit, AfterViewInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly initial = input<Template | null>(null);
  /** Currently selected tab; used as the default channel for new templates. */
  readonly defaultType = input<TemplateType>('chat');
  readonly existingTitles = input.required<readonly string[]>();

  readonly save = output<TemplateFormSubmission>();
  readonly cancelled = output<void>();

  protected readonly alertIcon = 'warning';
  protected readonly chatIcon = 'chat_bubble';
  protected readonly emailIcon = 'mail';
  protected readonly typeOptions: readonly TemplateType[] = ['chat', 'email'];

  protected readonly title = signal('');
  protected readonly type = signal<TemplateType>('chat');
  protected readonly body = signal('');
  protected readonly error = signal('');

  @ViewChild('titleInput', { read: ElementRef })
  private readonly titleInput?: ElementRef<HTMLElement>;

  ngOnInit(): void {
    const seed = this.initial();
    if (seed) {
      this.title.set(seed.title);
      this.type.set(seed.type);
      this.body.set(seed.body);
    } else {
      this.type.set(this.defaultType());
    }
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.titleInput?.nativeElement.querySelector('input')?.focus());
  }

  protected setType(type: TemplateType): void {
    this.type.set(type);
  }

  protected onTitleInput(value: string): void {
    this.title.set(value);
    if (this.error()) this.error.set('');
  }

  protected onBodyInput(value: string): void {
    this.body.set(value);
    if (this.error()) this.error.set('');
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSave();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelled.emit();
    }
  }

  protected onSave(): void {
    if (!this.validate()) return;
    this.save.emit({
      title: this.title().trim(),
      type: this.type(),
      body: this.body().trim(),
    });
  }

  /** True when the host element contains the focused/clicked element. */
  contains(target: Node | null): boolean {
    return !!target && this.host.nativeElement.contains(target);
  }

  private validate(): boolean {
    const trimmed = this.title().trim();
    if (!trimmed) {
      this.error.set('templates.errors.title_required');
      return false;
    }
    const initial = this.initial();
    const duplicate = this.existingTitles().some(
      (t) =>
        t.toLowerCase() === trimmed.toLowerCase() &&
        t.toLowerCase() !== (initial?.title ?? '').toLowerCase(),
    );
    if (duplicate) {
      this.error.set('templates.errors.duplicate_title');
      return false;
    }
    if (!this.body().trim()) {
      this.error.set('templates.errors.body_required');
      return false;
    }
    this.error.set('');
    return true;
  }
}
