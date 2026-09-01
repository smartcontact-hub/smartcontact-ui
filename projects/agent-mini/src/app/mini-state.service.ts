import { Injectable, computed, signal } from '@angular/core';

/**
 * Códigos de estado del agente REAL ('AgentStatusAED'). Son los suyos, no una
 * numeración nuestra: el Comunicador decide con ellos si se puede llamar y si la
 * navbar va en rojo. Copiados del modelo de 'projects/agent' (el mini es autocontenido:
 * el 'rootDir' por proyecto impide importar el servicio de 'agent', ver
 * 'projects/agent/src/app/app.config.ts').
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

/** Estados desde los que el agente PUEDE iniciar una llamada. */
const CAN_CALL = new Set<number>([
  AGENT_STATUS.ACTIVO,
  AGENT_STATUS.POSTCONVERSANDO,
  AGENT_STATUS.MANAGE_TICKET,
  AGENT_STATUS.ADMINISTRATIVO,
  AGENT_STATUS.IN_CONVERSATION,
  AGENT_STATUS.MANAGE_CONVERSATION_LOST,
]);

export interface StatusOpt {
  readonly label: string;
  /** Código real; decide el color de la navbar y si se puede llamar. */
  readonly code: number;
  /** Clase de color de la píldora de estado (agent-status.component.scss del real). */
  readonly cls: 'available' | 'no-available' | 'administrative';
  /**
   * Solo 'Administrativo' se despliega en el panel, con buscador y lista «Seleccione
   * grupo» (ver comunicador.md §«El panel de Estados»). El resto son filas planas.
   */
  readonly expandable?: boolean;
}

/**
 * Cerebro del Agent Mini. Los NUEVE estados del desplegable real, en su orden
 * (ver 'projects/agent/docs/comunicador.md'). Todo lo que no es Disponible / No
 * disponible cae en 'ADMINISTRATIVO' (las pausas del agente: Armario, Baño, etc.).
 */
@Injectable({ providedIn: 'root' })
export class MiniStateService {
  readonly options: readonly StatusOpt[] = [
    { label: 'Disponible', code: AGENT_STATUS.ACTIVO, cls: 'available' },
    { label: 'No disponible', code: AGENT_STATUS.INACTIVO, cls: 'no-available' },
    { label: 'Armario', code: AGENT_STATUS.ADMINISTRATIVO, cls: 'administrative' },
    { label: 'Baño', code: AGENT_STATUS.ADMINISTRATIVO, cls: 'administrative' },
    { label: 'casa', code: AGENT_STATUS.ADMINISTRATIVO, cls: 'administrative' },
    { label: 'Comida', code: AGENT_STATUS.ADMINISTRATIVO, cls: 'administrative' },
    { label: 'curso', code: AGENT_STATUS.ADMINISTRATIVO, cls: 'administrative' },
    { label: 'WC', code: AGENT_STATUS.ADMINISTRATIVO, cls: 'administrative' },
    { label: 'Administrativo', code: AGENT_STATUS.ADMINISTRATIVO, cls: 'administrative', expandable: true },
  ];

  readonly status = signal<StatusOpt>(this.options[0]);

  /** Verde solo en 'ACTIVO'. */
  readonly available = computed(() => this.status().code === AGENT_STATUS.ACTIVO);

  /** Si es false, la navbar del Comunicador va en rojo ('#762727'). */
  readonly canCall = computed(() => CAN_CALL.has(this.status().code));

  /** Número marcado en el dialpad. */
  readonly phoneNumber = signal('');

  /** Fija el estado desde el panel de Estados (el desplegable de la barra inferior). */
  setStatus(opt: StatusOpt): void {
    this.status.set(opt);
  }

  press(key: string): void {
    this.phoneNumber.update((v) => v + key);
  }

  del(): void {
    this.phoneNumber.update((v) => v.slice(0, -1));
  }
}
