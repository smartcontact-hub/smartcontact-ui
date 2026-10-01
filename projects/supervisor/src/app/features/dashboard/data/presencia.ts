import { AGENTS_SEED, type Agent, type PresenceStatus } from '@features/admin/agents/data/agents-data';

import type { AgentPresence, DashboardMonitor, DashboardWidget } from './dashboard.types';
import { DEMO_AGENTS, DEMO_ENTITIES } from './demo-entities';

/**
 * EL ESTADO DE UN AGENTE EN EL DASHBOARD sale de Administración › Agentes, la única fuente (DD-139).
 *
 * El listado dice por qué un agente no recibe conversaciones (Baño, Comida, Formación…); el Dashboard cuenta tres
 * cosas: disponible, conectado sin recibirlas («En pausa») y fuera del puesto («Desconectado»). Esta tabla es la
 * correspondencia, y cubre TODOS los estados del listado a propósito: uno nuevo no compila hasta que se decida aquí qué
 * es en el Dashboard.
 *
 * «En pausa» es todo lo conectado que no está disponible, para que disponibles y en pausa sumen los conectados de los
 * anillos y del panel de grupos. Por eso entran Administrativo y Post-conversando, aunque no sean una pausa elegida: el
 * monitor del Supervisor cuenta aparte a quien está en una conversación o acaba de salir de ella («en conversación»),
 * un estado que este Dashboard no tiene. Si lo tiene algún día, Post-conversando pasa ahí.
 */
export const PRESENCIA_EN_DASHBOARD: Readonly<Record<PresenceStatus, AgentPresence>> = {
  disponible: 'available',
  no_disponible: 'paused',
  bano: 'paused',
  comida: 'paused',
  formacion: 'paused',
  administrativo: 'paused',
  post_conversando: 'paused',
  desconectado: 'offline',
};

/** El estado en el Dashboard de un agente, por el nombre con que lo pinta; `undefined` si no es un agente de la demo. */
export type EstadoDeAgente = (nombre: string) => AgentPresence | undefined;

const ID_POR_NOMBRE = new Map(DEMO_AGENTS.map(({ id, nombre }) => [nombre, id]));

/**
 * Lee el estado de los agentes de la demo en una lista de agentes de Administración: la del almacén (`AgentsStore`),
 * que es la que pinta el listado, o las semillas con que nace. Va por id: el nombre que pinta el Dashboard lleva a su
 * id, y el id a su estado en la lista, así que un agente renombrado en Administración se sigue encontrando. Uno que
 * Administración ya no tiene, o sin estado, no puede estar conectado: «Desconectado» en la tabla, los anillos y el panel.
 */
export function estadosDeLaDemo(agentes: readonly Pick<Agent, 'id' | 'presenceStatus'>[]): EstadoDeAgente {
  const porId = new Map(agentes.map((a) => [a.id, a.presenceStatus]));
  return (nombre) => {
    const id = ID_POR_NOMBRE.get(nombre);
    if (id === undefined) return undefined;
    const estado = porId.get(id);
    return estado ? PRESENCIA_EN_DASHBOARD[estado] : 'offline';
  };
}

/** El de las semillas: con el que nacen los monitores de fábrica, antes de leer el almacén. */
export const ESTADO_EN_SEMILLAS: EstadoDeAgente = estadosDeLaDemo(AGENTS_SEED);

/** Cuántos hay en un estado y cuántos conectados; `null` si alguno no es un agente de la demo. */
export function contarEstado(
  estados: readonly (AgentPresence | undefined)[],
  presence: AgentPresence,
): { readonly value: number; readonly total: number } | null {
  if (!estados.length || estados.some((e) => e === undefined)) return null;
  return { value: estados.filter((e) => e === presence).length, total: estados.filter((e) => e !== 'offline').length };
}

/** Conectados y disponibles del panel de grupos: sobre todos los agentes de la demo, que no los reparte por grupo (DD-129). */
export function agentesDelPanel(estadoDe: EstadoDeAgente): { readonly connected: number; readonly available: number } {
  const cuenta = contarEstado(DEMO_ENTITIES.agents.map(estadoDe), 'available');
  return { connected: cuenta?.total ?? 0, available: cuenta?.value ?? 0 };
}

/**
 * Un monitor con el estado de cada agente leído de Administración: la lectura ADITIVA de lo guardado. El navegador
 * guarda los monitores con el estado que tenía cada agente entonces (el latido los escribe cada 8 s), y subir la versión
 * del almacén borraría los de cada usuario. Se queda todo lo guardado (disposición, nombres, cifras de conversaciones)
 * menos el estado y lo que se cuenta con él: el punto de cada fila, los anillos y el panel de grupos.
 */
export function conPresencia(monitor: DashboardMonitor, estadoDe: EstadoDeAgente): DashboardMonitor {
  const releer = (w: DashboardWidget): DashboardWidget => {
    switch (w.kind) {
      case 'agents-table':
        return { ...w, rows: w.rows.map((row) => ({ ...row, presence: estadoDe(row.name) ?? row.presence })) };
      case 'agents-state': {
        const cuenta = contarEstado(w.entities.map(estadoDe), w.presence);
        return cuenta ? { ...w, ...cuenta } : w;
      }
      case 'group-panel':
        return { ...w, ...agentesDelPanel(estadoDe) };
      default:
        return w;
    }
  };
  return { ...monitor, boxes: monitor.boxes.map((box) => ({ ...box, slots: box.slots.map((w) => (w ? releer(w) : w)) })) };
}
