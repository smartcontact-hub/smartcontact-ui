import { map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';

import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import {
  type ScColumnCellContext,
  type ScColumnDef,
  ScDatatableComponent as DatatableComponent,
  type ScDatatableRowEvent,
  type ScDatatableRowKeyEvent,
  type ScRowStyleClassFn,
} from '@smartcontact-hub/components';

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
 * Iter 2 (S37): + columna Estado + sticky header + hover.
 * Iter 5 (S38): + abre player modal (originalmente desde row click).
 * Iter 6a (S38): + columna checkbox de selección al inicio.
 * Ola 6:        ese gesto se INVIERTE. La fila abre (R1) y la casilla —su
 *                celda entera— selecciona.
 * Iter S40 (#15): cluster lucide cambiado por `<sc-memory-status-icon>`.
 * Iter S53.5:  + menú click-derecho con acciones dinámicas según estado.
 * Ola 2:       ese menú pasa al `<p-menu>` compartido de la casa + kebab visible.
 *
 * B4 (esta sesión): el `<table>` a mano pasa a `sc-datatable`, la última de las
 *   diez tablas de la casa que quedaba sin migrar. Conserva su piel propia
 *   —densa, plana, con los cuatro estados de fila con shimmer y el botón de
 *   estado— sobre la piel compartida `.list-table` (ver
 *   `_memory-conversation-table.scss`): la gramática es la de la casa; el aspecto
 *   BeyondUI de Memory (S59) se mantiene por encima.
 *
 *   La selección deja de ser "toglea este id": `sc-datatable` gobierna la
 *   casilla, la casilla de cabecera y el rango con ancla, y emite la selección
 *   COMPLETA. Este componente la traduce a/desde el `Set` que sigue siendo la
 *   fuente de verdad en la página (de él cuelgan la barra masiva y el dispatch).
 */
@Component({
  selector: 'sc-memory-conversation-table',
  imports: [DatatableComponent, IconComponent, MenuModule, TranslateModule, MemoryStatusIconComponent],
  templateUrl: './conversation-table.component.html',
  styleUrl: './conversation-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationTableComponent {
  private readonly translate = inject(TranslateService);

  readonly conversations = input.required<readonly Conversation[]>();
  readonly selectedIds = input.required<ReadonlySet<string>>();
  /** IDs en proceso de transcripción (mock dispatch). Pintan fila amber. */
  readonly processingIds = input<ReadonlySet<string>>(new Set());
  /** IDs en proceso de análisis IA. Pintan fila cyan. */
  readonly analyzingIds = input<ReadonlySet<string>>(new Set());

  readonly conversationOpen = output<Conversation>();
  /** La selección COMPLETA tras un gesto de casilla/cabecera/rango. Reemplaza a
   *  los antiguos `selectionToggled`/`allToggled`: `sc-datatable` piensa en el
   *  conjunto entero, no en toggles. */
  readonly selectionChange = output<ReadonlySet<string>>();
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

  /** Nombre accesible de las casillas. Sin esto PrimeNG cae a `'Row Selected'`
   *  / `'All items selected'` — inglés fijo, sin identidad de fila. La tabla a
   *  mano sí las nombraba; se reutilizan sus claves. Ver `ScRowAriaLabelFn`. */
  protected readonly ariaFila = (conv: Conversation): string =>
    this.translate.instant('memory.conversations.select_row_aria', { id: conv.id });
  protected readonly ariaTodo = this.translate.instant('memory.conversations.select_all_aria');

  /** Idioma vivo: dependencia del `columns` computed para que las cabeceras NO
   *  se queden congeladas al cambiar de idioma. `translate.instant()` no es
   *  reactivo (a diferencia del pipe `| translate`), así que sin esto el
   *  computed no se re-evaluaría — lo vigila `audit:datatables`. */
  private readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(
      map((e) => e.lang),
      startWith(this.translate.currentLang),
    ),
    { initialValue: this.translate.currentLang },
  );

  /* ── Plantillas de celda ─────────────────────────────────────────────────
   * Viven FUERA del `<sc-datatable>` (el `<td>` lo pinta el DS y una regla
   * encapsulada no lo alcanzaría); `columns()` las recoge. Son `computed` que
   * LEEN los `viewChild`, que resuelven tarde: en un campo se quedarían en
   * `undefined` para siempre. */
  private readonly statusTpl = viewChild<TemplateRef<ScColumnCellContext<Conversation>>>('statusTpl');
  private readonly servicePillTpl =
    viewChild<TemplateRef<ScColumnCellContext<Conversation>>>('servicePillTpl');
  private readonly groupPillTpl =
    viewChild<TemplateRef<ScColumnCellContext<Conversation>>>('groupPillTpl');
  private readonly numTpl = viewChild<TemplateRef<ScColumnCellContext<Conversation>>>('numTpl');
  private readonly idTpl = viewChild<TemplateRef<ScColumnCellContext<Conversation>>>('idTpl');
  private readonly actionsTpl = viewChild<TemplateRef<ScColumnCellContext<Conversation>>>('actionsTpl');

  protected readonly columns = computed<readonly ScColumnDef<Conversation>[]>(() => {
    this.currentLang();
    const t = (k: string): string => this.translate.instant(`memory.conversations.table.${k}`);
    return [
      { field: 'status', header: t('status'), width: '132px', cellTemplate: this.statusTpl() },
      { field: 'hour', header: t('hour') },
      { field: 'date', header: t('date') },
      { field: 'service', header: t('service'), cellTemplate: this.servicePillTpl() },
      { field: 'origin', header: t('origin') },
      { field: 'group', header: t('group'), cellTemplate: this.groupPillTpl() },
      { field: 'destination', header: t('destination') },
      { field: 'duration', header: t('duration'), align: 'right', cellTemplate: this.numTpl() },
      { field: 'waiting', header: t('waiting'), align: 'right', cellTemplate: this.numTpl() },
      { field: 'id', header: t('id'), cellTemplate: this.idTpl() },
      {
        field: 'actions',
        header: '',
        headerAriaLabel: this.translate.instant('memory.conversations.cols.more'),
        width: '44px',
        align: 'center',
        stopRowClick: true,
        cellTemplate: this.actionsTpl(),
      },
    ];
  });

  /* Puente de selección: la fuente de verdad es el `Set` de la página. Aquí se
   * traduce a las filas que `sc-datatable` necesita para su casilla, y de vuelta
   * al `Set` cuando el DS emite una selección nueva. */
  protected readonly selectedRows = computed<readonly Conversation[]>(() => {
    const ids = this.selectedIds();
    return this.conversations().filter((c) => ids.has(c.id));
  });

  protected onSelectionChange(selection: Conversation | readonly Conversation[] | null): void {
    const rows = Array.isArray(selection) ? selection : selection ? [selection as Conversation] : [];
    this.selectionChange.emit(new Set(rows.map((c) => c.id)));
  }

  /**
   * Clases por fila. Los cuatro estados de Memory (deleted/processing/analyzing/
   * failed) + el seleccionado los pinta la piel `_memory-conversation-table`
   * sobre estas clases; `--clickable` da cursor y hover a la fila que abre.
   *
   * `is-selected` sale del `Set` de la página —la fuente de verdad de la
   * selección—, NO de la clase `.p-datatable-row-selected` de p-table. Es a
   * propósito: p-table no re-resalta al instante las filas que un rango añade
   * por el input (solo las que togla él); leer el `Set` pinta las N filas del
   * rango sin depender de ese detalle. Se re-evalúa porque `[selection]` cambia
   * y con él se re-renderiza la tabla. */
  protected readonly rowStyleClass: ScRowStyleClassFn<Conversation> = (conv) => {
    const clases = ['table__row--clickable'];
    if (this.selectedIds().has(conv.id)) clases.push('is-selected');
    if (conv.deleted) clases.push('is-deleted');
    if (this.processingIds().has(conv.id)) clases.push('is-processing');
    if (this.analyzingIds().has(conv.id)) clases.push('is-analyzing');
    if (conv.hasFailedTranscription) clases.push('is-failed');
    return clases.join(' ');
  };

  protected isProcessing(id: string): boolean {
    return this.processingIds().has(id);
  }

  protected isAnalyzing(id: string): boolean {
    return this.analyzingIds().has(id);
  }

  /* ── R1 · el click en una fila ABRE ──────────────────────────────────────
   * fila → abre · casilla → selecciona · shift+click en la casilla → rango
   * (lo sirve `sc-datatable`) · Enter → abre · Espacio → selecciona.
   */
  protected onRowClick(event: ScDatatableRowEvent<Conversation>): void {
    // Shift+click sobre la fila NO abre el reproductor: quien encadena
    // selecciones con Mayús no espera que se le abra un modal encima. El rango
    // de verdad se hace desde la casilla (lo gobierna el DS); aquí basta con no
    // abrir.
    if (event.originalEvent.shiftKey) return;
    this.conversationOpen.emit(event.row);
  }

  protected onRowKeydown(event: ScDatatableRowKeyEvent<Conversation>): void {
    // Enter ABRE (acción primaria) y Espacio SELECCIONA. Es la convención de
    // listas de escritorio y mantiene el teclado a la par del ratón.
    const key = event.originalEvent.key;
    if (key === 'Enter') {
      event.originalEvent.preventDefault();
      this.conversationOpen.emit(event.row);
      return;
    }
    if (key === ' ') {
      event.originalEvent.preventDefault();
      const next = new Set(this.selectedIds());
      if (next.has(event.row.id)) next.delete(event.row.id);
      else next.add(event.row.id);
      this.selectionChange.emit(next);
    }
  }

  /** Click derecho → el MISMO `<p-menu>` que el kebab (R3). Solo abre si la fila
   *  tiene acciones: un menú vacío es peor que ninguno. */
  protected onRowContextMenu(
    event: ScDatatableRowEvent<Conversation>,
    menu: { toggle: (e: Event) => void },
  ): void {
    if (this.setMenuTarget(event.row)) menu.toggle(event.originalEvent);
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

  /** Conversación referenciada por el menú actual (si abierto). */
  protected readonly contextConv = computed<Conversation | null>(() => {
    const id = this.menuTargetId();
    if (!id) return null;
    return this.conversations().find((c) => c.id === id) ?? null;
  });

  /** Modelo del menú compartido — computed ESTABLE: solo cambia al apuntar a
   *  otra fila. Los items dependen del estado de ESA conversación. */
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

  /** Apunta el menú compartido a una fila. Devuelve si esa fila tiene alguna
   *  acción — el llamante solo abre el menú si la hay. */
  protected setMenuTarget(conv: Conversation): boolean {
    this.menuTargetId.set(conv.id);
    return this.rowHasActions(conv);
  }

  /** Una fila ya procesada y analizada no ofrece nada: ahí no se pinta kebab. */
  protected rowHasActions(conv: Conversation): boolean {
    return primaryActionFor(conv) !== null || !!conv.hasFailedTranscription;
  }

  protected dispatchContext(action: ConversationContextAction): void {
    const conv = this.contextConv();
    if (!conv) return;
    this.contextActionRequested.emit({ action, conversation: conv });
  }
}
