import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
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

import { TOAST_LIFE } from '@core/utils/toast-life';
import { AgentsStore } from '@features/admin/agents/state/agents.store';
import { GroupAgentLinksStore } from '@features/admin/services/group-agent-links.store';
import type { GroupAgentLink } from '@features/admin/services/group-agent-links.types';
import { clampLinksToChannels, diffLinks, familiesOf } from '@features/admin/services/group-channels.core.mjs';

import { GROUP_CHANNELS, type Group, type GroupChannel } from '../../data/groups-data';
import {
  type AgentChannelTableAgent,
  AgentChannelTableComponent,
  COLUMN_REM,
  columnsRem,
} from '../agent-channel-table/agent-channel-table.component';

/**
 * El ancho del panel sale de lo que lleva dentro (DD-131), en rem. Hasta el 2026-09-28 era un `52rem` fijo, el
 * ancho de la tabla de la ficha: con dos canales dejaba 450 px entre el nombre y su primera casilla (medido a 1440).
 *   · COLUMNAS: las de la tabla compacta, medidas en ella (`COLUMN_REM`, DD-156). Cabe el email más largo de la
 *     semilla; uno más largo se recorta con su `title`.
 *   · MARCO: el relleno del cajón (15,75 a cada lado) y el borde de la tabla.
 *   · MÍNIMO: 28rem, lo que piden el título y la barra (filtro + búsqueda) en una línea.
 */
const PANEL_CHROME_REM = 2.25;
const PANEL_MIN_REM = 28;

/**
 * EL PANEL RÁPIDO DE AGENTES, desde el listado de grupos. Asignar y desasignar agentes y sus canales
 * es lo que más se hace con un grupo una vez creado (visión de producto de grupos, 2026-09-25), así
 * que está a un clic de la fila, sin abrir la ficha. Es la MISMA tabla que la sección Agentes de la
 * ficha: mismas reglas (al menos un canal, desmarcar Asignado para quitar) y mismas palabras.
 *
 * Tres detalles medidos contra `p-drawer` 22.1:
 *   · Su cierre (la X, el clic fuera y Escape) NO se puede vetar: emite y se cierra. Por eso los
 *     tres van apagados y cierra este panel, que pregunta antes si hay cambios sin guardar. Escape
 *     vuelve a cerrar, por la misma puerta.
 *   · Las cabeceras actúan sobre el resultado filtrado; el diálogo de confirmación vive en el shell.
 *   · El pie va dentro del contenido, abajo del todo. `p-drawer` solo pinta el suyo con una plantilla
 *     `#footer` hija directa, que `sc-drawer` aún no deja pasar; con un solo panel que lo pida, no se
 *     toca el DS (DD-121).
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
export class GroupAgentsPanelComponent {
  private readonly linksStore = inject(GroupAgentLinksStore);
  private readonly agentsStore = inject(AgentsStore);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);

  /** El grupo cuyo panel está abierto; `null`, cerrado. */
  readonly group = input<Group | null>(null);
  /** El panel se ha cerrado (guardando o no). */
  readonly closed = output<void>();

  protected readonly links = signal<readonly GroupAgentLink[]>([]);
  private readonly initialLinks = signal<readonly GroupAgentLink[]>([]);
  protected readonly confirmDiscard = signal(false);

  constructor() {
    // Al abrir, o al pasar a otro grupo: sus agentes, recortados a los canales que el grupo ofrece.
    effect(() => {
      const group = this.group();
      untracked(() => this.load(group));
    });
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

  /** El ancho del cajón, en función de sus columnas; nunca más que la pantalla. */
  protected readonly width = computed(() => {
    const rem = columnsRem(COLUMN_REM.compact, this.families(), this.levelFamilies().length) + PANEL_CHROME_REM;
    return `min(${Math.max(PANEL_MIN_REM, rem)}rem, 100vw)`;
  });

  protected readonly availableAgents = computed<readonly AgentChannelTableAgent[]>(() =>
    this.agentsStore.agents().map((a) => ({ id: a.id, name: a.name, email: a.email, photo: a.photo, presenceStatus: a.presenceStatus, allowedChannels: a.allowedChannels, selfActivate: a.permissions.selfActivate, teams: a.teams })),
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
      clampLinksToChannels(this.links(), group.channels, link => this.agentsStore.getAgent(link.agentId)?.allowedChannels).map((l) => (l.groupId === group.id ? l : { ...l, groupId: group.id })),
    );
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant('groups.agents_panel.saved', { name: group.name }),
      life: TOAST_LIFE.success,
    });
    this.close();
  }

  private load(group: Group | null): void {
    this.confirmDiscard.set(false);
    const links = group ? clampLinksToChannels(this.linksStore.linksForGroup(group.id), group.channels, link => this.agentsStore.getAgent(link.agentId)?.allowedChannels) : [];
    this.links.set(links);
    this.initialLinks.set(links);
  }

  /** Cerrar. El foco lo devuelve `sc-drawer` a quien lo abrió (la cifra de la fila en el listado, «Agentes» en el
   *  Monitor), si sigue en la página: hasta el 2026-10-05 lo hacía este panel a mano (DD-168). */
  private close(): void {
    this.closed.emit();
  }
}
