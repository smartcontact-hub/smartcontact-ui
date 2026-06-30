import type { Rule } from './rule.types';

/**
 * Mock representativo de reglas Memory · iter 9a.
 *
 * 6 entries cubriendo estados visuales:
 *   - 3 reglas activas con prioridad ordenada (1/2/3).
 *   - 1 inactiva.
 *   - 1 borrador sin editar (Copia de regla #1, isDraft=true).
 *   - 1 con conflict (mismo alcance y acción contradictoria con otra).
 *
 * Alcances variados para que el resumen "Servicio X, 2 grupos, 12 agentes"
 * tenga texto representativo. Tipos repartidos entre recording /
 * transcription / classification.
 */
export const MOCK_RULES: readonly Rule[] = [
  {
    id: 1,
    type: 'recording',
    name: 'Grabar Soporte Técnico',
    description: 'Graba todas las llamadas entrantes del servicio de soporte.',
    servicios: ['Soporte Técnico'],
    grupos: ['Soporte Nivel 1', 'Soporte Nivel 2'],
    agentes: [],
    recording: true,
    transcripcion: false,
    clasificacion: false,
    active: true,
    priority: 1,
    lastModified: '2026-05-17T10:30:00Z',
  },
  {
    id: 2,
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
          id: 'g-r2',
          match: 'all',
          conditions: [
            {
              id: 'c-r2-1',
              field: 'servicio',
              operator: 'is',
              value: { mode: 'refs', refs: [{ kind: 'service', name: 'Ventas Comercial' }] },
            },
            {
              id: 'c-r2-2',
              field: 'duracion',
              operator: 'gt',
              value: { mode: 'number', amount: 60, unit: 'seconds' },
            },
          ],
        },
      ],
    },
    recording: true,
    transcripcion: true,
    clasificacion: false,
    active: true,
    priority: 2,
    lastModified: '2026-05-16T15:45:00Z',
  },
  {
    id: 3,
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
          id: 'g-r3',
          match: 'all',
          conditions: [
            {
              id: 'c-r3-1',
              field: 'servicio',
              operator: 'is',
              value: { mode: 'refs', refs: [{ kind: 'service', name: 'Postventa' }] },
            },
            {
              id: 'c-r3-2',
              field: 'agente',
              operator: 'is',
              value: { mode: 'refs', refs: [{ kind: 'agentGroup', id: 5 }] },
            },
          ],
        },
      ],
    },
    recording: true,
    transcripcion: true,
    clasificacion: true,
    active: true,
    priority: 3,
    aiAnalysis: true,
    categorias: ['cat_queja_facturacion', 'cat_retencion'],
    lastModified: '2026-05-18T09:12:00Z',
  },
  {
    id: 4,
    type: 'recording',
    name: 'Grabar Demo C2CB (pausada)',
    description: 'Regla pausada — campaña terminó.',
    servicios: ['DV: Smart Contact'],
    grupos: ['ACD Demo C2CB'],
    agentes: [],
    recording: true,
    transcripcion: false,
    clasificacion: false,
    active: false,
    lastModified: '2026-04-29T14:00:00Z',
  },
  {
    id: 5,
    type: 'recording',
    name: 'Copia de Grabar Soporte Técnico',
    description: 'Graba todas las llamadas entrantes del servicio de soporte.',
    servicios: ['Soporte Técnico'],
    grupos: ['Soporte Nivel 1', 'Soporte Nivel 2'],
    agentes: [],
    recording: true,
    transcripcion: false,
    clasificacion: false,
    active: false,
    isDraft: true,
    duplicatedFromId: 1,
    lastModified: '2026-05-18T11:00:00Z',
  },
  {
    id: 6,
    type: 'transcription',
    name: 'Transcribir Atención al Cliente',
    description: 'Transcribe todo el flujo de Atención al Cliente.',
    servicios: ['Atención al Cliente'],
    grupos: ['Soporte Nivel 1'],
    agentes: [],
    recording: false,
    transcripcion: true,
    clasificacion: false,
    active: true,
    priority: 4,
    lastModified: '2026-05-15T08:20:00Z',
  },
  {
    /* Regla intencionalmente en conflicto con #1 (Grabar Soporte Técnico):
     * mismo type=recording + alcance solapado (servicio "Soporte Técnico"
     * + grupo "Soporte Nivel 1"). Sirve para validar el badge "En
     * conflicto" + popover (iter 9d-2). */
    id: 7,
    type: 'recording',
    name: 'Grabar solo Soporte Nivel 1 (entrante)',
    description: 'Regla más específica — conflictúa con la de Soporte Técnico al solapar alcance.',
    servicios: ['Soporte Técnico'],
    grupos: ['Soporte Nivel 1'],
    agentes: [],
    recording: true,
    transcripcion: false,
    clasificacion: false,
    active: true,
    priority: 5,
    lastModified: '2026-05-15T11:00:00Z',
  },
];
