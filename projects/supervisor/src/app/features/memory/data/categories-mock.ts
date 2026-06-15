import type { Category } from './category.types';

/**
 * Mock representativo de categorías IA Memory.
 *
 * 6 categorías cubriendo dominios típicos de contact center
 * (soporte técnico, ventas, queja, retención, postventa, baja).
 *
 * `classifiedCalls` stats fake. `usedInRules` se deriva en runtime desde
 * `RulesStore.rulesByCategoryId` (S49 §10 #13 bidireccional) — no se
 * persiste en el mock para evitar desincronización con `Rule.categorias`.
 */
export const MOCK_CATEGORIES: readonly Category[] = [
  {
    id: 'cat_queja_facturacion',
    name: 'Queja de facturación',
    description: 'El cliente cuestiona un cargo o cobro en su factura.',
    group: 'Atención al Cliente',
    isActive: true,
    classifiedCalls: 47,
    createdAt: '2026-03-15T10:00:00Z',
  },
  {
    id: 'cat_soporte_tecnico',
    name: 'Soporte técnico',
    description: 'Incidencias o consultas sobre el funcionamiento del producto.',
    group: 'Soporte',
    isActive: true,
    classifiedCalls: 124,
    createdAt: '2026-03-20T14:30:00Z',
  },
  {
    id: 'cat_consulta_precio',
    name: 'Consulta de precio',
    description: 'Pregunta sobre tarifas, planes o promociones disponibles.',
    group: 'Ventas',
    isActive: true,
    classifiedCalls: 89,
    createdAt: '2026-04-02T09:15:00Z',
  },
  {
    id: 'cat_retencion',
    name: 'Retención',
    description: 'El cliente expresa intención de baja o cambio de proveedor.',
    group: 'Postventa',
    isActive: true,
    classifiedCalls: 23,
    createdAt: '2026-04-12T11:45:00Z',
  },
  {
    id: 'cat_elogio',
    name: 'Elogio',
    description: 'El cliente expresa satisfacción con el servicio recibido.',
    isActive: true,
    classifiedCalls: 12,
    createdAt: '2026-04-28T16:20:00Z',
  },
  {
    id: 'cat_baja_solicitud',
    name: 'Solicitud de baja',
    description: 'El cliente solicita explícitamente dar de baja un servicio o producto.',
    group: 'Postventa',
    isActive: false,
    classifiedCalls: 0,
    createdAt: '2026-05-10T13:00:00Z',
  },
];
