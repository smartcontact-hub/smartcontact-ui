/**
 * Cross-feature roster of group references. Lives here (shared/) instead of
 * inside the Agents feature because Users (sidebar id→name resolution) and
 * Agents (group multiselect) both need the same list. El tipo `GroupRef`
 * vive en SCDS (consume por `<sc-group-popover>`); aquí solo re-exportamos
 * y proveemos el dataset concreto que usa AED.
 */
// `GroupRef` lo DEFINE el paquete publicado pero NO lo exporta en su public-api;
// el tipo local (mismo shape) es estructuralmente compatible con el input
// `groups` de `sc-group-popover` publicado (lo valida strictTemplates).
import { type GroupRef } from '@shared/components';

export type { GroupRef };

export const AVAILABLE_GROUPS_REF: readonly GroupRef[] = [
  { id: 1, name: 'ACD Demo C2CB', active: true },
  { id: 2, name: 'ACD demo cuscare', active: true },
  { id: 3, name: 'ACD outbound', active: true },
  { id: 4, name: 'Campaigns', active: true },
  { id: 5, name: 'Exclusivo', active: true },
  { id: 6, name: 'Grupo de prueba 1', active: true },
  { id: 7, name: 'Grupo de prueba 2', active: true },
  { id: 8, name: 'Grupo demo', active: true },
  { id: 9, name: 'Grupo pedidos', active: true },
  { id: 10, name: 'Nodo AED 1', active: true },
  { id: 11, name: 'Online Support', active: true },
  { id: 12, name: 'Reclamaciones', active: true },
  { id: 13, name: 'Soporte Taller', active: true },
  { id: 14, name: 'Telemarketing', active: true },
];
