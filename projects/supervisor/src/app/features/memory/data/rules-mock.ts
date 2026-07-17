import type { Rule } from './rule.types';

/**
 * Mock de reglas Memory · MVP transcripción.
 *
 * MVP sin priorización ni grabación (obsoleta por ley) → solo reglas de
 * transcripción / clasificación. Sin borradores. **Pueden estar varias activas a
 * la vez** (el solape se resuelve por unión, ver DD-30); el seed arranca con la #1
 * activa y el resto inactivas. La #4 es un ejemplo compuesto (grupo + tipificación
 * + duración): se edita para ver el árbol de condiciones completo.
 */
export const MOCK_RULES: readonly Rule[] = [
  {
    id: 1,
    type: 'transcription',
    name: 'Transcribir Ventas Comercial >60s',
    description: 'Solo conversaciones de ventas con duración relevante.',
    servicios: ['Ventas Comercial'],
    grupos: [],
    agentes: [],
    conditionTree: {
      match: 'all',
      groups: [
        {
          id: 'g-r1',
          match: 'all',
          conditions: [
            {
              id: 'c-r1-1',
              field: 'servicio',
              operator: 'is',
              value: { mode: 'refs', refs: [{ kind: 'service', name: 'Ventas Comercial' }] },
            },
            {
              id: 'c-r1-2',
              field: 'duracion',
              operator: 'gt',
              value: { mode: 'number', amount: 60, unit: 'seconds' },
            },
          ],
        },
      ],
    },
    recording: false,
    transcripcion: true,
    clasificacion: false,
    active: true,
    lastModified: '2026-05-16T15:45:00Z',
  },
  {
    id: 2,
    type: 'classification',
    name: 'Clasificar VIP con IA',
    description: 'Análisis completo (resumen + sentimiento + categorías) para clientes VIP.',
    servicios: ['Postventa'],
    grupos: [],
    agentes: [],
    conditionTree: {
      match: 'all',
      groups: [
        {
          id: 'g-r2',
          match: 'all',
          conditions: [
            {
              id: 'c-r2-1',
              field: 'servicio',
              operator: 'is',
              value: { mode: 'refs', refs: [{ kind: 'service', name: 'Postventa' }] },
            },
            {
              id: 'c-r2-2',
              field: 'agente',
              operator: 'is',
              value: { mode: 'refs', refs: [{ kind: 'agentGroup', id: 5 }] },
            },
          ],
        },
      ],
    },
    recording: false,
    transcripcion: true,
    clasificacion: true,
    active: false,
    aiAnalysis: true,
    categorias: ['cat_queja_facturacion', 'cat_retencion'],
    lastModified: '2026-05-18T09:12:00Z',
  },
  {
    id: 3,
    type: 'transcription',
    name: 'Transcribir Atención al Cliente',
    description: 'Transcribe todo el flujo de Atención al Cliente.',
    servicios: ['Atención al Cliente'],
    grupos: ['Soporte Nivel 1'],
    agentes: [],
    recording: false,
    transcripcion: true,
    clasificacion: false,
    active: false,
    lastModified: '2026-05-15T08:20:00Z',
  },
  {
    /* Ejemplo compuesto: servicio Ventas Comercial Y grupo Ventas Y
     * (tipificación venta O incidencia) Y duración entre 1 y 30 min. */
    id: 4,
    type: 'transcription',
    name: 'Transcribir Ventas: venta o incidencia (1–30 min)',
    description: 'Servicio Ventas Comercial, grupo Ventas, tipificación venta o incidencia, y duración entre 1 y 30 minutos.',
    servicios: ['Ventas Comercial'],
    grupos: ['Ventas'],
    agentes: [],
    conditionTree: {
      match: 'all',
      groups: [
        {
          id: 'g-r4',
          match: 'all',
          conditions: [
            {
              id: 'c-r4-1',
              field: 'servicio',
              operator: 'is',
              value: { mode: 'refs', refs: [{ kind: 'service', name: 'Ventas Comercial' }] },
            },
            {
              id: 'c-r4-2',
              field: 'grupo',
              operator: 'is',
              value: { mode: 'refs', refs: [{ kind: 'group', id: 6 }] },
            },
            {
              id: 'c-r4-3',
              field: 'tipificacion',
              operator: 'is',
              value: {
                mode: 'refs',
                refs: [
                  { kind: 'tipificacion', id: 3 },
                  { kind: 'tipificacion', id: 8 },
                ],
              },
            },
            {
              id: 'c-r4-4',
              field: 'duracion',
              operator: 'between',
              value: { mode: 'number', amount: 1, amount2: 30, unit: 'minutes' },
            },
          ],
        },
      ],
    },
    recording: false,
    transcripcion: true,
    clasificacion: false,
    active: false,
    lastModified: '2026-05-18T12:00:00Z',
  },
];
