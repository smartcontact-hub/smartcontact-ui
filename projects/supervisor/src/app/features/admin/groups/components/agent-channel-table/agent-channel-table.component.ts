import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ScBulkActionBarComponent as BulkActionBarComponent,
  ScButtonComponent as ButtonComponent,
  ScSearchComponent as SearchComponent,
  ScMultiSelectComponent as MultiSelectComponent,
  ScSelectComponent as SelectComponent,
  ScTagComponent as TagComponent,
  useBulkEntityI18n,
} from '@smartcontact-hub/components';
import {
  ScDatatableComponent as DatatableComponent,
  type ScColumnCellContext,
  type ScColumnDef,
} from '@smartcontact-hub/components';

import { TooltipModule } from 'primeng/tooltip';

import { IllustratedAvatarComponent } from '@shared/components';
import { ScCheckboxComponent as CheckboxComponent } from '@smartcontact-hub/components';

import {
  CHANNEL_LABEL_KEYS,
  GroupChannel,
  LEVEL_OPTIONS,
} from '@features/admin/groups/data/groups-data';
import {
  Channel,
  GroupAgentLink,
} from '@features/admin/services/group-agent-links.types';
import { isLastChannel, newLinkFor, toggleLinkChannel } from '@features/admin/services/group-channels.core.mjs';

/** Lightweight agent reference accepted by the table. */
export interface AgentChannelTableAgent {
  readonly id: number;
  readonly name: string;
  readonly photo?: string;
}

interface VisibleRow {
  readonly link: GroupAgentLink;
  readonly agent: AgentChannelTableAgent;
}

/** Anchos de la tabla compacta (el panel rápido). Los usa también el panel para medirse (DD-131). */
export const CHANNEL_COL_COMPACT = '5rem';
export const ACTIONS_COL_COMPACT = '2.5rem';

/**
 * Editor de los agentes de un grupo, dentro de su ficha — el gemelo de
 * `GroupAssignmentTableComponent` (los grupos de un agente), con su misma barra y su
 * misma tabla:
 *
 *   [ Buscar agente…     ]  ⚠ 2 sin canal                  [ Añadir agente… ▾ ]
 *   ☐  Agente                     Teléfono   Web Chat   WhatsApp
 *   ☐  A. López  [En pausa]          ☑          ☑          ☐       🗑
 *
 * Una columna por canal DEL GRUPO (un grupo solo de teléfono enseña solo esa), como
 * la matriz de Contact Center.
 *
 * LA VISTA DEL GRUPO GESTIONA COMPOSICIÓN: quién está y por qué canales (visión de producto de
 * grupos, 2026-09-25; DD-121). Por eso, desde el 2026-09-26:
 *   · Fuera «Habilitado» y su lote Habilitar/Deshabilitar. La pausa es estado de la PERSONA (en
 *     Voice puede delegarse al agente) y se cambia en su ficha; aquí se VE, con una etiqueta de
 *     solo lectura, y sus canales se siguen pudiendo tocar.
 *   · Un agente asignado tiene siempre al menos un canal: la casilla del último se apaga, con su
 *     porqué. No se desasigna solo al quitárselo: pasar a alguien de Teléfono a Chat son 2 clics
 *     (marcar Chat, desmarcar Teléfono), y la fila no desaparece a mitad del gesto.
 *   · «Quitar» significa una sola cosa: salir del grupo, desde la papelera, en lote o
 *     desmarcándolo en «Añadir agentes».
 * Las filas que YA vienen sin canales (datos de antes, o la ficha del agente, que sí deja
 * quitarlos todos) se toleran y se marcan «Sin canales».
 *
 * La casilla del principio de la fila ELIGE agentes para actuar en lote (quitar del grupo); las
 * de las columnas son permisos de canal. Se quitó y volvió el mismo día (decisión de producto,
 * 2026-09-14): la acción en lote necesita elegir varios, y la cabecera de cada columna ya dice
 * qué es cada casilla.
 *
 * No persiste nada: el formulario tiene el `links` canónico y lo guarda en
 * `GroupAgentLinksStore`.
 */
