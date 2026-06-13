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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';

import { SC_ICON_SIZE_MD, SC_ICON_SIZE_SM, ScIconComponent } from '@smartcontact/icons';

import { ScClipboardService } from '../../core/services/sc-clipboard.service';
import { ScDialogComponent } from '../dialog/sc-dialog.component';
import { SC_DELETE_ENTITY_DIALOG_TRANSLATIONS } from './i18n/sc-delete-entity-dialog.translations';

export interface DeletableEntity {
  readonly id: number;
  readonly name: string;
}

/**
 * Shared confirmation dialog for entity deletion (Users, Groups, Agents,
 * Templates…). Two modes:
 *
 *   - **single**: the user must re-type the entity name (with a copy-name
 *     button as a Fitts shortcut). Confirms only the bound id.
 *   - **bulk**: a wall of removable chips lets the user prune the list
 *     before confirming. Emits the surviving ids on confirm.
 *
 * Compone la `sc-dialog` canónica (§4.3). Mirrors the React prototype's
 * `DeleteEntityDialog` (DD#163, DD#172).
 *
 * Acoplamiento §5 saldado: `ScClipboardService` se porta al paquete
 * (autocontenido). `MessageService` (PrimeNG) se inyecta OPCIONAL — el toast de
 * «copiado» es nice-to-have; sin infra de toast el copiado sigue funcionando.
 *
 * i18n: los nombres de entidad/items los suministra el consumidor; todo el
 * chrome vive en el diccionario colocado `sc.deleteEntityDialog.*` (sin claves
 * `common.*`). Iconos vía `@smartcontact/icons` (§4.6).
 */
@Component({
  selector: 'sc-delete-entity-dialog',
  standalone: true,
  imports: [ButtonModule, FormsModule, ScIconComponent, ScDialogComponent, TranslateModule],
  templateUrl: './sc-delete-entity-dialog.component.html',
  styleUrl: './sc-delete-entity-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScDeleteEntityDialogComponent {
  private readonly clipboard = inject(ScClipboardService);
  /** Opcional: el toast de «copiado» degrada si no hay infra de toast. */
  private readonly messages = inject(MessageService, { optional: true });
  private readonly translate = inject(TranslateService);

  readonly visible = input.required<boolean>();
  readonly mode = input.required<'single' | 'bulk'>();
  readonly items = input.required<readonly DeletableEntity[]>();
  readonly entitySingular = input.required<string>();
  readonly entityPlural = input.required<string>();
  /** Optional extra paragraph shown under the single-mode body. */
  readonly singleDetailMessage = input<string | null>(null);
  /** Optional footer paragraph for bulk mode. */
  readonly bulkFooterMessage = input<string | null>(null);

  readonly cancelled = output<void>();
  /** Emits the ids that survived chip pruning (bulk) or `null` for single. */
  readonly confirm = output<readonly number[] | null>();

  protected readonly alertIcon = 'warning';
  protected readonly copyIcon = 'content_copy';
  protected readonly checkIcon = 'check';
  protected readonly closeIcon = 'close';
  protected readonly iconSizeMd = SC_ICON_SIZE_MD;
  protected readonly iconSizeSm = SC_ICON_SIZE_SM;

  protected readonly confirmText = signal('');
  protected readonly copied = signal(false);
  protected readonly visibleIds = signal<ReadonlySet<number>>(new Set());

  protected readonly visibleItems = computed(() =>
    this.items().filter((item) => this.visibleIds().has(item.id)),
  );

  protected readonly singleTarget = computed(() =>
    this.mode() === 'single' ? (this.items()[0]?.name ?? '') : '',
  );

  protected readonly canConfirm = computed(() => {
    if (this.mode() === 'single') {
      return this.confirmText() === this.singleTarget();
    }
    return this.visibleItems().length > 0;
  });

  /** i18n title resolved from mode + count, fed into `<sc-dialog [title]>`. */
  protected readonly dialogTitle = computed(() => {
    if (this.mode() === 'single') {
      return this.translate.instant('sc.deleteEntityDialog.titleSingle', {
        entity: this.entitySingular(),
      });
    }
    return this.translate.instant('sc.deleteEntityDialog.titleBulk', {
      count: this.visibleItems().length,
      entity: this.entityPlural(),
    });
  });

  /** Single mode shows the target name in the subtitle (the "what you're about to delete"). */
  protected readonly dialogSubtitle = computed<string | null>(() => {
    if (this.mode() === 'single') {
      return this.translate.instant('sc.deleteEntityDialog.bodySingle', {
        entity: this.entitySingular(),
        name: this.singleTarget(),
      });
    }
    return this.translate.instant('sc.deleteEntityDialog.bodyBulk', {
      entity: this.entityPlural(),
    });
  });

  constructor() {
    // Copy fijo colocado: registra solo el diccionario del componente.
    for (const [language, dict] of Object.entries(SC_DELETE_ENTITY_DIALOG_TRANSLATIONS)) {
      this.translate.setTranslation(language, dict, true);
    }
    // Reset internal state every time the items list changes (i.e. a new
    // delete is requested) so the chip pruning and typed name don't bleed
    // across openings.
    effect(() => {
      const next = new Set(this.items().map((item) => item.id));
      this.visibleIds.set(next);
      this.confirmText.set('');
      this.copied.set(false);
    });
  }

  protected onCopy(): void {
    void this.clipboard.copy(this.singleTarget()).then((ok) => {
      if (ok) {
        this.copied.set(true);
        this.messages?.add({
          severity: 'success',
          summary: this.translate.instant('sc.deleteEntityDialog.copied'),
          life: 2000,
        });
        setTimeout(() => this.copied.set(false), 2000);
      } else {
        this.messages?.add({
          severity: 'error',
          summary: this.translate.instant('sc.deleteEntityDialog.copyFailed'),
          life: 3000,
        });
      }
    });
  }

  protected removeChip(id: number): void {
    const next = new Set(this.visibleIds());
    next.delete(id);
    // Keep the dialog open even when the last chip is pruned. The user
    // sees an empty-state message and Confirm stays disabled (canConfirm
    // tracks `visibleItems().length > 0`); they can still cancel
    // explicitly. Auto-closing here was a footgun — users lost their
    // delete action by accident.
    this.visibleIds.set(next);
  }

  /** Re-stage every original item — recovery from "I pruned everything by accident". */
  protected resetChips(): void {
    this.visibleIds.set(new Set(this.items().map((item) => item.id)));
  }

  protected onConfirm(): void {
    if (!this.canConfirm()) return;
    if (this.mode() === 'single') {
      this.confirm.emit(null);
    } else {
      this.confirm.emit(Array.from(this.visibleIds()));
    }
  }
}
