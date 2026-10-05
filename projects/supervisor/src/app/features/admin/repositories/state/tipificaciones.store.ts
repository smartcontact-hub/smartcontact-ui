import { createRepoStore } from '@core/services/local-store.factory';

/* El almacén de tipificaciones y su semilla, aparte de su página (DD-165): el hub de Repositorios y las fichas leen el
 * almacén sin cargar la lista entera. */
export interface Tipificacion {
  readonly id: number;
  readonly name: string;
  readonly code: string;
  readonly category: string;
  readonly description: string;
}

const SEED: readonly Tipificacion[] = [
  {
    id: 1,
    name: 'Consulta resuelta',
    code: 'CON-001',
    category: 'Consulta',
    description: 'La consulta del cliente fue resuelta en primer contacto',
  },
  {
    id: 2,
    name: 'Consulta escalada',
    code: 'CON-002',
    category: 'Consulta',
    description: 'La consulta requirió escalación a nivel superior',
  },
  {
    id: 3,
    name: 'Venta cerrada',
    code: 'VEN-001',
    category: 'Ventas',
    description: 'Se concretó una venta exitosamente',
  },
  {
    id: 4,
    name: 'Venta pendiente',
    code: 'VEN-002',
    category: 'Ventas',
    description: 'El cliente mostró interés pero no cerró la venta',
  },
  {
    id: 5,
    name: 'Venta rechazada',
    code: 'VEN-003',
    category: 'Ventas',
    description: 'El cliente rechazó la oferta comercial',
  },
  {
    id: 6,
    name: 'Reclamación abierta',
    code: 'REC-001',
    category: 'Reclamación',
    description: 'Se abrió un caso de reclamación formal',
  },
  {
    id: 7,
    name: 'Reclamación resuelta',
    code: 'REC-002',
    category: 'Reclamación',
    description: 'El caso de reclamación fue resuelto satisfactoriamente',
  },
  {
    id: 8,
    name: 'Incidencia técnica',
    code: 'INC-001',
    category: 'Soporte',
    description: 'Se reportó un problema técnico con el producto o servicio',
  },
  {
    id: 9,
    name: 'Incidencia resuelta',
    code: 'INC-002',
    category: 'Soporte',
    description: 'La incidencia técnica fue resuelta',
  },
  {
    id: 10,
    name: 'Llamada abandonada',
    code: 'ABN-001',
    category: 'Otros',
    description: 'El cliente colgó antes de ser atendido',
  },
  {
    id: 11,
    name: 'Llamada perdida',
    code: 'ABN-002',
    category: 'Otros',
    description: 'No se pudo contactar al cliente en callback',
  },
  {
    id: 12,
    name: 'Información proporcionada',
    code: 'INF-001',
    category: 'Consulta',
    description: 'Se proporcionó información sin necesidad de gestión adicional',
  },
];

export const TipificacionesStore = createRepoStore<Tipificacion>('TipificacionesStore', {
  storageKey: 'sc-tipificaciones-repo',
  versionKey: 'sc-tipificaciones-repo-v',
  currentVersion: 1,
  defaults: SEED,
});
