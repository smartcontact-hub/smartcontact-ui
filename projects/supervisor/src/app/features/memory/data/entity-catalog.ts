/**
 * Catálogo de entidades para resolver referencias de condiciones (constructor v2).
 *
 * Reusa los seeds admin (`AGENTS_SEED`/`GROUPS_SEED`) — sus IDs están **alineados
 * con la membresía** (`GroupAgentLinksStore` referencia los mismos agentId/groupId),
 * así "los agentes del grupo X" resuelve de verdad. Las tipificaciones se espejan
 * (su seed no se exporta). Los **servicios no tienen entidad/ID** → solo nombres.
 *
 * Nota demo: en producción esto saldría de un servicio compartido; aquí mock.
 * Los nombres de agente son los REALES del sistema (p.ej. "Agente AED 1"), no los
 * curados del Figma — así la membresía y el match son honestos.
 */
import { AGENTS_SEED } from '../../admin/agents/data/agents-data';
import { GROUPS_SEED } from '../../admin/groups/data/groups-data';
import { SERVICE_OPTIONS } from './conversation-filter-options';

export interface EntityRef {
  readonly id: number;
  readonly name: string;
}

export interface AgentEntity extends EntityRef {
  readonly code: string;
  readonly status: 'active' | 'inactive';
}

export const AGENT_ENTITIES: readonly AgentEntity[] = AGENTS_SEED.map((a) => ({
  id: a.id,
  name: a.name,
  code: a.code,
  status: a.status,
}));

export const GROUP_ENTITIES: readonly EntityRef[] = GROUPS_SEED.map((g) => ({
  id: g.id,
  name: g.name,
}));

/** Espejo del seed de Tipificaciones (`repositories/instances/tipificaciones.ts`,
 *  cuyo SEED es interno y no se exporta). Mantener en sync si cambia allí. */
export const TIPIFICACION_ENTITIES: readonly EntityRef[] = [
  { id: 1, name: 'Consulta resuelta' },
  { id: 2, name: 'Consulta escalada' },
  { id: 3, name: 'Venta cerrada' },
  { id: 4, name: 'Venta pendiente' },
  { id: 5, name: 'Venta rechazada' },
  { id: 6, name: 'Reclamación abierta' },
  { id: 7, name: 'Reclamación resuelta' },
  { id: 8, name: 'Incidencia técnica' },
  { id: 9, name: 'Incidencia resuelta' },
  { id: 10, name: 'Llamada abandonada' },
  { id: 11, name: 'Llamada perdida' },
  { id: 12, name: 'Información proporcionada' },
];

/** Servicios: solo nombres (sin entidad/ID en el sistema). */
export const SERVICE_NAMES: readonly string[] = SERVICE_OPTIONS.map((s) => s.value);

const agentById = new Map(AGENT_ENTITIES.map((a) => [a.id, a]));
const groupById = new Map(GROUP_ENTITIES.map((g) => [g.id, g]));
const tipificacionById = new Map(TIPIFICACION_ENTITIES.map((t) => [t.id, t]));

export function agentById_(id: number): AgentEntity | undefined {
  return agentById.get(id);
}
export function groupById_(id: number): EntityRef | undefined {
  return groupById.get(id);
}
export function tipificacionById_(id: number): EntityRef | undefined {
  return tipificacionById.get(id);
}
