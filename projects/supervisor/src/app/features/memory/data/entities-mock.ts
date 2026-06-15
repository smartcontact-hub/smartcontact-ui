import type { Entity } from './entity.types';

/**
 * Mock representativo de entidades Memory.
 *
 * 11 system entities (heredadas del prototipo React `EntitiesContext.tsx`,
 * inmutables) + 4 user entities (custom, editables) cubriendo los tipos
 * más representativos: list con synonyms, currency, key_phrase, name.
 */
const NOW = '2026-05-18T16:00:00Z';

export const MOCK_SYSTEM_ENTITIES: readonly Entity[] = [
  // Call Metadata Variables
  {
    id: 'sys_ani',
    name: 'call_origin',
    description: 'Número origen (ANI / Caller ID)',
    type: 'phone_number',
    isSystem: true,
    createdAt: NOW,
    updatedAt: NOW,
    format: 'E.164',
  },
  {
    id: 'sys_dnis',
    name: 'call_dnis',
    description: 'Número marcado (DNIS)',
    type: 'phone_number',
    isSystem: true,
    createdAt: NOW,
    updatedAt: NOW,
    format: 'E.164',
  },
  {
    id: 'sys_timestamp',
    name: 'call_timestamp',
    description: 'Fecha y hora de la llamada',
    type: 'datetime',
    isSystem: true,
    createdAt: NOW,
    updatedAt: NOW,
    format: 'ISO 8601',
  },
  {
    id: 'sys_session_id',
    name: 'call_session_id',
    description: 'ID de llamada / sesión',
    type: 'text',
    isSystem: true,
    createdAt: NOW,
    updatedAt: NOW,
    format: 'UUID',
  },
  {
    id: 'sys_country',
    name: 'call_country',
    description: 'País / prefijo',
    type: 'geography',
    isSystem: true,
    createdAt: NOW,
    updatedAt: NOW,
    format: 'ISO 3166',
  },
  {
    id: 'sys_carrier',
    name: 'call_carrier',
    description: 'Carrier / Operador',
    type: 'text',
    isSystem: true,
    createdAt: NOW,
    updatedAt: NOW,
  },

  // Standard Extraction Entities
  {
    id: 'sys_date',
    name: 'sys_date',
    description: 'Fechas mencionadas',
    type: 'date',
    isSystem: true,
    createdAt: NOW,
    updatedAt: NOW,
    format: 'YYYY-MM-DD',
  },
  {
    id: 'sys_time',
    name: 'sys_time',
    description: 'Horas mencionadas',
    type: 'datetime',
    isSystem: true,
    createdAt: NOW,
    updatedAt: NOW,
    format: 'HH:mm',
  },
  {
    id: 'sys_number',
    name: 'sys_number',
    description: 'Cualquier valor numérico genérico',
    type: 'number',
    isSystem: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'sys_currency',
    name: 'sys_currency',
    description: 'Importes monetarios',
    type: 'currency',
    isSystem: true,
    createdAt: NOW,
    updatedAt: NOW,
    format: '0.00 EUR',
  },
  {
    id: 'sys_dni',
    name: 'sys_dni',
    description: 'DNI/NIF detectado',
    type: 'key_phrase',
    isSystem: true,
    createdAt: NOW,
    updatedAt: NOW,
    format: '8 dígitos + letra',
  },
];

export const MOCK_USER_ENTITIES: readonly Entity[] = [
  {
    id: 'usr_producto',
    name: 'producto',
    description: 'Nombre de producto comercializado por la empresa.',
    type: 'list',
    isSystem: false,
    createdAt: '2026-04-12T10:00:00Z',
    updatedAt: '2026-05-10T14:30:00Z',
    config: {
      listValues: [
        { value: 'Smart Contact Pro', synonyms: ['SC Pro', 'plan profesional'] },
        { value: 'Smart Contact Enterprise', synonyms: ['SC Enterprise', 'plan empresa'] },
        { value: 'Smart Contact Starter', synonyms: ['SC Starter', 'plan inicial'] },
      ],
    },
  },
  {
    id: 'usr_motivo_baja',
    name: 'motivo_baja',
    description: 'Razón que da el cliente al solicitar baja del servicio.',
    type: 'key_phrase',
    isSystem: false,
    createdAt: '2026-04-20T09:15:00Z',
    updatedAt: '2026-04-20T09:15:00Z',
  },
  {
    id: 'usr_importe_compensacion',
    name: 'importe_compensacion',
    description: 'Cantidad ofrecida como compensación por incidencia.',
    type: 'currency',
    isSystem: false,
    createdAt: '2026-05-02T11:45:00Z',
    updatedAt: '2026-05-15T08:00:00Z',
    format: '0.00 EUR',
  },
  {
    id: 'usr_nombre_agente_ext',
    name: 'agente_externo',
    description: 'Nombre de agente externo mencionado en la llamada (proveedor, otra compañía).',
    type: 'name',
    isSystem: false,
    createdAt: '2026-05-08T16:20:00Z',
    updatedAt: '2026-05-08T16:20:00Z',
  },
];

export const MOCK_ENTITIES: readonly Entity[] = [...MOCK_SYSTEM_ENTITIES, ...MOCK_USER_ENTITIES];
