import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { MenuItem } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';

import {
  type ScColumnCellContext,
  type ScColumnDef,
  ScTagComponent as TagComponent,
  ScBadgeComponent as BadgeComponent,
} from '@smartcontact-hub/components';

import { LanguageService } from '../../../../core/services/language.service';
import type { Conversation } from '../../data/conversation.types';
import {
  MemoryStatusIconComponent,
  resolveStatusLabelKey,
  resolveStatusTone,
  type StatusTone,
} from '../memory-status-icon/memory-status-icon.component';
import { injectLangChange } from '@core/utils/lang-change';

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
 */
function primaryActionFor(conv: Conversation): ConversationContextAction | null {
  if (conv.hasTranscription && conv.hasAnalysis) return null;
  if (conv.hasTranscription) return 'analyze';
  return 'process';
}

/** La fecha de una conversación como se ordena: `dd/mm/aaaa` + hora pasa a `aaaa-mm-dd hh:mm`. */
function claveFecha(conv: Conversation): string {
  const [dd = '', mm = '', yyyy = ''] = conv.date.split('/');
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')} ${conv.hour}`;
}

/**
 * Lo que es de una conversación en su tabla: las columnas con sus celdas, las clases de cada fila, el menú del clic
 * derecho y el orden por columna.
 *
 * La tabla la monta la página sobre `sc-list-page`, como el resto de listas (DD-98, 2026-10-05). Hasta ese día este
 * componente pintaba su tabla propia, la última fuera de la pieza, y por eso se apartaba de las demás: no ordenaba y
 * su buscador no atendía a Escape. Lo que solo tenía ella (el tramo pintado, Espacio que selecciona, Mayús+clic que no
 * abre, el menú sin «⋮») lo hace ahora la pieza para todas. Aquí no se pinta nada: el componente da las plantillas de
 * sus celdas y las funciones que la pieza pide, y conserva su piel propia (`_memory-conversation-table.scss`).
 */
