import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { IconComponent } from '@shared/components';
import { ClickOutsideDirective } from '@core/directives';
import { clampToViewport } from '@core/utils/viewport';

import type { Conversation } from '../../data/conversation.types';
import {
  MemoryStatusIconComponent,
  resolveStatusLabelKey,
} from '../memory-status-icon/memory-status-icon.component';

/** Acciones del menú contextual por fila.
 *  - `process`: la fila aún no tiene transcripción (no recording ⇒ no
 *    transcripción posible; o recording sin procesar). Equivalente al
 *    bulk "transcribir + analizar opcional".
 *  - `analyze`: ya hay transcripción, falta el análisis IA.
 *  - `mark-read`: solo se ofrece si `hasFailedTranscription`. */
export type ConversationContextAction = 'process' | 'analyze' | 'mark-read';

interface ContextMenuPos {
  readonly x: number;
  readonly y: number;
  readonly conversationId: string;
}

/**
 * Tabla densa de conversaciones Memory.
 *
 * Iter 1 (S36): 9 columnas básicas + chrome `.table sc-table-zebra` AED.
 * Iter 2 (S37): + columna Estado (cluster 3-5 lucide icons separados) +
 *               sticky header + hover.
 * Iter 5 (S38): + abre player modal (originalmente desde row click).
 * Iter 6a (S38): + columna checkbox de selección al inicio. Row click pasa
 *                a togglear selección (replicando Audit A5 del prototipo
 *                Memory React).
 * Iter S40 (#15): cluster lucide cambiado por `<sc-memory-status-icon>` —
 *                pictograma única canal+processing-state (SVGs custom de
 *                diseño Memory) + overlays failed (bottom-right) y
 *                multi-recording count (top-right). Sigue `sistema-de-
 *                diseno.md §Iconografía` (sec 15.21 audit prototipo).
 * Iter S53.5: + menú contextual click-derecho con acciones dinámicas
 *                según estado: Procesar / Transcribir / Analizar +
 *                "Marcar como leída" (solo si hasFailedTranscription).
 *                Patrón espejo de `<sc-labels-page>` (clampToViewport,
 *                scClickOutside, signal contextMenu posicional fijo).
 */
