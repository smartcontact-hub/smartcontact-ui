import type { WidgetCategory } from './widget-catalog';

/**
 * Qué se puede vigilar en cada categoría, en la demo. Los nombres de agentes y grupos son los de
 * las semillas de Agentes y Grupos de esta misma app; el resto son inventados. Ningún dato sale de
 * la extracción del Supervisor real (allí había teléfonos en los nombres de los servicios).
 */
export const DEMO_ENTITIES: Readonly<Record<WidgetCategory, readonly string[]>> = {
  services: ['Atención al cliente', 'Soporte técnico', 'Ventas', 'Citas', 'Facturación', 'Bajas y retención'],
  groups: ['ACD Demo C2CB', 'ACD outbound', 'Campaigns', 'Exclusivo', 'Online Support', 'Reclamaciones'],
  agents: [
    'Tom Hanks',
    'Meryl Streep',
    'Denzel Washington',
    'Julia Roberts',
    'Leonardo DiCaprio',
    'Scarlett Johansson',
    'Morgan Freeman',
    'Natalie Portman',
    'Keanu Reeves',
    'Viola Davis',
  ],
  ai: [
    'Pedir cita',
    'Estado del pedido',
    'Hablar con un agente',
    'Consultar factura',
    'Cambiar datos de contacto',
    'Baja del servicio',
    'Incidencia técnica',
  ],
  typifications: ['Venta cerrada', 'Consulta de factura', 'Incidencia técnica', 'Reclamación', 'Cita confirmada', 'Baja'],
  campaigns: ['Renovación 2026', 'Captación fibra', 'Encuesta de satisfacción', 'Recobro'],
};
