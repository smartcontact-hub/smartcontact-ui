import { nombreDeCosa, nombreDeGrupo, nombreDePersona } from '@core/services/juego-de-datos';
import { AGENTS_SEED } from '@features/admin/agents/data/agents-data';

import type { WidgetCategory } from './widget-catalog';

/**
 * Los agentes de la demo del Dashboard: los diez primeros de Administración › Agentes, por su id, con el nombre que
 * tienen allí. Su estado no se escribe aquí: es el que enseña el listado de agentes, leído con la correspondencia de
 * `presencia.ts` (DD-139). Hasta el 2026-10-01 el Dashboard llevaba su propia lista de estados (DD-127) y 6 de los 10
 * agentes salían en un estado en el Dashboard y en otro en el listado.
 */
const IDS_DE_LA_DEMO: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const SEMILLA_POR_ID = new Map(AGENTS_SEED.map((agente) => [agente.id, agente]));

/** Cada agente de la demo: su id en Administración y el nombre con que se enseña (el del juego activo). */
export const DEMO_AGENTS: readonly { readonly id: number; readonly nombre: string }[] = IDS_DE_LA_DEMO.flatMap((id) => {
  const agente = SEMILLA_POR_ID.get(id);
  return agente ? [{ id, nombre: nombreDePersona(agente.name) }] : [];
});

/**
 * Qué se puede vigilar en cada categoría, en la demo. Los agentes son los de arriba y los grupos, nombres de las
 * semillas de Grupos de esta misma app; el resto son inventados. Ningún dato sale de la extracción del Supervisor real
 * (allí había teléfonos en los nombres de los servicios).
 *
 * Cada nombre es el del juego de datos activo (DD-124): con `?datos=tortura`, estirado como en los
 * almacenes; con `?datos=editorial`, el grupo con su nombre de negocio.
 */
export const DEMO_ENTITIES: Readonly<Record<WidgetCategory, readonly string[]>> = {
  services: ['Atención al cliente', 'Soporte técnico', 'Ventas', 'Citas', 'Facturación', 'Bajas y retención'].map((s) => nombreDeCosa(s)),
  groups: ['ACD Demo C2CB', 'ACD outbound', 'Campaigns', 'Exclusivo', 'Online Support', 'Reclamaciones'].map((g) => nombreDeGrupo(g)),
  agents: DEMO_AGENTS.map(({ nombre }) => nombre),
  ai: [
    'Pedir cita',
    'Estado del pedido',
    'Hablar con un agente',
    'Consultar factura',
    'Cambiar datos de contacto',
    'Baja del servicio',
    'Incidencia técnica',
  ].map((i) => nombreDeCosa(i)),
  typifications: ['Venta cerrada', 'Consulta de factura', 'Incidencia técnica', 'Reclamación', 'Cita confirmada', 'Baja'].map((t) =>
    nombreDeCosa(t),
  ),
  campaigns: ['Renovación 2026', 'Captación fibra', 'Encuesta de satisfacción', 'Recobro'].map((c) => nombreDeCosa(c)),
};
