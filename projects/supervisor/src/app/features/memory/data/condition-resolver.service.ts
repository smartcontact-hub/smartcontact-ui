import { inject, Injectable } from '@angular/core';

import { GroupAgentLinksStore } from '../../admin/services/group-agent-links.store';
import type { ConditionRef } from './condition.types';
import {
  AGENT_ENTITIES,
  type AgentEntity,
  agentById_,
  type EntityRef,
  GROUP_ENTITIES,
  groupById_,
  SERVICE_NAMES,
  type TipificacionEntity,
  TIPIFICACION_ENTITIES,
  tipificacionById_,
} from './entity-catalog';

/**
 * Resuelve referencias tipadas de condiciones (constructor v2) a etiquetas y, en
 * el caso de `agentGroup`, a sus **miembros vivos** vía `GroupAgentLinksStore`.
 *
 * Es lo que hace dinámico el alcance: una condición que apunta a "miembros del
 * grupo X" se recalcula sola — añadir un agente al grupo lo incluye, sin reeditar
 * la regla. El conteo de miembros es en vivo (lee la membresía actual).
 */
@Injectable({ providedIn: 'root' })
export class ConditionResolverService {
  private readonly links = inject(GroupAgentLinksStore);

  /** Catálogos para los pickers (Bloque 3). Estáticos (mock); en real, un store. */
  readonly agents: readonly AgentEntity[] = AGENT_ENTITIES;
  readonly groups: readonly EntityRef[] = GROUP_ENTITIES;
  readonly tipificaciones: readonly TipificacionEntity[] = TIPIFICACION_ENTITIES;
  readonly services: readonly string[] = SERVICE_NAMES;

  /** Etiqueta legible de una referencia. */
  label(ref: ConditionRef): string {
    switch (ref.kind) {
      case 'service':
        return ref.name;
      case 'group':
        return groupById_(ref.id)?.name ?? `Grupo #${ref.id}`;
      case 'agent':
        return agentById_(ref.id)?.name ?? `Agente #${ref.id}`;
      case 'agentGroup':
        return groupById_(ref.id)?.name ?? `Grupo #${ref.id}`;
      case 'tipificacion':
        return tipificacionById_(ref.id)?.name ?? `Tipificación #${ref.id}`;
      case 'category':
        // Bloque 2: resolver vía CategoriesStore cuando se añada el campo.
        return ref.id;
    }
  }

  /** IDs de agentes miembros (activos) de un grupo, en vivo. */
  memberAgentIds(groupId: number): readonly number[] {
    return this.links
      .linksForGroup(groupId)
      .filter((l) => l.active)
      .map((l) => l.agentId);
  }

  /** Nº de agentes miembros (vivo) de un grupo. */
  memberCount(groupId: number): number {
    return this.memberAgentIds(groupId).length;
  }

  /** Nombres de los agentes miembros (para proyección legacy + match de impacto). */
  memberAgentNames(groupId: number): readonly string[] {
    return this.memberAgentIds(groupId)
      .map((id) => agentById_(id)?.name)
      .filter((n): n is string => !!n);
  }
}
