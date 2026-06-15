import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';

import { BulkTranscriptionModalComponent } from '../../components/bulk-transcription-modal/bulk-transcription-modal.component';
import { ConversationFiltersComponent } from '../../components/conversation-filters/conversation-filters.component';
import { ConversationPlayerModalComponent } from '../../components/conversation-player-modal/conversation-player-modal.component';
import {
  ConversationTableComponent,
  type ConversationContextAction,
} from '../../components/conversation-table/conversation-table.component';
import { DownloadModalComponent } from '../../components/download-modal/download-modal.component';
import { MockSampleSwitcherComponent } from '../../components/mock-sample-switcher/mock-sample-switcher.component';
import { RetranscriptionConfirmModalComponent } from '../../components/retranscription-confirm-modal/retranscription-confirm-modal.component';
import type { Conversation } from '../../data/conversation.types';
import { ConversationsStore } from '../../state/conversations.store';
import { TopBarSlotService } from '../../../../core/layout/top-bar/top-bar-slot.service';
import { TOAST_LIFE } from '@core/utils/toast-life';

/**
 * Pantalla principal del módulo Memory (`/conversaciones`).
 *
 * Iter 1 (S36): page-header + tabla densa con mock data.
 * Iter 2 (S37): + columna Estado + sticky header + hover.
 * Iter 3 (S37): + ConversationFilters top-bar (services / date / origin /
 *               destination / groups / agents).
 * Iter 5 (S38): + ConversationPlayerModal (audio simulado + tabs
 *               transcripción/análisis con state machine).
 * Iter 6a (S38): + selección múltiple. Row click toggle selección (Audit A5
 *                del React); cluster status icons sigue abriendo modal.
 *                (S62: las acciones bulk viven inline en la toolbar de filtros
 *                —paridad legacy S50/S52—, NO en el `<sc-bulk-action-bar>`
 *                overlay de AED. Decisión consciente, ver backlog #65.)
 * Iter 6b (S38): + BulkTranscriptionModal v11 (state machine 6 escenarios,
 *                3 destinos MECE, toggle locked, warning costes).
 *
 * NO incluye todavía: sticky toast post-confirmación, filtros por columna,
 * estado "en proceso". Ver `docs/memory-migration-inventory.md` §10.
 */
