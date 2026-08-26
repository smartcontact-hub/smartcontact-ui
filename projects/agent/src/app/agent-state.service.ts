import { Injectable, computed, signal } from '@angular/core';
import type { Grupo } from './data/seed';

/**
 * Estados del agente en el Agent real ('AgentStatusAED'). Los códigos son los suyos,
 * no una numeración nuestra: el Comunicador decide con ellos si se puede llamar.
 */
export const AGENT_STATUS = {
  INACTIVO: 0,
  ACTIVO: 1,
  POSTCONVERSANDO: 14,
  MANAGE_TICKET: 15,
  ADMINISTRATIVO: 16,
  IN_CONVERSATION: 17,
  INACTIVE_AGENT: 18,
  MANAGE_CONVERSATION_LOST: 19,
} as const;

/** Los estados desde los que el agente PUEDE iniciar una llamada. */
const CAN_CALL = new Set<number>([
  AGENT_STATUS.ACTIVO,
  AGENT_STATUS.POSTCONVERSANDO,
  AGENT_STATUS.MANAGE_TICKET,
  AGENT_STATUS.ADMINISTRATIVO,
  AGENT_STATUS.IN_CONVERSATION,
  AGENT_STATUS.MANAGE_CONVERSATION_LOST,
]);

/**
 * Paso del flujo de gestión de una conversación perdida (SISMAC-3780), tal como lo
 * dibuja el Figma ('283:1707' → '283:3186' → '283:4712'):
 *
 *   idle       nada en marcha
 *   dialing    se pulsó «Gestionar»: el número origen está cargado en el dialpad
 *   incall     se pulsó llamar
 *   typifying  colgó: el Comunicador muestra Tipificación
 *   finishing  se guardó la tipificación: muestra «Finalizar gestión»
 */
export type ManageStep =
  | 'idle'
  | 'dialing'
  | 'incall'
  | 'typifying'
  | 'finishing';

export interface StatusOpt {
  readonly label: string;
  /** Código real; es lo que decide el color de la navbar del Comunicador. */
  readonly code: number;
}

/**
 * Estado del agente, compartido entre el footer (que lo cambia) y el Comunicador
 * (que lo pinta). En el real están enlazados: elegir «No disponible» deja al agente
 * en 'INACTIVO', y eso aplica '.makecall-allowedstatus', que tiñe la navbar de
 * '#762727' y apaga sus hover. Las pausas administrativas NO lo hacen.
 */
@Injectable({ providedIn: 'root' })
export class AgentStateService {
  /*
   * Grupos que el agente ha apagado a mano. Vive AQUÍ y no en cada componente porque el
   * mismo interruptor sale en DOS sitios —el KPI «Grupos asignados» y el Perfil del
   * Comunicador— y son el mismo grupo: apagarlo en uno tiene que verse en el otro.
   */
  private readonly gruposOff = signal<ReadonlySet<string>>(new Set());

  grupoActivo(g: Grupo): boolean {
    return g.on && !this.gruposOff().has(g.name);
  }

  toggleGrupo(g: Grupo): void {
    this.gruposOff.update((prev) => {
      const next = new Set(prev);
      if (next.has(g.name)) {
        next.delete(g.name);
      } else {
        next.add(g.name);
      }
      return next;
    });
  }

  /** Los NUEVE estados del desplegable real, en su orden y con su código. */
  readonly options: readonly StatusOpt[] = [
    { label: 'Disponible', code: AGENT_STATUS.ACTIVO },
    { label: 'No disponible', code: AGENT_STATUS.INACTIVO },
    { label: 'Armario', code: AGENT_STATUS.ADMINISTRATIVO },
    { label: 'Baño', code: AGENT_STATUS.ADMINISTRATIVO },
    { label: 'casa', code: AGENT_STATUS.ADMINISTRATIVO },
    { label: 'Comida', code: AGENT_STATUS.ADMINISTRATIVO },
    { label: 'curso', code: AGENT_STATUS.ADMINISTRATIVO },
    { label: 'WC', code: AGENT_STATUS.ADMINISTRATIVO },
    { label: 'Administrativo', code: AGENT_STATUS.ADMINISTRATIVO },
  ];

  readonly status = signal<StatusOpt>(this.options[0]);

  /** Verde en el botón de estado: solo 'ACTIVO'. */
  readonly available = computed(
    () => this.status().code === AGENT_STATUS.ACTIVO
  );

  /** Si es false, la navbar del Comunicador va en rojo. */
  readonly canCall = computed(() => CAN_CALL.has(this.status().code));

  /** Visibilidad del widget del Comunicador (lo abre el avatar). */
  readonly comunicatorOpen = signal(false);

  toggleComunicator(): void {
    this.comunicatorOpen.update((v) => !v);
  }

  // ── Flujo de gestión de conversaciones perdidas ──────────────────────────────

  readonly step = signal<ManageStep>('idle');

  /** Número cargado en el dialpad al pulsar «Gestionar». */
  readonly dialNumber = signal('');

  /** Ids de PENDING que este agente ha puesto en gestión. */
  readonly inManagement = signal<readonly number[]>([]);

  /** Ids ya finalizados. */
  readonly managed = signal<readonly number[]>([]);

  /** Pestaña que el Comunicador debe mostrar; 'null' la deja a su criterio. */
  readonly forcedTab = signal<string | null>(null);

  /** El agente está en post-conversación (la barra inferior lo refleja). */
  readonly postConversation = computed(
    () => this.step() === 'typifying' || this.step() === 'finishing'
  );

  /**
   * «Gestionar» en una fila de Pendientes: carga el número origen en el dialpad,
   * abre el Comunicador en Teléfono y marca la conversación como en gestión.
   */
  manage(id: number, origin: string): void {
    this.inManagement.update((ids) => (ids.includes(id) ? ids : [...ids, id]));
    this.dialNumber.set(origin);
    this.step.set('dialing');
    this.comunicatorOpen.set(true);
    this.forcedTab.set('call');
  }

  /** Botón verde de llamar. */
  startCall(): void {
    this.step.set('incall');
  }

  /** Colgar → Tipificación. */
  hangUp(): void {
    this.step.set('typifying');
  }

  /** Guardar la tipificación → «Finalizar gestión». */
  saveTypification(): void {
    this.step.set('finishing');
  }

  /** «Finalizar»: las seleccionadas pasan a gestionadas y el ciclo se cierra. */
  finish(ids: readonly number[]): void {
    this.managed.update((m) => [...new Set([...m, ...ids])]);
    this.inManagement.update((ids2) => ids2.filter((i) => !ids.includes(i)));
    this.step.set('idle');
    this.dialNumber.set('');
    this.forcedTab.set('chat');
  }
}
