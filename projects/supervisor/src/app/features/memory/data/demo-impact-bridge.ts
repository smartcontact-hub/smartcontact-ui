/**
 * 🎭 DEMO-ONLY — puente de nombres para el preview de impacto.
 *
 * El mock de conversación, el seed admin y el catálogo Memory son tres universos
 * de nombres distintos (ver condition-eval). Para que "afecta a N conversaciones"
 * cuadre en la demo:
 * - **Servicios**: casan directos (mismo nombre) → no necesitan puente.
 * - **Grupos/colas**: `conversation.group` usa los nombres REALES del seed admin
 *   (mismo origen mock) → el puente devuelve el nombre real del grupo por id.
 * - **Agentes**: `conversation.origin` usa los nombres del catálogo Memory (Ana
 *   Martínez, María García…), que NO corresponden a IDs admin → mapa **fabricado**
 *   id→nombre-de-conversación (ids 1-9 = los 9 agentes que aparecen; el resto no
 *   casa ninguna conversación).
 *
 * En producción esto no existe: el motor de reglas evalúa contra datos reales por id.
 */
import { GROUPS_SEED } from '../../admin/groups/data/groups-data';

const groupRealName = new Map<number, string>(GROUPS_SEED.map((g) => [g.id, g.name]));

/** Nombre del grupo tal y como aparece en `conversation.group` (nombre real admin). */
export function groupConvName(id: number): string | undefined {
  return groupRealName.get(id);
}

const AGENT_CONV_NAME: Readonly<Record<number, string>> = {
  1: 'Ana Martínez',
  2: 'Carlos López',
  3: 'Elena Rodríguez',
  4: 'Javier Gómez',
  5: 'Laura Díaz',
  6: 'Luis Sánchez',
  7: 'María García',
  8: 'Oscar Fernández',
  9: 'Sergio Ruiz',
};

/** Nombre del agente tal y como aparece en `conversation.origin` (mapa demo). */
export function agentConvName(id: number): string | undefined {
  return AGENT_CONV_NAME[id];
}
