/**
 * Cross-store link between an agent and a group.
 *
 * Replaces three legacy fields that were each only half of the story:
 *   - `Agent.channels` (the agent's global channel capabilities)
 *   - `Agent.groups`   (which groups the agent belonged to + per-group active flag)
 *   - `Group.assignedAgents` (agent names listed on the group)
 *
 * The new model collapses all three into a single `(agentId, groupId)` row
 * carrying the *per-pair* channel set and active flag, matching how Voice
 * (the legacy platform we are migrating from) actually models permissions
 * (Figura 15 of the Voice user manual).
 *
 * Invariants enforced by `GroupAgentLinksStore`:
 *   - exactly one link per `(agentId, groupId)` pair;
 *   - `link.channels ⊆ familiesOf(group.channels)` (the link cannot enable a
 *     family the group does not offer — the forms clamp it);
 *   - removing a channel from a group cascades to every link in O(n).
 */

import { ChannelFamily } from '@features/admin/groups/data/groups-data';

import { canonicalizeChannels as canonicalizeCore } from './group-channels.core.mjs';

/**
 * Por dónde atiende un agente en un grupo: una FAMILIA (DD-147). Teléfono, Chat (Web Chat y WhatsApp juntos) o
 * Email, como en el AED en vivo. Hasta DD-147 era el canal del grupo, con WhatsApp aparte; lo guardado así se lee
 * con `chat` (`linkWithFamilies`).
 */
export type Channel = ChannelFamily;

export interface GroupAgentLink {
  readonly agentId: number;
  readonly groupId: number;
  /** Las familias del grupo que atiende. */
  readonly channels: readonly Channel[];
  /** False = paused (config preserved, agent does not receive contacts in this group). */
  readonly active: boolean;
  /**
   * Nivel del agente en el grupo (1 se atiende primero) para la estrategia Niveles. Se guardaba ya
   * sin tipar desde la tabla de agentes del grupo; ahora es parte del contrato. Se conserva aunque la
   * estrategia cambie, para no perderlo si vuelve.
   */
  readonly level?: number;
}

/** El nivel de un enlace, 1 si no lo tiene. */
export function levelOf(link: GroupAgentLink): number {
  return link.level ?? 1;
}

/**
 * Deja una lista de canales en su forma canónica: sin repetidos y siempre en el
 * mismo orden (`phone` → `chat` → `email`, las familias de DD-147).
 *
 * Estaba duplicada palabra por palabra en `group-assignment-table` y
 * `agent-channel-table`, las dos tablas que editan estos enlaces desde los dos
 * lados (desde el agente y desde el grupo). Vive aquí, con el tipo `Channel`,
 * porque el ORDEN es parte del contrato del dato: dos listas con los mismos
 * canales tienen que serializarse igual, o comparar enlaces da falsos cambios.
 *
 * **Solo se unifica el helper.** Esas dos tablas también divergen en su UX, y
 * eso no se toca: es decisión de producto, no una limpieza.
 */
export function canonicalizeChannels(channels: readonly Channel[]): readonly Channel[] {
  /* El orden vive en `group-channels.core.mjs`, con las demás reglas de canales (2026-09-26). Hasta DD-147 el
   * enlace podía llevar `whatsapp`, y faltaba aquí: marcarlo no guardaba nada (medido el 2026-09-23). Desde
   * DD-147 el enlace guarda familias, y WhatsApp va dentro de Chat. */
  return canonicalizeCore(channels);
}
