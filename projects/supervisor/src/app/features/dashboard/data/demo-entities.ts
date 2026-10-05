import { nombreDeCosa, nombreDeGrupo, nombreDePersona } from '@core/services/juego-de-datos';
import { AGENTS_SEED } from '@features/admin/agents/data/agents-data';
import { GROUPS_SEED } from '@features/admin/groups/data/groups-data';

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
 * Los grupos de la demo, igual que los agentes: por su id en Administración › Grupos y con el nombre del juego activo.
 * El orden cuenta: «Colas y agentes» vigila los cuatro primeros (`dashboard-demo.ts`). Los widgets guardan solo el
 * nombre, y los monitores guardados no se pueden migrar (DD-139 §5): el nombre lleva a su id con esta tabla, y el id
 * al grupo de hoy, así que el panel rápido encuentra también un grupo renombrado (DD-168).
 */
const IDS_DE_GRUPOS_DE_LA_DEMO: readonly number[] = [1, 3, 4, 5, 11, 12];

const GRUPO_POR_ID = new Map(GROUPS_SEED.map((grupo) => [grupo.id, grupo]));

export const DEMO_GROUPS: readonly { readonly id: number; readonly nombre: string }[] = IDS_DE_GRUPOS_DE_LA_DEMO.flatMap(
  (id) => {
    const grupo = GRUPO_POR_ID.get(id);
    return grupo ? [{ id, nombre: nombreDeGrupo(grupo.name) }] : [];
  },
);

const ID_DE_GRUPO_POR_NOMBRE = new Map(DEMO_GROUPS.map(({ id, nombre }) => [nombre, id]));

/** El id en Administración de un grupo que el Monitor nombra; `undefined` si no es un grupo de la demo. */
export const idDeGrupoDeLaDemo = (nombre: string): number | undefined => ID_DE_GRUPO_POR_NOMBRE.get(nombre);

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
  groups: DEMO_GROUPS.map(({ nombre }) => nombre),
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