@Component({
  selector: 'sc-agent-channel-table',
  standalone: true,
  imports: [
    BulkActionBarComponent,
    ButtonComponent,
    CheckboxComponent,
    DatatableComponent,
    IllustratedAvatarComponent,
    SearchComponent,
    MultiSelectComponent,
    SelectComponent,
    TagComponent,
    TooltipModule,
    TranslateModule,
  ],
  templateUrl: './agent-channel-table.component.html',
  styleUrl: './agent-channel-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.agent-channel-table--compact]': 'compact()' },
})
export class AgentChannelTableComponent {
  private readonly translate = inject(TranslateService);
  /* El idioma como DEPENDENCIA del computed. `translate.instant()` es una
   * llamada, no una señal: sin esto las cabeceras se calculan una vez y se
   * quedan congeladas al cambiar de idioma (el pipe `| translate` que había
   * antes sí reaccionaba). Lo vigila `audit:datatables` §6. */
  private readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(
      map((e) => e.lang),
      startWith(this.translate.currentLang)
    ),
    { initialValue: this.translate.currentLang }
  );

  private readonly agentTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('agentTpl');
  private readonly channelTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('channelTpl');
  private readonly levelTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('levelTpl');
  private readonly actionsTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('actionsTpl');

  protected readonly columns = computed<readonly ScColumnDef<VisibleRow>[]>(
    () => {
      this.currentLang();
      return [
        {
          field: 'agent',
          header: this.translate.instant('groups.form.assigned.col_agent'),
          cellTemplate: this.agentTpl(),
        },
        /* Con la estrategia Niveles, el nivel de cada agente va en su fila: donde ya se decide quién atiende qué. */
        ...(this.showLevel()
          ? [
              {
                field: 'level',
                header: this.translate.instant('groups.form.assigned.col_level'),
                width: '6.5rem',
                cellTemplate: this.levelTpl(),
                stopRowClick: true,
              },
            ]
          : []),
        /* 6.5rem: «Web Chat» es el rótulo más largo con espacio, y a 5.5 partía en dos líneas y
         * subía la cabecera entera (visto a 1440 el 2026-09-26). Compacta, 5rem: con el relleno de
         * celda de la tabla pequeña (8 a cada lado, no 14) le quedan 64 px, y cabe en una línea. */
        ...(this.channelColumns() ? this.groupChannels() : []).map((ch) => ({
          field: ch,
          header: this.translate.instant(CHANNEL_LABEL_KEYS[ch]),
          width: this.compact() ? CHANNEL_COL_COMPACT : '6.5rem',
          align: 'center' as const,
          cellTemplate: this.channelTpl(),
          stopRowClick: true,
        })),
        {
          field: 'actions',
          header: '',
          headerAriaLabel: this.translate.instant('common.actions'),
          width: this.compact() ? ACTIONS_COL_COMPACT : '3.5rem',
          align: 'center',
          cellTemplate: this.actionsTpl(),
          stopRowClick: true,
        },
      ];
    }
  );

  readonly groupChannels = input.required<readonly GroupChannel[]>();
  readonly links = input.required<readonly GroupAgentLink[]>();
  readonly availableAgents =
    input.required<readonly AgentChannelTableAgent[]>();
  readonly groupId = input.required<number>();
  /** Enseña la columna Nivel (estrategia de teléfono Niveles). */
  readonly showLevel = input(false);
  /**
   * Elegir filas para actuar en lote. Apagado en el panel rápido del listado: su barra de lote es
   * `position: fixed` y quedaría DEBAJO de la máscara del panel (z-index 1050 frente a 1060).
   */
  readonly selectable = input(true);
  /**
   * La tabla del panel rápido: la pequeña del DS (`size="sm"`), columnas de canal y papelera más estrechas y la
   * barra en una línea. La ficha sigue en la de siempre (DD-131).
   */
  readonly compact = input(false);
  /**
   * Una columna por canal del grupo. El panel la apaga en un grupo de un solo canal: todo agente asignado lo
   * atiende, y la columna solo eran casillas bloqueadas (DD-131).
   */
  readonly channelColumns = input(true);

  readonly linksChange = output<readonly GroupAgentLink[]>();

  protected readonly trashIcon = 'delete';

  protected readonly bulkEntity = useBulkEntityI18n({
    singular: 'common.bulk.entity.agent_singular',
    plural: 'common.bulk.entity.agent_plural',
  });

  protected readonly rowAriaLabel = (row: VisibleRow): string => row.agent.name;

  /** Los agentes elegidos, por id. Se conservan aunque el filtro los esconda. */
  protected readonly selectedIds = signal<ReadonlySet<number>>(new Set());

  /* El adaptador entre el `Set` y la selección por FILAS de `sc-datatable`: baja solo lo
   * visible (la casilla de cabecera decide «todas» comparando con `value`) y al subir
   * conserva lo que la búsqueda esconde, que es el lado que no destruye una elección que
   * el usuario no ve. */
  protected readonly selectedRows = computed<readonly VisibleRow[]>(() => {
    const sel = this.selectedIds();
    return this.visibleRows().filter((r) => sel.has(r.agent.id));
  });

  protected onSelectionChange(rows: readonly VisibleRow[]): void {
    const visibles = new Set(this.visibleRows().map((r) => r.agent.id));
    const elegidas = new Set(rows.map((r) => r.agent.id));
    this.selectedIds.update((prev) => {
      const next = new Set(prev);
      for (const id of visibles) {
        if (elegidas.has(id)) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  protected clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  /** En lote: quita a los elegidos del grupo. */
  protected bulkUnassign(): void {
    const sel = this.selectedIds();
    if (sel.size === 0) return;
    this.linksChange.emit(this.links().filter((l) => !sel.has(l.agentId)));
    this.clearSelection();
  }

  /** Filtro de las filas asignadas. Añadir va por su desplegable, aparte: un solo campo
   *  para las dos cosas obligaba a adivinar qué haría Enter. */
  protected readonly query = signal('');

  /** Map agentId → AgentChannelTableAgent for fast row hydration. */
  private readonly agentById = computed(() => {
    const map = new Map<number, AgentChannelTableAgent>();
    for (const a of this.availableAgents()) map.set(a.id, a);
    return map;
  });

  /** Hydrated rows in the order their links arrive (caller chooses). */
  protected readonly assignedRows = computed<readonly VisibleRow[]>(() => {
    const map = this.agentById();
    return this.links()
      .map((link) => {
        const agent = map.get(link.agentId);
        return agent ? { link, agent } : null;
      })
      .filter((r): r is VisibleRow => r !== null);
  });

  /** Query-filtered rows used for the table body. */
  protected readonly visibleRows = computed<readonly VisibleRow[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.assignedRows();
    return this.assignedRows().filter((r) =>
      r.agent.name.toLowerCase().includes(q)
    );
  });

  /** Lo marcado en «Añadir agentes»: los que ya están en el grupo. */
  protected readonly assignedIds = computed<number[]>(() => this.links().map((l) => l.agentId));

  /** Cuántas filas no tienen ningún canal (el aviso suave de la barra). Todas, en pausa o no:
   *  desde que la pausa no se toca aquí, una fila sin canales es igual de rara en los dos casos. */
  protected readonly zeroChannelCount = computed(
    () => this.assignedRows().filter((r) => r.link.channels.length === 0).length,
  );

  protected hasChannel(link: GroupAgentLink, channel: string): boolean {
    return link.channels.includes(channel as Channel);
  }

  /** El único canal que le queda: su casilla no se desmarca aquí (para sacarle, Quitar). */
  protected isLastChannel(link: GroupAgentLink, channel: string): boolean {
    return isLastChannel(link, channel);
  }

  // -- mutations -----------------------------------------------------

  /** Marcar añade al final (con todos los canales del grupo); desmarcar quita. El orden de los que siguen no cambia. */
  protected onAssignedChange(value: unknown): void {
    if (!Array.isArray(value)) return;
    const next = new Set(value as number[]);
    const current = new Set(this.links().map((l) => l.agentId));
    const added: GroupAgentLink[] = [...next]
      .filter((agentId) => !current.has(agentId))
      .map((agentId) => newLinkFor({ agentId, groupId: this.groupId(), groupChannels: [...this.groupChannels()], level: 1 }));
    this.linksChange.emit([...this.links().filter((l) => next.has(l.agentId)), ...added]);
    this.selectedIds.update((prev) => new Set([...prev].filter((id) => next.has(id))));
  }

  protected removeRow(agentId: number): void {
    this.linksChange.emit(this.links().filter((l) => l.agentId !== agentId));
    if (this.selectedIds().has(agentId)) {
      this.selectedIds.update((prev) => {
        const next = new Set(prev);
        next.delete(agentId);
        return next;
      });
    }
  }

  protected toggleChannel(agentId: number, field: string): void {
    const channel = field as Channel;
    this.linksChange.emit(
      this.links().map((l) => (l.agentId === agentId ? toggleLinkChannel(l, channel, { minOne: true }) : l)),
    );
  }

  protected readonly levelOptions = LEVEL_OPTIONS;

  protected setLevel(agentId: number, value: unknown): void {
    if (typeof value !== 'number') return;
    this.linksChange.emit(this.links().map((l) => (l.agentId === agentId ? { ...l, level: value } : l)));
  }

  // -- helpers -------------------------------------------------------

  /** Keep a stable channel order so toggling does not visually reshuffle. */
}
