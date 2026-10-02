import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  untracked,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import {
  ScButtonComponent as ButtonComponent,
  ScDialogComponent as DialogComponent,
  ScDrawerComponent as DrawerComponent,
  ScMessageComponent as MessageComponent,
} from '@smartcontact-hub/components';

import { CrossTabLockService } from '@core/services';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { AgentsStore } from '@features/admin/agents/state/agents.store';
import { GroupAgentLinksStore } from '@features/admin/services/group-agent-links.store';
import type { GroupAgentLink } from '@features/admin/services/group-agent-links.types';
import { clampLinksToChannels, diffLinks, familiesOf } from '@features/admin/services/group-channels.core.mjs';

import { GROUP_CHANNELS, type Group, type GroupChannel } from '../../data/groups-data';
import {
  ACTIONS_COL_COMPACT,
  type AgentChannelTableAgent,
  AgentChannelTableComponent,
  CHANNEL_COL_COMPACT,
  LEVEL_COL_REM,
} from '../agent-channel-table/agent-channel-table.component';

/**
 * El ancho del panel sale de lo que lleva dentro (DD-131), en rem. Hasta el 2026-09-28 era un `52rem` fijo, el
 * ancho de la tabla de la ficha: con dos canales dejaba 450 px entre el nombre y su primera casilla (medido a 1440).
 *   · NOMBRE: 15rem, que caben el avatar, un nombre largo y «En pausa»; más largo, se recorta con su `title`.
 *   · MARCO: el relleno del cajón (15,75 a cada lado) y el borde de la tabla.
 *   · MÍNIMO: 28rem, lo que piden el título y la barra (buscar + «Añadir agentes…») en una línea.
 */
const PANEL_NAME_REM = 15;
const PANEL_CHROME_REM = 2.25;
const PANEL_MIN_REM = 28;

/**
 * EL PANEL RÁPIDO DE AGENTES, desde el listado de grupos. Asignar y desasignar agentes y sus canales
 * es lo que más se hace con un grupo una vez creado (visión de producto de grupos, 2026-09-25), así
 * que está a un clic de la fila, sin abrir la ficha. Es la MISMA tabla que la sección Agentes de la
 * ficha: mismas reglas (al menos un canal, «Quitar» con un solo sentido) y mismas palabras.
 *
 * Tres detalles medidos contra `p-drawer` 22.1:
 *   · Su cierre (la X, el clic fuera y Escape) NO se puede vetar: emite y se cierra. Por eso los
 *     tres van apagados y cierra este panel, que pregunta antes si hay cambios sin guardar. Escape
 *     vuelve a cerrar, por la misma puerta.
 *   · Dentro no se eligen filas: la barra de lote es `position: fixed` y quedaría debajo de la
 *     máscara del panel.
 *   · El pie va dentro del contenido, abajo del todo. `p-drawer` solo pinta el suyo con una plantilla
 *     `#footer` hija directa, que `sc-drawer` aún no deja pasar; con un solo panel que lo pida, no se
 *     toca el DS (DD-121).
 *
 * Mientras está abierto coge el mismo candado que la ficha (`CrossTabLockService`): el mismo grupo
 * abierto en otra pestaña avisa en las dos.
 */