@Component({
  selector: 'sc-memory-conversation-table',
  imports: [BadgeComponent, TagComponent, TooltipModule, TranslateModule, MemoryStatusIconComponent],
  templateUrl: './conversation-table.component.html',
  styleUrl: './conversation-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationTableComponent {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  private readonly language = inject(LanguageService);

  /** IDs en proceso de transcripción (mock dispatch). Pintan fila amber. */
  readonly processingIds = input<ReadonlySet<string>>(new Set());
  /** IDs en proceso de análisis IA. Pintan fila cyan. */
  readonly analyzingIds = input<ReadonlySet<string>>(new Set());

  /** El botón de estado de una fila: abre el reproductor, como la fila. */
  readonly conversationOpen = output<Conversation>();
  /** Una acción del menú del clic derecho. */
  readonly contextActionRequested = output<{
    action: ConversationContextAction;
    conversation: Conversation;
  }>();

  /* ── Plantillas de celda ─────────────────────────────────────────────────
   * El `<td>` lo pinta el DS y una regla encapsulada no lo alcanzaría; lo que va dentro sí, porque se declara aquí.
   * `columns()` las recoge. Son `computed` que LEEN los `viewChild`, que resuelven tarde: en un campo se quedarían en
   * `undefined` para siempre. */
  private readonly statusTpl = viewChild<TemplateRef<ScColumnCellContext<Conversation>>>('statusTpl');
  private readonly servicePillTpl =
    viewChild<TemplateRef<ScColumnCellContext<Conversation>>>('servicePillTpl');
  private readonly groupPillTpl =
    viewChild<TemplateRef<ScColumnCellContext<Conversation>>>('groupPillTpl');
  private readonly textTpl = viewChild<TemplateRef<ScColumnCellContext<Conversation>>>('textTpl');
  private readonly numTpl = viewChild<TemplateRef<ScColumnCellContext<Conversation>>>('numTpl');
  private readonly idTpl = viewChild<TemplateRef<ScColumnCellContext<Conversation>>>('idTpl');
  private readonly whenTpl = viewChild<TemplateRef<ScColumnCellContext<Conversation>>>('whenTpl');

  /**
   * Fecha y hora en UNA columna, con el día dicho como se dice: «Hoy · 12:50», «Ayer · 13:12» o
   * «vie, 11 sept · 12:50» (2026-09-14). Antes eran dos columnas y la fecha salía idéntica en
   * casi todas las filas, que es ruido que se lee catorce veces. El año solo aparece si no es el
   * actual. Formato del navegador (`Intl`) con el idioma de la app.
   */
  protected when(conv: Conversation): string {
    this.lang();
    const [dd, mm, yyyy] = conv.date.split('/').map(Number);
    const day = new Date(yyyy, mm - 1, dd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysAgo = Math.round((today.getTime() - day.getTime()) / 86_400_000);
    const t = (k: string) => this.translate.instant(`memory.conversations.table.${k}`);
    const label =
      daysAgo === 0
        ? t('today')
        : daysAgo === 1
          ? t('yesterday')
          : new Intl.DateTimeFormat(this.language.locale(), {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              ...(yyyy === today.getFullYear() ? {} : { year: 'numeric' }),
            }).format(day);
    return `${label}, ${conv.hour}`;
  }

  /**
   * Qué le pasa a la fila, en palabras: el estado del icono y, si toca, que falló o que su
   * grabación se eliminó. La fila roja y la gris no se explicaban en ninguna parte, y la eliminada
   * se anunciaba como «Llamada · grabada» (medido en el DOM, 2026-09-14). Sale en el tooltip del
   * botón de estado (`pTooltip`, primeng.dev/tooltip) y en su nombre accesible.
   */
  protected statusDescription(conv: Conversation): string {
    this.lang();
    const t = (k: string, p?: object) => this.translate.instant(`memory.conversations.status.${k}`, p);
    const failed = this.statusTone(conv) === 'error';
    const parts: string[] = [];
    if (failed) parts.push(t(conv.channel === 'llamada' ? 'call' : 'chat'));
    parts.push(this.translate.instant(this.statusLabelKey(conv)));
    const reason = conv.analysisFailure
      ? `analysis.${conv.analysisFailure}`
      : conv.hasFailedTranscription && conv.transcriptionFailure
        ? `transcription.${conv.transcriptionFailure}`
        : null;
    if (failed && reason) parts.push(t(`failure.${reason}`));
    if (conv.deleted) parts.push(t('deleted'));
    if (this.recordingsCount(conv) > 1) parts.push(t('multi_recording', { count: this.recordingsCount(conv) }));
    return parts.join(', ');
  }

  readonly columns = computed<readonly ScColumnDef<Conversation>[]>(() => {
    this.lang();
    const t = (k: string): string => this.translate.instant(`memory.conversations.table.${k}`);
    /* ANCHOS (2026-09-13). El reparto es fijo (`table-layout: fixed`, para que las
     * columnas no salten al filtrar o paginar), así que una columna sin ancho se
     * lleva la MISMA parte que las demás: Hora tenía 122px para 5 caracteres
     * mientras Origen partía nombres. Las de contenido de largo conocido llevan
     * su ancho medido —lo más largo entre sus celdas y su cabecera en es/en/fr/pt,
     * más los 28px de relleno de Aura, redondeado a múltiplo de 7 (media unidad de
     * la escala)—; las de texto libre (Servicio, Origen, Grupo, Destino) no llevan
     * ancho y se reparten lo que sobra. Remedido el 2026-09-13 con el ID a 133: a
     * 1440 les tocan 169.5px y la más larga pide 152, así que nada se parte. A 1280
     * les tocan 129.5 y no caben (las diez piden 1203 de 1153): las etiquetas
     * recortan con puntos suspensivos (el `tag` del DS no se parte) y el texto
     * libre baja a dos líneas.
     *
     * ORDEN (2026-10-05): todas menos Estado se ordenan por cabecera, como en el resto de listas (DD-98). Las
     * ordena `sortFn`. */
    return [
      { field: 'status', header: t('status'), width: '77px', cellTemplate: this.statusTpl() },
      // 182: «sex., 13 de mar. · 12:50» (pt-BR) mide 150 + 28 de relleno, redondeado a 7.
      { field: 'date', header: t('date'), width: '182px', sortable: true, cellTemplate: this.whenTpl() },
      { field: 'service', header: t('service'), sortable: true, cellTemplate: this.servicePillTpl() },
      { field: 'origin', header: t('origin'), sortable: true, cellTemplate: this.textTpl() },
      { field: 'group', header: t('group'), sortable: true, cellTemplate: this.groupPillTpl() },
      { field: 'destination', header: t('destination'), sortable: true, cellTemplate: this.textTpl() },
      // 112: la cabecera francesa («Durée conv.») es la que manda, no la cifra.
      {
        field: 'duration',
        header: t('duration'),
        width: '112px',
        align: 'right',
        sortable: true,
        cellTemplate: this.numTpl(),
      },
      {
        field: 'waiting',
        header: t('waiting'),
        width: '98px',
        align: 'right',
        sortable: true,
        cellTemplate: this.numTpl(),
      },
      // 133, no 119 (2026-09-13): `GDPR-MR-EXP` mide 100 + 28 = 128 y un ID no se
      // parte, así que con 119 se salía de la columna a cualquier ancho de ventana.
      { field: 'id', header: t('id'), width: '133px', sortable: true, cellTemplate: this.idTpl() },
      /* Sin columna de acciones (decisión de producto, 2026-09-13): la pieza se monta con `rowMenuColumn` en falso.
       * Sus tres acciones tienen otra puerta visible: Transcribir y Marcar como leída, en la barra que sale al
       * seleccionar (Espacio con teclado); Analizar, en el reproductor (Intro o clic en la fila). El clic derecho
       * sigue abriendo el menú. */
    ];
  });

  /** Para ordenar texto: con los números por su valor y sin distinguir mayúsculas ni acentos, en el idioma de la app. */
  private readonly collator = computed(
    () => new Intl.Collator(this.language.locale(), { numeric: true, sensitivity: 'base' }),
  );

  /** El orden por columna (ascendente; la dirección la pone la pieza): la fecha por día y hora, lo demás como texto. */
  readonly sortFn = (a: Conversation, b: Conversation, field: string): number => {
    if (field === 'date') return claveFecha(a).localeCompare(claveFecha(b));
    const valor = (c: Conversation) => String((c as unknown as Record<string, unknown>)[field] ?? '');
    return this.collator().compare(valor(a), valor(b));
  };

  /**
   * Los cuatro estados de Memory, que pinta su piel (`_memory-conversation-table.scss`). La selección la pinta
   * `sc-datatable` (`sc-row--selected`) y la fila que abre, la pieza (`sc-row--clickable`).
   */
  readonly rowClass = (conv: Conversation): string | undefined => {
    const clases: string[] = [];
    if (conv.deleted) clases.push('is-deleted');
    if (this.processingIds().has(conv.id)) clases.push('is-processing');
    if (this.analyzingIds().has(conv.id)) clases.push('is-analyzing');
    if (conv.hasFailedTranscription) clases.push('is-failed');
    return clases.join(' ') || undefined;
  };

  /** El menú del clic derecho: depende del estado de la fila. Sin acciones, vacío, y la pieza no lo abre. */
  readonly rowMenu = (conv: Conversation): MenuItem[] => {
    const items: MenuItem[] = [];
    const primary = primaryActionFor(conv);
    if (primary) {
      items.push({
        label: this.translate.instant(
          primary === 'process' ? 'memory.conversations.context.process' : 'memory.conversations.context.analyze',
        ),
        icon: primary === 'process' ? 'sc-icon-font sc-icon-font--bolt' : 'sc-icon-font sc-icon-font--auto_awesome',
        command: () => this.contextActionRequested.emit({ action: primary, conversation: conv }),
      });
    }
    // «Marcar como leída» solo si la fila tiene transcripción fallida.
    if (conv.hasFailedTranscription) {
      if (primary) items.push({ separator: true });
      items.push({
        label: this.translate.instant('memory.conversations.context.mark_read'),
        icon: 'sc-icon-font sc-icon-font--done_all',
        command: () => this.contextActionRequested.emit({ action: 'mark-read', conversation: conv }),
      });
    }
    return items;
  };

  protected isProcessing(id: string): boolean {
    return this.processingIds().has(id);
  }

  protected isAnalyzing(id: string): boolean {
    return this.analyzingIds().has(id);
  }

  /** El botón de estado abre el reproductor. `stopPropagation` evita que además
   *  dispare el `rowClick` de la fila y lo abra dos veces. */
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

  protected recordingsCount(conv: Conversation): number {
    return conv.recordings?.length ?? 0;
  }

  /**
   * Devuelve la i18n key del estado resuelto para que la plantilla la combine
   * con `open_aria_with_state` en el `aria-label` del botón.
   */
  protected statusLabelKey(conv: Conversation): string {
    return resolveStatusLabelKey(conv, this.isProcessing(conv.id), this.isAnalyzing(conv.id));
  }

  protected statusTone(conv: Conversation): StatusTone {
    return resolveStatusTone(conv, this.isProcessing(conv.id), this.isAnalyzing(conv.id));
  }
}
