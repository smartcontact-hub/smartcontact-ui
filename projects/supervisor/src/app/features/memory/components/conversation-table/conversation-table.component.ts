import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';

import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';

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

/**
 * Acción principal disponible según el estado:
 * - sin transcripción (no recording o recording sin procesar) → process
 * - con transcripción sin análisis → analyze
 * - todo completo → null (no se ofrece acción)
 *
 * Premisa clarificada S53.5 por el usuario: sin recording no puede haber
 * transcripción, así que "transcribir" no es un item separado del menú —
 * "procesar" cubre el caso (mismo wording que el bulk modal).
 *
 * Función libre, no computed, porque la necesitan DOS consumidores con
 * granularidad distinta: el modelo del menú (la fila apuntada) y el kebab de
 * CADA fila, que decide si pintarse.
 */
function primaryActionFor(conv: Conversation): ConversationContextAction | null {
  if (conv.hasTranscription && conv.hasAnalysis) return null;
  if (conv.hasTranscription) return 'analyze';
  return 'process';
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
 * Iter S53.5: + menú click-derecho con acciones dinámicas según estado:
 *                Procesar / Transcribir / Analizar + "Marcar como leída"
 *                (solo si hasFailedTranscription).
 * Ola 2:       ese menú pasa al `<p-menu>` compartido de la casa y GANA UN
 *                KEBAB VISIBLE. Antes solo se abría con click derecho, que no
 *                se anuncia: quien no lo supiera no tenía forma de descubrir
 *                estas acciones (Nielsen #6). Se va el menú posicional propio
 *                (clampToViewport + scClickOutside).
 */
@Component({
  selector: 'sc-memory-conversation-table',
  imports: [IconComponent, MenuModule, TranslateModule, MemoryStatusIconComponent],
  templateUrl: './conversation-table.component.html',
  styleUrl: './conversation-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationTableComponent {
  private readonly translate = inject(TranslateService);

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

  /** Fila a la que apunta el menú compartido. Se guarda el ID y no el objeto
   *  para que el modelo siga vivo si la conversación cambia de estado
   *  mientras el menú está abierto. */
  protected readonly menuTargetId = signal<string | null>(null);

  protected readonly moreIcon = 'more_vert';

  /** Conversación referenciada por el menú actual (si abierto). */
  protected readonly contextConv = computed<Conversation | null>(() => {
    const id = this.menuTargetId();
    if (!id) return null;
    return this.conversations().find((c) => c.id === id) ?? null;
  });

  /** Modelo del menú compartido — computed ESTABLE: solo cambia al apuntar a
   *  otra fila. Los items dependen del estado de ESA conversación, así que
   *  aquí no hay una lista fija como en las listas admin. */
  protected readonly menuItems = computed<MenuItem[]>(() => {
    const conv = this.contextConv();
    if (!conv) return [];
    const items: MenuItem[] = [];
    const primary = primaryActionFor(conv);

    if (primary) {
      items.push({
        label: this.translate.instant(
          primary === 'process'
            ? 'memory.conversations.context.process'
            : 'memory.conversations.context.analyze',
        ),
        icon:
          primary === 'process'
            ? 'sc-icon-font sc-icon-font--bolt'
            : 'sc-icon-font sc-icon-font--auto_awesome',
        command: () => this.dispatchContext(primary),
      });
    }

    // "Marcar como leída" solo si la fila tiene transcripción fallida.
    if (conv.hasFailedTranscription) {
      if (primary) items.push({ separator: true });
      items.push({
        label: this.translate.instant('memory.conversations.context.mark_read'),
        icon: 'sc-icon-font sc-icon-font--done_all',
        command: () => this.dispatchContext('mark-read'),
      });
    }
    return items;
  });

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

  /** Apunta el menú compartido a una fila. Devuelve si esa fila tiene alguna
   *  acción — el llamante solo abre el menú si la hay, para no enseñar un
   *  popover vacío. */
  protected setMenuTarget(conv: Conversation): boolean {
    this.menuTargetId.set(conv.id);
    return this.rowHasActions(conv);
  }

  /** Una fila ya procesada y analizada no ofrece nada: ahí no se pinta kebab.
   *  Un kebab que abre un menú vacío es peor que no tenerlo. */
  protected rowHasActions(conv: Conversation): boolean {
    return primaryActionFor(conv) !== null || !!conv.hasFailedTranscription;
  }

  protected dispatchContext(action: ConversationContextAction): void {
    const conv = this.contextConv();
    if (!conv) return;
    this.contextActionRequested.emit({ action, conversation: conv });
  }

}
