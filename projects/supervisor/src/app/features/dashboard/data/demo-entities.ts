import { nombreDeCosa, nombreDeGrupo, nombreDePersona } from '@core/services/juego-de-datos';

import type { AgentPresence } from './dashboard.types';
import type { WidgetCategory } from './widget-catalog';

/**
 * Los agentes de la demo y en qué estado está cada uno. Una sola fuente para la tabla de agentes, los anillos y el
 * detalle que abren, que así cuentan lo mismo: 5 disponibles, 4 en pausa y 1 desconectado, «5 de 9 conectados».
 * Antes cada pieza iba por su lado (medido el 2026-09-27, DD-126): la tabla de «Monitor x» enseñaba 8 de los 10
 * agentes que nombraba su cabecera, y el detalle del anillo daba por disponibles a Denzel, en pausa, y a Leonardo,
 * desconectado.
 */
const AGENTES: ReadonlyArray<readonly [string, AgentPresence]> = [
  ['Tom Hanks', 'available'],
  ['Meryl Streep', 'available'],
  ['Denzel Washington', 'paused'],
  ['Julia Roberts', 'available'],
  ['Leonardo DiCaprio', 'offline'],
  ['Scarlett Johansson', 'available'],
  ['Morgan Freeman', 'paused'],
  ['Natalie Portman', 'available'],
  ['Keanu Reeves', 'paused'],
  ['Viola Davis', 'paused'],
];

/**
 * Qué se puede vigilar en cada categoría, en la demo. Los nombres de agentes y grupos son los de
 * las semillas de Agentes y Grupos de esta misma app; el resto son inventados. Ningún dato sale de
 * la extracción del Supervisor real (allí había teléfonos en los nombres de los servicios).
 *
 * Cada nombre es el del juego de datos activo (DD-124): con `?datos=tortura`, estirado como en los
 * almacenes; con `?datos=editorial`, el grupo con su nombre de negocio.
 */
export const DEMO_ENTITIES: Readonly<Record<WidgetCategory, readonly string[]>> = {
  services: ['Atención al cliente', 'Soporte técnico', 'Ventas', 'Citas', 'Facturación', 'Bajas y retención'].map((s) => nombreDeCosa(s)),
  groups: ['ACD Demo C2CB', 'ACD outbound', 'Campaigns', 'Exclusivo', 'Online Support', 'Reclamaciones'].map((g) => nombreDeGrupo(g)),
  agents: AGENTES.map(([nombre]) => nombreDePersona(nombre)),
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

/** El estado de cada agente, por el nombre con que se enseña (el del juego activo). */
export const DEMO_AGENT_PRESENCE: Readonly<Record<string, AgentPresence>> = Object.fromEntries(
  AGENTES.map(([nombre, estado]) => [nombreDePersona(nombre), estado]),
);
