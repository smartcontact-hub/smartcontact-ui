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

import { ScIconComponent } from '@smartcontact-hub/icons';

import { ScClipboardService } from '../../core/services/sc-clipboard.service';
import { ScDialogComponent } from '../dialog/sc-dialog.component';
import { SC_DELETE_ENTITY_DIALOG_TRANSLATIONS } from './i18n/sc-delete-entity-dialog.translations';

export interface DeletableEntity {
  readonly id: number;
  readonly name: string;
}

/**
 * Shared confirmation dialog for entity deletion (Users, Groups, Agents,
 * Templates…). Two modes, ONE form: both ask to re-type something before
 * Delete enables, with a copy button as a Fitts shortcut (2026-09-24:
 * borrar uno o varios es igual de irreversible, así que pide lo mismo;
 * antes el lote se confirmaba con un clic).
 *
 *   - **single**: re-type the entity name. Emits `null` on confirm.
 *   - **bulk**: re-type how many go («3 agentes»). Emits every id on confirm.
 *
 * El lote ya no enseña la lista de nombres para quitar alguno (2026-09-24):
 * con 500 seleccionados se salía del diálogo y tapaba el campo. Quien quiera dejar uno fuera lo desmarca en la tabla.
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
 * `common.*`). Iconos vía `@smartcontact-hub/icons` (§4.6).
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

  /** Si el diálogo se ve. Lo controla el consumidor: este componente no se abre ni se cierra solo. */
  readonly visible = input.required<boolean>();
  /**
   * `single` para borrar un elemento y `bulk` para varios. Cambia el texto y lo que se enseña de la
   * lista.
   */
  readonly mode = input.required<'single' | 'bulk'>();
  /**
   * Lo que se va a borrar. Se enseña para que el usuario confirme sobre lo concreto y no sobre un
   * número.
   */
  readonly items = input.required<readonly DeletableEntity[]>();
  /**
   * Cómo se llama una de estas cosas («usuario»), para que el mensaje hable el idioma de la
   * pantalla.
   */
  readonly entitySingular = input.required<string>();
  /** Cómo se llaman en plural («usuarios»), para el mismo mensaje cuando son varias. */
  readonly entityPlural = input.required<string>();
  /** Optional extra paragraph shown under the single-mode body. */
  readonly singleDetailMessage = input<string | null>(null);
  /** Optional extra paragraph shown under the bulk-mode body. */
  readonly bulkFooterMessage = input<string | null>(null);

  /** El usuario se ha echado atrás. No se borra nada. */
  readonly cancelled = output<void>();
  /** Emits every id (bulk) or `null` (single). */
  readonly confirm = output<readonly number[] | null>();

  protected readonly alertIcon = 'warning';
  protected readonly copyIcon = 'content_copy';
  protected readonly checkIcon = 'check';

  protected readonly confirmText = signal('');
  protected readonly copied = signal(false);

  /** La línea de detalle del modo que toque. */
  protected readonly detailMessage = computed(() =>
    this.mode() === 'single' ? this.singleDetailMessage() : this.bulkFooterMessage(),
  );

  protected readonly singleTarget = computed(() =>
    this.mode() === 'single' ? (this.items()[0]?.name ?? '') : '',
  );

  /** Lo que hay que teclear: el nombre si es uno, cuántos si son varios («3 agentes»). */
  protected readonly confirmTarget = computed(() =>
    this.mode() === 'single'
      ? this.singleTarget()
      : `${this.items().length} ${this.entityPlural()}`,
  );

  protected readonly canConfirm = computed(
    () => this.items().length > 0 && this.confirmText().trim() === this.confirmTarget(),
  );

  /** i18n title resolved from mode + count, fed into `<sc-dialog [title]>`. */
  protected readonly dialogTitle = computed(() => {
    if (this.mode() === 'single') {
      return this.translate.instant('sc.deleteEntityDialog.titleSingle', {
        entity: this.entitySingular(),
      });
    }
    return this.translate.instant('sc.deleteEntityDialog.titleBulk', {
      count: this.items().length,
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
    // delete is requested) so the typed text doesn't bleed across openings.
    effect(() => {
      this.items();
      this.confirmText.set('');
      this.copied.set(false);
    });
  }

  protected onCopy(): void {
    void this.clipboard.copy(this.confirmTarget()).then((ok) => {
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

  protected onConfirm(): void {
    if (!this.canConfirm()) return;
    if (this.mode() === 'single') {
      this.confirm.emit(null);
    } else {
      this.confirm.emit(this.items().map((item) => item.id));
    }
  }
}
