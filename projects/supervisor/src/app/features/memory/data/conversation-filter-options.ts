/**
 * Catálogos de opciones para los pickers de `ConversationFiltersComponent`.
 *
 * Subset migrado desde el prototipo React (`mockServices`, `mockGroups`,
 * `mockAgents` en `legacy-react/src/app/data/mockData.ts`). Los valores
 * de las conversaciones mock referencian estos labels.
 */

import { nombreDeCosa, nombreDeGrupo, nombreDePersona } from '@core/services/juego-de-datos';

export interface FilterOption {
  readonly value: string;
  readonly label: string;
}

/** Con `?datos=tortura`, el servicio estirado, el mismo que llevan las conversaciones que filtra (DD-124). */
export const SERVICE_OPTIONS: readonly FilterOption[] = [
  { value: 'DV: Smart Contact', label: 'DV: Smart Contact' },
  { value: 'Soporte Técnico', label: 'Soporte Técnico' },
  { value: 'Ventas Comercial', label: 'Ventas Comercial' },
  { value: 'Atención al Cliente', label: 'Atención al Cliente' },
  { value: 'Postventa', label: 'Postventa' },
].map((o) => ({ value: nombreDeCosa(o.value), label: nombreDeCosa(o.label) }));

/** Con `?datos=editorial`, los grupos que también viven en Administración toman su nombre de negocio, y con
 *  `?datos=tortura`, el estirado: en el valor y en la etiqueta, igual que las conversaciones que filtran (DD-124). */
export const GROUP_OPTIONS: readonly FilterOption[] = [
  { value: 'ACD Demo C2CB', label: 'ACD Demo C2CB' },
  { value: 'ACD demo cuscare', label: 'ACD demo cuscare' },
  { value: 'ACD outbound', label: 'ACD outbound' },
  { value: 'Campaigns', label: 'Campaigns' },
  { value: 'Clientes vip', label: 'Clientes vip (Queue)' },
  { value: 'COLA_PRUEBA', label: 'COLA_PRUEBA (Queue)' },
  { value: 'Soporte Taller', label: 'Soporte Taller' },
  { value: 'Soporte Nivel 1', label: 'Soporte Nivel 1' },
  { value: 'Soporte Nivel 2', label: 'Soporte Nivel 2' },
].map((o) => ({ value: nombreDeGrupo(o.value), label: o.label.replace(o.value, nombreDeGrupo(o.value)) }));

/** Con `?datos=tortura`, con el apellido compuesto que lleva el origen de las conversaciones (DD-124). */
export const AGENT_OPTIONS: readonly FilterOption[] = [
  { value: 'Oscar Fernández', label: 'Oscar Fernández' },
  { value: 'María García', label: 'María García' },
  { value: 'Carlos López', label: 'Carlos López' },
  { value: 'Ana Martínez', label: 'Ana Martínez' },
  { value: 'Luis Sánchez', label: 'Luis Sánchez' },
  { value: 'Elena Rodríguez', label: 'Elena Rodríguez' },
  { value: 'Javier Gómez', label: 'Javier Gómez' },
  { value: 'Laura Díaz', label: 'Laura Díaz' },
  { value: 'Sergio Ruiz', label: 'Sergio Ruiz' },
].map((o) => ({ value: nombreDePersona(o.value), label: nombreDePersona(o.label) }));

/**
 * Tipificaciones — espejo de los nombres del repositorio de Tipificaciones
 * (`admin/repositories/instances/tipificaciones.ts`). Usado como campo del
 * constructor de condiciones. En backend real saldría de su store.
 */
export const TIPIFICACION_OPTIONS: readonly FilterOption[] = [
  { value: 'Consulta resuelta', label: 'Consulta resuelta' },
  { value: 'Consulta escalada', label: 'Consulta escalada' },
  { value: 'Venta cerrada', label: 'Venta cerrada' },
  { value: 'Venta pendiente', label: 'Venta pendiente' },
  { value: 'Venta rechazada', label: 'Venta rechazada' },
  { value: 'Reclamación abierta', label: 'Reclamación abierta' },
  { value: 'Reclamación resuelta', label: 'Reclamación resuelta' },
];