@Component({
  selector: 'sc-memory-conversations-page',
  imports: [
    TranslateModule,
    ButtonModule,
    BulkTranscriptionModalComponent,
    ConversationFiltersComponent,
    ConversationTableComponent,
    ConversationPlayerModalComponent,
    DownloadModalComponent,
    RetranscriptionConfirmModalComponent,
  ],
  templateUrl: './conversations-page.component.html',
  styleUrl: './conversations-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationsPageComponent implements OnInit, OnDestroy {
  private readonly conversationsStore = inject(ConversationsStore);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly topBarSlot = inject(TopBarSlotService);

  /** Sube el selector de datos demo a la TopBar mientras /conversaciones está
   * activa (experiment S59), y lo retira al salir. El switcher lee el store
   * root, así que funciona renderizado en el shell sin perder estado. */
  ngOnInit(): void {
    this.topBarSlot.set(MockSampleSwitcherComponent);
  }

  ngOnDestroy(): void {
    this.topBarSlot.clear();
  }

  protected readonly conversations = this.conversationsStore.filteredConversations;
  protected readonly filters = this.conversationsStore.filters;
  protected readonly selectedIds = this.conversationsStore.selectedIds;
  protected readonly selectedCount = this.conversationsStore.selectedCount;
  protected readonly allFilteredSelected = this.conversationsStore.allFilteredSelected;
  protected readonly availableAiCategories = this.conversationsStore.availableAiCategories;
  protected readonly processingIds = this.conversationsStore.processingIds;
  protected readonly analyzingIds = this.conversationsStore.analyzingIds;
  protected readonly failedCount = this.conversationsStore.failedCount;
  /** Versión `readonly string[]` para los modals que esperan array, no Set. */
  protected readonly processingIdsArray = computed(() => [...this.processingIds()]);
  protected readonly analyzingIdsArray = computed(() => [...this.analyzingIds()]);
  protected readonly pageIcon = 'forum';

  /** Última búsqueda — placeholder hoy = now. Con backend real, lo seteará
   *  el dispatcher al recibir respuesta. */
  protected readonly lastSearchAt = signal<Date>(new Date());

  /** S50: download modal trigger desde toolbar. NULL = no abierto. Cuando el
   *  toolbar dispara download sin selección, descarga todo filtered; con
   *  selección, solo el subset seleccionado. */
  protected readonly downloadModalOpen = signal(false);
  /** Selected count cached cuando se abre el modal, para preservarlo si el
   *  usuario deselecciona mientras el modal está visible. */
  protected readonly downloadTargetCount = signal(0);

  protected readonly filteredCount = computed(() => this.conversations().length);

  protected readonly playerOpen = signal(false);
  protected readonly playerConversation = signal<Conversation | null>(null);
  /** Estado in-flight derivado para el player: refleja si la conversación
   *  abierta está en `processingIds`/`analyzingIds` del store. Necesario
   *  para que la re-transcripción (§10 #1) pinte el tab body en estado
   *  procesando mientras el dispatch resuelve. */
  protected readonly playerIsTranscribing = computed(() => {
    const id = this.playerConversation()?.id;
    return !!id && this.processingIds().has(id);
  });
  protected readonly playerIsAnalyzing = computed(() => {
    const id = this.playerConversation()?.id;
    return !!id && this.analyzingIds().has(id);
  });

  protected readonly bulkModalOpen = signal(false);
  protected readonly bulkSnapshot = signal<readonly Conversation[]>([]);

  /** Re-transcribir gate · §10 #1. El modal vive a nivel page (no anidado
   *  dentro del player) para evitar p-dialog nesting issues. La página
   *  guarda el ID que dispara el confirm para reusarlo al dispatchear. */
  protected readonly retransConfirmOpen = signal(false);
  protected readonly retransTargetId = signal<string | null>(null);

  protected onFiltersChange(filters: ReturnType<ConversationsStore['filters']>): void {
    this.conversationsStore.setFilters(filters);
  }

  protected onSelectionToggled(id: string): void {
    this.conversationsStore.toggleSelection(id);
  }

  protected onAllToggled(): void {
    if (this.allFilteredSelected()) {
      this.conversationsStore.clearSelection();
    } else {
      this.conversationsStore.selectAllFiltered();
    }
  }

  protected onClearSelection(): void {
    this.conversationsStore.clearSelection();
  }

  protected onBulkTranscribe(): void {
    const selected = this.conversationsStore
      .conversations()
      .filter((c) => this.selectedIds().has(c.id));
    this.bulkSnapshot.set(selected);
    this.bulkModalOpen.set(true);
  }

  protected onBulkMarkRead(): void {
    // Decisión 15.46 Memory: "Marcar como leídas" reset visual del estado
    // post-procesamiento. S49 fix: además de cerrar selección + toast,
    // limpia `hasFailedTranscription` en las seleccionadas → la fila roja
    // desaparece (antes era stub toast-only y el feedback persistía).
    const n = this.selectedCount();
    const ids = [...this.selectedIds()];
    this.conversationsStore.markAsRead(ids);
    this.conversationsStore.clearSelection();
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant('memory.bulk.mark_read_toast', { n }),
      life: TOAST_LIFE.success,
    });
  }

  protected onBulkModalClose(): void {
    this.bulkModalOpen.set(false);
  }

  /** S50 toolbar: abrir Download modal. Si hay selección, descarga ese
   *  subset; si no, descarga todo el filtered. */
  protected onDownloadRequested(): void {
    const count = this.selectedCount() > 0 ? this.selectedCount() : this.filteredCount();
    this.downloadTargetCount.set(count);
    this.downloadModalOpen.set(true);
  }

  protected onDownloadConfirm(opts: { recordings: boolean; chats: boolean }): void {
    this.downloadModalOpen.set(false);
    const n = this.downloadTargetCount();
    // Sin backend real: toast por canal seleccionado. Hereda patron del
    // player-modal (S47 §10 #4). En producción este punto llamará al
    // endpoint de descarga.
    if (opts.recordings) {
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant('memory.bulk.download_audio_toast', { n }),
        life: TOAST_LIFE.success,
      });
    }
    if (opts.chats) {
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant('memory.bulk.download_chat_toast', { n }),
        life: TOAST_LIFE.success,
      });
    }
  }

  protected onDownloadCancel(): void {
    this.downloadModalOpen.set(false);
  }

  protected async onBulkModalConfirm(event: {
    includeAnalysis: boolean;
    eligibleIds: readonly string[];
  }): Promise<void> {
    this.bulkModalOpen.set(false);
    this.conversationsStore.clearSelection();
    await this.dispatchWithStickyToast(event.eligibleIds, event.includeAnalysis);
  }

  /**
   * Pipeline visual del dispatch (bulk o unitario). Sticky toast con
   * `life: 0` + key fijo `dispatch-progress` que se actualiza in-place
   * mientras el store procesa. Cierre por success o por failure final.
   *
   * Réplica del prototipo React `referencia-ui.md §"sticky toast durante
   * el batch"`: el toast persiste hasta que el batch acaba, no se cierra
   * solo. El × manual permite descartarlo sin esperar.
   */
  private async dispatchWithStickyToast(
    ids: readonly string[],
    includeAnalysis: boolean,
  ): Promise<void> {
    if (ids.length === 0) return;
    const progressKey = 'dispatch-progress';

    // Fase 1: sticky "Generando transcripción de N…"
    this.messages.clear(progressKey);
    this.messages.add({
      key: progressKey,
      severity: 'info',
      summary: this.translate.instant('memory.dispatch.transcribing', { n: ids.length }),
      sticky: true,
      closable: true,
    });

    const result = await this.conversationsStore.dispatchTranscription(ids, { includeAnalysis });

    // Si pedimos análisis, actualizamos el toast tras la transcripción.
    if (includeAnalysis && result.successIds.length > 0) {
      this.messages.clear(progressKey);
      this.messages.add({
        key: progressKey,
        severity: 'info',
        summary: this.translate.instant('memory.dispatch.analyzing', {
          n: result.successIds.length,
        }),
        sticky: true,
        closable: true,
      });
      // El store ya está esperando el segundo timeout antes de resolver,
      // así que cuando la promise resuelve aquí el análisis está hecho.
    }

    // Toast final: success / con-fallos / todo-fallido.
    this.messages.clear(progressKey);
    if (result.failedIds.length === 0) {
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant('memory.dispatch.success', {
          n: result.successIds.length,
        }),
        life: TOAST_LIFE.success,
      });
    } else if (result.successIds.length === 0) {
      this.messages.add({
        severity: 'error',
        summary: this.translate.instant('memory.dispatch.all_failed', {
          n: result.failedIds.length,
        }),
        life: TOAST_LIFE.error,
      });
    } else {
      this.messages.add({
        severity: 'warn',
        summary: this.translate.instant('memory.dispatch.partial', {
          ok: result.successIds.length,
          ko: result.failedIds.length,
        }),
        life: TOAST_LIFE.warn,
      });
    }
  }

  protected onConversationOpen(conv: Conversation): void {
    this.playerConversation.set(conv);
    this.playerOpen.set(true);
  }

  protected onPlayerClose(): void {
    this.playerOpen.set(false);
  }

  /**
   * Re-transcribir desde el player modal (§10 #1).
   *
   * Flow: player emite intent → page abre confirm modal con gate
   * "CONFIRMAR" → al confirmar, dispatch reusando el pipeline existente
   * (mismo sticky toast progress + processingIds). El player no se cierra:
   * el tab body pinta el estado procesando vía `playerIsTranscribing`
   * binding y al resolver vuelve a la transcripción con contenido fresh
   * del mock.
   */
  protected onPlayerRequestRetransConfirm(id: string): void {
    this.retransTargetId.set(id);
    this.retransConfirmOpen.set(true);
  }

  protected onRetransCancel(): void {
    this.retransConfirmOpen.set(false);
    this.retransTargetId.set(null);
  }

  protected async onRetransConfirm(): Promise<void> {
    const id = this.retransTargetId();
    this.retransConfirmOpen.set(false);
    this.retransTargetId.set(null);
    if (!id) return;
    await this.dispatchWithStickyToast([id], false);
  }

  /**
   * Handlers unitarios desde el player modal (deuda micro cerrada S46).
   *
   * Hasta hoy las outputs `requestTranscription` / `requestAnalysis` /
   * `requestTranscriptionAndAnalysis` del player no estaban wireadas — los
   * CTAs internos del tab body se quedaban sin efecto. Ahora reusan el
   * pipeline:
   *  - Transcription / Both: `dispatchWithStickyToast` con flag.
   *  - Analysis only (transcript ya existe): `dispatchAnalysisOnly` nuevo,
   *    salta la fase 1 (processingIds) y va directo a analyzingIds.
   */
  protected async onPlayerRequestTranscription(id: string): Promise<void> {
    await this.dispatchWithStickyToast([id], false);
  }

  protected async onPlayerRequestTranscriptionAndAnalysis(id: string): Promise<void> {
    await this.dispatchWithStickyToast([id], true);
  }

  protected async onPlayerRequestAnalysis(id: string): Promise<void> {
    const progressKey = 'dispatch-progress';
    this.messages.clear(progressKey);
    this.messages.add({
      key: progressKey,
      severity: 'info',
      summary: this.translate.instant('memory.dispatch.analyzing', { n: 1 }),
      sticky: true,
      closable: true,
    });

    const result = await this.conversationsStore.dispatchAnalysisOnly([id]);

    this.messages.clear(progressKey);
    if (result.successIds.length > 0) {
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant('memory.dispatch.success', {
          n: result.successIds.length,
        }),
        life: TOAST_LIFE.success,
      });
    }
  }

  /**
   * S53.5: acción del menú contextual por fila. Dispatch espejo de los
   * handlers existentes según action:
   *  - `process` → mismo pipeline que `onPlayerRequestTranscription`
   *  - `analyze` → mismo pipeline que `onPlayerRequestAnalysis`
   *  - `mark-read` → unitario (limpia hasFailedTranscription + toast)
   */
  protected async onContextAction(event: {
    action: ConversationContextAction;
    conversation: Conversation;
  }): Promise<void> {
    const { action, conversation } = event;
    switch (action) {
      case 'process':
        await this.dispatchWithStickyToast([conversation.id], false);
        return;
      case 'analyze':
        await this.onPlayerRequestAnalysis(conversation.id);
        return;
      case 'mark-read':
        this.conversationsStore.markAsRead([conversation.id]);
        this.messages.add({
          severity: 'success',
          summary: this.translate.instant('memory.bulk.mark_read_toast', { n: 1 }),
          life: TOAST_LIFE.success,
        });
        return;
    }
  }
}