@Component({
  selector: 'sc-group-agents-panel',
  imports: [
    AgentChannelTableComponent,
    ButtonComponent,
    DialogComponent,
    DrawerComponent,
    MessageComponent,
    TranslateModule,
  ],
  templateUrl: './group-agents-panel.component.html',
  styleUrl: './group-agents-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupAgentsPanelComponent implements OnDestroy {
  private readonly linksStore = inject(GroupAgentLinksStore);
  private readonly agentsStore = inject(AgentsStore);
  private readonly crossTab = inject(CrossTabLockService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);

  /** El grupo cuyo panel está abierto; `null`, cerrado. */
  readonly group = input<Group | null>(null);
  /** El panel se ha cerrado (guardando o no). */
  readonly closed = output<void>();

  protected readonly links = signal<readonly GroupAgentLink[]>([]);
  private readonly initialLinks = signal<readonly GroupAgentLink[]>([]);
  protected readonly conflict = signal(false);
  protected readonly confirmDiscard = signal(false);
  private releaseLock: (() => void) | null = null;

  constructor() {
    // Al abrir, o al pasar a otro grupo: sus agentes, recortados a los canales que el grupo ofrece.
    effect(() => {
      const group = this.group();
      untracked(() => this.load(group));
    });
  }

  ngOnDestroy(): void {
    this.unlock();
  }

  /** Los canales del grupo, en el orden canónico: la tabla saca de ellos sus familias. */
  protected readonly channels = computed<readonly GroupChannel[]>(() => {
    const group = this.group();
    return group ? GROUP_CHANNELS.filter((c) => group.channels.includes(c)) : [];
  });

  /** Las familias que ofrece: son las columnas de la tabla (DD-147). Web Chat y WhatsApp son una sola, Chat. */
  private readonly families = computed(() => familiesOf(this.channels()));

  /** Con la estrategia Niveles, el nivel de cada agente va en su fila, como en la ficha. */
  protected readonly levelFamilies = computed<readonly ('phone' | 'chat')[]>(() => {
    const group = this.group();
    return [
      ...(group && this.families().includes('phone') && group.strategy === 'Niveles' ? ['phone' as const] : []),
      ...(group && this.families().includes('chat') && group.chatStrategy === 'Niveles' ? ['chat' as const] : []),
    ];
  });

  /**
   * Columnas de canal solo si hay algo que elegir (DD-131). En un grupo de un solo canal todo agente asignado lo
   * atiende y la columna eran casillas bloqueadas, una por fila. Vuelve si alguna fila LLEGÓ sin canal (datos de
   * antes, o recortada al abrir): es la única forma de dárselo desde aquí. Se mira lo que llegó, no lo de ahora:
   * con lo de ahora, marcar esa casilla quitaba la columna y el panel encogía bajo el puntero. Un agente añadido
   * aquí nunca llega sin canal (entra con todos los del grupo).
   */
  protected readonly channelColumns = computed(
    () => this.families().length > 1 || this.initialLinks().some((l) => l.channels.length === 0),
  );

  /** El ancho del cajón, en función de sus columnas; nunca más que la pantalla. */
  protected readonly width = computed(() => {
    const channelCols = this.channelColumns() ? this.families().length : 0;
    const rem =
      PANEL_NAME_REM +
      channelCols * parseFloat(CHANNEL_COL_COMPACT) +
      this.levelFamilies().length * LEVEL_COL_REM +
      parseFloat(ACTIONS_COL_COMPACT) +
      PANEL_CHROME_REM;
    return `min(${Math.max(PANEL_MIN_REM, rem)}rem, 100vw)`;
  });

  protected readonly availableAgents = computed<readonly AgentChannelTableAgent[]>(() =>
    this.agentsStore.agents().map((a) => ({ id: a.id, name: a.name, photo: a.photo })),
  );

  /** Cuántos AGENTES cambian (entran, salen o cambian de canales o de nivel): la N de «Guardar (N)». */
  protected readonly changes = computed(() => diffLinks(this.initialLinks(), this.links()).total);

  protected onLinksChange(links: readonly GroupAgentLink[]): void {
    this.links.set(links);
  }

  /**
   * Escape cierra por la MISMA puerta que Cancelar. Y no sigue subiendo: el contenedor de `p-drawer`
   * escucha Escape por su cuenta y, aunque `closeOnEscape` esté apagado (eso solo gobierna su oyente
   * del documento), llama a `hide(false)`, que quita la máscara y deja el panel abierto encima de un
   * listado que ya se puede pulsar (medido con PrimeNG 22.1.2).
   */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    this.requestClose();
  }

  /** Cancelar, o Escape: con cambios sin guardar, se pregunta antes. */
  protected requestClose(): void {
    if (this.changes() > 0) this.confirmDiscard.set(true);
    else this.close();
  }

  protected keepEditing(): void {
    this.confirmDiscard.set(false);
  }

  protected discard(): void {
    this.confirmDiscard.set(false);
    this.close();
  }

  protected save(): void {
    const group = this.group();
    const count = this.changes();
    if (!group || count === 0) return;
    this.linksStore.replaceLinksForGroup(
      group.id,
      this.links().map((l) => (l.groupId === group.id ? l : { ...l, groupId: group.id })),
    );
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant('groups.agents_panel.saved', { name: group.name }),
      life: TOAST_LIFE.success,
    });
    this.close();
  }

  private load(group: Group | null): void {
    this.unlock();
    this.conflict.set(false);
    this.confirmDiscard.set(false);
    const links = group ? clampLinksToChannels(this.linksStore.linksForGroup(group.id), group.channels) : [];
    this.links.set(links);
    this.initialLinks.set(links);
    if (group) this.releaseLock = this.crossTab.acquire('group', group.id, () => this.conflict.set(true));
  }

  private close(): void {
    this.unlock();
    this.closed.emit();
  }

  private unlock(): void {
    this.releaseLock?.();
    this.releaseLock = null;
  }
}
