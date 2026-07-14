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

/**
 * 🎭 DEMO-ONLY — capa de nombres curados para el preview.
 *
 * Los IDs son los REALES (alineados con la membresía `GroupAgentLinks`); solo se
 * maquilla el **display** para que la presentación no muestre datos de desarrollo
 * ("Agente AED 1", "Oscar Fernandez" sin tilde). La membresía y el match NO se
 * tocan. En producción esto no existe: se mostraría el nombre real de la entidad.
 * Decisión con Rafa (preview pulido). Si un ID no está, cae al nombre real del seed.
 */
const AGENT_DISPLAY_NAMES: Readonly<Record<number, string>> = {
  1: 'María Antúnez',
  2: 'Carlos Prats',
  3: 'Laura García',
  4: 'Bot Automático',
  5: 'Javier Soler',
  6: 'Ana Belén Ruiz',
  7: 'Mario Pérez',
  8: 'Inés Recio',
  9: 'Miguel Palacios',
  10: 'Sofía Marín',
  11: 'Diego Navarro',
  12: 'Óscar Bello',
  13: 'Óscar Fernández',
  14: 'Lucía Quero',
  15: 'Rafael Areses',
  16: 'Ángel Castaño',
};

const GROUP_DISPLAY_NAMES: Readonly<Record<number, string>> = {
  1: 'Atención General',
  2: 'Soporte Nivel 1',
  3: 'Campañas Salientes',
  4: 'Campañas',
  5: 'Clientes VIP',
  6: 'Ventas',
  7: 'Ventas Outbound',
  8: 'Equipo Ventas',
  9: 'Gestión de Pedidos',
  10: 'Soporte L2',
  11: 'Soporte Online',
  12: 'Reclamaciones',
  13: 'Soporte Taller',
  14: 'Telemarketing',
};

export const AGENT_ENTITIES: readonly AgentEntity[] = AGENTS_SEED.map((a) => ({
  id: a.id,
  name: AGENT_DISPLAY_NAMES[a.id] ?? a.name,
  code: a.code,
  status: a.status,
}));

export const GROUP_ENTITIES: readonly EntityRef[] = GROUPS_SEED.map((g) => ({
  id: g.id,
  name: GROUP_DISPLAY_NAMES[g.id] ?? g.name,
}));

/** Tipificación con su categoría (2 niveles) — el picker la muestra como ruta
 *  "Categoría / Nombre" y agrupa por categoría. */
export interface TipificacionEntity extends EntityRef {
  readonly category: string;
}

/** Espejo del seed de Tipificaciones (`repositories/instances/tipificaciones.ts`,
 *  cuyo SEED es interno y no se exporta). Mantener en sync si cambia allí —
 *  incluye la `category` del seed para las rutas jerárquicas del picker. */
export const TIPIFICACION_ENTITIES: readonly TipificacionEntity[] = [
  { id: 1, name: 'Consulta resuelta', category: 'Consulta' },
  { id: 2, name: 'Consulta escalada', category: 'Consulta' },
  { id: 3, name: 'Venta cerrada', category: 'Ventas' },
  { id: 4, name: 'Venta pendiente', category: 'Ventas' },
  { id: 5, name: 'Venta rechazada', category: 'Ventas' },
  { id: 6, name: 'Reclamación abierta', category: 'Reclamación' },
  { id: 7, name: 'Reclamación resuelta', category: 'Reclamación' },
  { id: 8, name: 'Incidencia técnica', category: 'Soporte' },
  { id: 9, name: 'Incidencia resuelta', category: 'Soporte' },
  { id: 10, name: 'Llamada abandonada', category: 'Otros' },
  { id: 11, name: 'Llamada perdida', category: 'Otros' },
  { id: 12, name: 'Información proporcionada', category: 'Consulta' },
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
