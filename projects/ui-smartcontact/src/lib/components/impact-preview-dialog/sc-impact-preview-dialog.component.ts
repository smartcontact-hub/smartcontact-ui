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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';

import { SC_ICON_SIZE_MD, SC_ICON_SIZE_SM, ScIconComponent } from '@smartcontact/icons';

import { ScDialogComponent } from '../dialog/sc-dialog.component';
import { SC_IMPACT_PREVIEW_DIALOG_TRANSLATIONS } from './i18n/sc-impact-preview-dialog.translations';

export interface ImpactItem {
  readonly id: number;
  readonly name: string;
  /** Optional secondary text (e.g. "(3 grupos)"). */
  readonly hint?: string;
}

export interface ImpactBadge {
  readonly fieldLabel: string;
  readonly currentValueLabel?: string;
  readonly newValueLabel: string;
}

/**
 * Confirmation surface that previews a bulk operation (edit / duplicate)
 * before it commits. Items can be removed individually with hover-revealed
 * X buttons; the last item cannot be pruned (template guard).
 *
 * Compone la `sc-dialog` canónica (§4.3) como capa de modal; el badge, la lista
 * de items y la botonera se proyectan en su body/footer. Mirrors the React
 * prototype's `ImpactPreviewDialog` (DD#298).
 *
 * i18n: `title`, nombres de items y etiquetas del badge los suministra el
 * consumidor; las etiquetas por defecto de botón, el aria de quitar y el
 * mensaje de vacío viven en el diccionario colocado `sc.impactPreviewDialog.*`.
 * Iconos vía `@smartcontact/icons` (§4.6).
 */
@Component({
  selector: 'sc-impact-preview-dialog',
  standalone: true,
  imports: [ButtonModule, ScIconComponent, ScDialogComponent, TranslateModule],
  templateUrl: './sc-impact-preview-dialog.component.html',
  styleUrl: './sc-impact-preview-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScImpactPreviewDialogComponent {
  readonly visible = input.required<boolean>();
  readonly mode = input.required<'bulkEdit' | 'duplicate'>();
  readonly title = input.required<string>();
  readonly items = input.required<readonly ImpactItem[]>();
  readonly badge = input<ImpactBadge | null>(null);
  /** Override de la etiqueta del botón confirmar; default colocado `…confirm`. */
  readonly confirmLabel = input<string | null>(null);
  /** Override de la etiqueta del botón cancelar; default colocado `…cancel`. */
  readonly cancelLabel = input<string | null>(null);

  readonly cancelled = output<void>();
  /** Emits the surviving ids in the order they were originally given. */
  readonly confirm = output<readonly number[]>();

  protected readonly arrowIcon = 'arrow_forward';
  protected readonly duplicateIcon = 'content_copy';
  protected readonly closeIcon = 'close';
  protected readonly iconSizeMd = SC_ICON_SIZE_MD;
  protected readonly iconSizeSm = SC_ICON_SIZE_SM;

  protected readonly removedIds = signal<ReadonlySet<number>>(new Set());

  protected readonly survivingItems = computed(() =>
    this.items().filter((item) => !this.removedIds().has(item.id)),
  );

  protected readonly canConfirm = computed(() => this.survivingItems().length > 0);

  constructor() {
    // Copy fijo colocado: registra solo el diccionario del componente.
    const translate = inject(TranslateService);
    for (const [language, dict] of Object.entries(SC_IMPACT_PREVIEW_DIALOG_TRANSLATIONS)) {
      translate.setTranslation(language, dict, true);
    }
    // Reset chip pruning whenever a new operation is requested.
    effect(() => {
      this.items();
      this.removedIds.set(new Set());
    });
  }

  protected remove(id: number): void {
    // The "remove" button on a chip is disabled when only one item is
    // left (template-side guard), so this method is unreachable when
    // pruning would leave the list empty. Drop the previous auto-close
    // — same reasoning as DeleteEntityDialog (PR #10): users were
    // losing the operation by accident.
    const next = new Set(this.removedIds());
    next.add(id);
    this.removedIds.set(next);
  }

  protected onConfirm(): void {
    if (!this.canConfirm()) return;
    this.confirm.emit(this.survivingItems().map((item) => item.id));
  }
}