@Component({
  selector: 'sc-memory-conversation-table',
  imports: [ClickOutsideDirective, IconComponent, TranslateModule, MemoryStatusIconComponent],
  templateUrl: './conversation-table.component.html',
  styleUrl: './conversation-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationTableComponent {
  readonly conversations = input.required<readonly Conversation[]>();
  readonly selectedIds = input.required<ReadonlySet<string>>();
  readonly allSelected = input.required<boolean>();
  /** IDs en proceso de transcripción (mock dispatch). Pintan fila amber. */
  readonly processingIds = input<ReadonlySet<string>>(new Set());
  /** IDs en proceso de análisis IA. Pintan fila cyan. */
  readonly analyzingIds = input<ReadonlySet<string>>(new Set());

  readonly conversationOpen = output<Conversation>();
  readonly selectionToggled = output<string>();
  readonly allToggled = output<void>();
  /** Click derecho sobre una fila → acción dinámica según estado. */
  readonly contextActionRequested = output<{
    action: ConversationContextAction;
    conversation: Conversation;
  }>();

  protected readonly contextMenu = signal<ContextMenuPos | null>(null);

  protected readonly processIcon = 'bolt';
  protected readonly analyzeIcon = 'auto_awesome';
  protected readonly markReadIcon = 'done_all';
  protected readonly emptyIcon = 'search_off';

  /** Conversación referenciada por el menú contextual actual (si abierto). */
  protected readonly contextConv = computed<Conversation | null>(() => {
    const ctx = this.contextMenu();
    if (!ctx) return null;
    return this.conversations().find((c) => c.id === ctx.conversationId) ?? null;
  });

  /**
   * Acción principal disponible según el estado:
   * - sin transcripción (no recording o recording sin procesar) → process
   * - con transcripción sin análisis → analyze
   * - todo completo → null (no se ofrece acción)
   *
   * Premisa clarificada S53.5 por el usuario: sin recording no puede haber
   * transcripción, así que "transcribir" no es un item separado del menú —
   * "procesar" cubre el caso (mismo wording que el bulk modal).
   */
  protected readonly contextPrimaryAction = computed<ConversationContextAction | null>(() => {
    const c = this.contextConv();
    if (!c) return null;
    if (c.hasTranscription && c.hasAnalysis) return null;
    if (c.hasTranscription) return 'analyze';
    return 'process';
  });

  /** "Marcar como leída" solo aparece si la fila tiene transcripción fallida. */
  protected readonly contextShowMarkRead = computed<boolean>(() => {
    const c = this.contextConv();
    return !!c?.hasFailedTranscription;
  });

  protected readonly contextHasItems = computed<boolean>(
    () => this.contextPrimaryAction() !== null || this.contextShowMarkRead(),
  );

  protected isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  protected isProcessing(id: string): boolean {
    return this.processingIds().has(id);
  }

  protected isAnalyzing(id: string): boolean {
    return this.analyzingIds().has(id);
  }

  protected onRowClick(conv: Conversation): void {
    this.selectionToggled.emit(conv.id);
  }

  protected onRowKeydown(event: KeyboardEvent, conv: Conversation): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectionToggled.emit(conv.id);
    }
  }

  protected onCheckboxChange(event: Event, conv: Conversation): void {
    event.stopPropagation();
    this.selectionToggled.emit(conv.id);
  }

  protected onCheckboxKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.stopPropagation();
    }
  }

  protected onStatusClick(event: Event, conv: Conversation): void {
    event.stopPropagation();
    this.conversationOpen.emit(conv);
  }

  protected onStatusKeydown(event: KeyboardEvent, conv: Conversation): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.conversationOpen.emit(conv);
    }
  }

  protected onHeaderCheckboxChange(event: Event): void {
    event.stopPropagation();
    this.allToggled.emit();
  }

  protected recordingsCount(conv: Conversation): number {
    return conv.recordings?.length ?? 0;
  }

  /**
   * Devuelve la i18n key del estado resuelto para que la plantilla la
   * combine con `open_aria_with_state` en el `aria-label` del button.
   * Fix S41 a11y: el screen reader debe oír el estado además del
   * "Abrir conversación X". Antes el estado quedaba mudo en el span
   * hijo (no era el focus target).
   */
  protected statusLabelKey(conv: Conversation): string {
    return resolveStatusLabelKey(conv, this.isProcessing(conv.id), this.isAnalyzing(conv.id));
  }

  protected onContextMenu(event: MouseEvent, conv: Conversation): void {
    // Sin acciones disponibles → no abrir menú (evita popover vacío).
    const willHaveActions =
      (conv.hasTranscription && conv.hasAnalysis) === false || conv.hasFailedTranscription;
    if (!willHaveActions) return;
    event.preventDefault();
    const { x, y } = clampToViewport(event.clientX, event.clientY);
    this.contextMenu.set({ x, y, conversationId: conv.id });
  }

  protected closeContextMenu(): void {
    this.contextMenu.set(null);
  }

  protected dispatchContext(action: ConversationContextAction): void {
    const conv = this.contextConv();
    this.closeContextMenu();
    if (!conv) return;
    this.contextActionRequested.emit({ action, conversation: conv });
  }

  protected primaryActionLabelKey(action: ConversationContextAction | null): string {
    switch (action) {
      case 'process':
        return 'memory.conversations.context.process';
      case 'analyze':
        return 'memory.conversations.context.analyze';
      default:
        return '';
    }
  }

  protected primaryActionIcon(action: ConversationContextAction | null) {
    switch (action) {
      case 'process':
        return this.processIcon;
      case 'analyze':
        return this.analyzeIcon;
      default:
        return undefined;
    }
  }
}
