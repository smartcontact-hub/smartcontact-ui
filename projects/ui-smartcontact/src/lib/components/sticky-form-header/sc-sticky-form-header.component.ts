import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';

import { ScIconComponent } from '@smartcontact-hub/icons';

import { SC_STICKY_FORM_HEADER_TRANSLATIONS } from './i18n/sc-sticky-form-header.translations';

/**
 * Sticky bar at the top of every Create/Edit page (Users, Groups, Agents…).
 * Shows the entity title, optional editable name, plus Save / Cancel /
 * Delete actions. The "Save" button shows a spinner while `[saving]` is
 * true; "Save" is disabled while `[canSave]` is false.
 *
 * @deprecated RETENIDO PARA ROLLBACK (S59, Supervisor DD#65). Ya NO lo usa
 * ningún form de la app: los 3 form shells migraron al modelo "todo arriba"
 * (acciones al TopBar + la ficha del panel para la identidad). Se conserva
 * intacto —exportado + showcased en la demo— como red de seguridad por si se
 * revierte el "todo arriba". NO borrar sin decisión explícita (ver DD#65
 * § "Cómo revertir").
 *
 * i18n: las palabras de acción y el placeholder por defecto viven en el
 * diccionario colocado `sc.stickyFormHeader.*` (sin claves `common.*`). Iconos
 * vía `@smartcontact-hub/icons` (§4.6; `[spin]` para el spinner de Save).
 */
@Component({
  selector: 'sc-sticky-form-header',
  standalone: true,
  imports: [ButtonModule, FormsModule, ScIconComponent, TranslateModule],
  templateUrl: './sc-sticky-form-header.component.html',
  styleUrl: './sc-sticky-form-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScStickyFormHeaderComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly mode = input.required<'create' | 'edit'>();
  /** Entity-singular label key (`'users.entity_singular'`). */
  readonly entityKey = input.required<string>();
  /** Current entity name (display + edit target). */
  readonly name = input.required<string>();
  /** Disables the Save button while true. */
  readonly canSave = input(true);
  /** Replaces Save with a spinner while true. */
  readonly saving = input(false);
  /** i18n key for the create-mode name input placeholder. */
  readonly namePlaceholderKey = input<string>('sc.stickyFormHeader.namePlaceholder');
  /**
   * Whether to render the "Atrás" button in the actions cluster. Default
   * is `false` — the page-level breadcrumb already gives the user a way
   * back, so the form actions cluster only carries Save. Pass `true` to
   * opt-in (e.g. on a deeper modal where the breadcrumb isn't visible).
   */
  readonly showBack = input(false);

  readonly nameChange = output<string>();
  readonly save = output<void>();
  readonly cancelled = output<void>();

  protected readonly pencilIcon = 'edit';
  protected readonly checkIcon = 'check';
  protected readonly closeIcon = 'close';
  protected readonly backIcon = 'arrow_back';

  protected readonly editing = signal(false);
  protected readonly draftName = signal('');

  private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');

  protected readonly title = computed(() => {
    if (this.mode() === 'create') return this.entityKey();
    return this.name();
  });

  constructor() {
    // Copy fijo colocado: registra solo el diccionario del componente.
    const translate = inject(TranslateService);
    for (const [language, dict] of Object.entries(SC_STICKY_FORM_HEADER_TRANSLATIONS)) {
      translate.setTranslation(language, dict, true);
    }
  }

  /** Imperative trigger so the parent can request inline editing (e.g. from a "Rename" menu). */
  startEditing(): void {
    if (this.mode() !== 'edit') return;
    this.draftName.set(this.name());
    this.editing.set(true);
    queueMicrotask(() => this.nameInput()?.nativeElement.select());
  }

  protected onPencilClick(): void {
    this.startEditing();
  }

  protected onDraftInput(value: string): void {
    this.draftName.set(value);
  }

  protected confirmRename(): void {
    const next = this.draftName().trim();
    if (next && next !== this.name()) {
      this.nameChange.emit(next);
    }
    this.editing.set(false);
  }

  protected cancelRename(): void {
    this.draftName.set(this.name());
    this.editing.set(false);
  }

  protected onRenameKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.confirmRename();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelRename();
    }
  }

  /** True when the host element contains the focused/clicked element. */
  contains(target: Node | null): boolean {
    return !!target && this.host.nativeElement.contains(target);
  }
}
