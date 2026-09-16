export type GroupPriority = 'Baja' | 'Media' | 'Alta' | 'Máxima';
export type GroupChannel = 'phone' | 'chat' | 'whatsapp' | 'email';

export const GROUP_PRIORITIES: readonly GroupPriority[] = ['Baja', 'Media', 'Alta', 'Máxima'];
export const GROUP_CHANNELS: readonly GroupChannel[] = ['phone', 'chat', 'whatsapp', 'email'];

export const PRIORITY_LABEL_KEYS: Readonly<Record<GroupPriority, string>> = {
  Baja: 'groups.priority.low',
  Media: 'groups.priority.medium',
  Alta: 'groups.priority.high',
  Máxima: 'groups.priority.max',
};

export const CHANNEL_LABEL_KEYS: Readonly<Record<GroupChannel, string>> = {
  phone: 'groups.channel.phone',
  chat: 'groups.channel.chat',
  whatsapp: 'groups.channel.whatsapp',
  email: 'groups.channel.email',
};

/* Las siete del manual de Voice (aed_mu_mb.pdf, p. 10-12), con «Menos reciente» llamada «Más tiempo inactivo»
 * como en SISMAC-1975. Aleatoria sigue porque el manual la trae; SISMAC-1975 (2023, en revisión) proponía quitarla
 * junto a Lineal y añadir Skills: pendiente de decidir. */
export const PHONE_STRATEGIES: readonly string[] = [
  'Balanceada',
  'Menos llamadas atendidas',
  'Más tiempo inactivo',
  'Aleatoria',
  'Ring All',
  'Niveles',
  'Agente exclusivo',
];

/** Desempata entre agentes del mismo nivel. No puede ser Niveles (manual de Voice, p. 12). */
export const SUB_STRATEGIES: readonly string[] = ['Balanceada', 'Más tiempo inactivo', 'Menos llamadas atendidas'];

/** Ring All suena a la vez en 2 a 10 agentes; por defecto 2 (SISMAC-1975). */
export const RING_ALL_OPTIONS: readonly number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Niveles de reparto por agente: hasta 5, como el prototipo. */
export const LEVEL_OPTIONS: readonly number[] = [1, 2, 3, 4, 5];

/* ── Anuncios y avanzado: los campos del grupo en el manual de Voice (p. 10 y 13-14) ── */

/** Tamaño de cola: un máximo fijo, o tantas conversaciones por agente conectado. */
export type QueueSizeType = 'fixed' | 'per_agent';
/** De dónde sale una locución: ninguna, texto a voz o un archivo .wav. */
export type AudioSource = 'none' | 'tts' | 'file';
export type CardOpening = 'new_window' | 'embedded';

export const VOICE_OPTIONS: readonly string[] = ['Femenina · español', 'Masculina · español', 'Femenina · inglés', 'Masculina · inglés'];

export interface GroupAnnouncements {
  /** Nombre del .wav; null = la música por defecto. */
  readonly holdMusicFile: string | null;
  readonly queueIdSource: AudioSource;
  readonly queueIdFile: string | null;
  /** Lo que lee la voz cuando la fuente es «Texto a voz». */
  readonly queueIdText: string;
  readonly nextInLineSource: AudioSource;
  readonly nextInLineFile: string | null;
  readonly nextInLineText: string;
  readonly voice: string;
  readonly periodicFile: string | null;
  readonly periodicEverySec: number;
  readonly announceAvgWait: boolean;
  readonly avgWaitSec: number;
  readonly announcePosition: boolean;
  readonly announceWaitToAgent: boolean;
}

export interface GroupAdvanced {
  readonly queueSizeType: QueueSizeType;
  readonly queueSize: number;
  readonly transferSec: number;
  readonly maxQueueWaitSec: number;
  /** Tiempo administrativo entre llamadas (solo teléfono). */
  readonly wrapUpSec: number;
  /** Tiempo para medir el % de servicio. */
  readonly serviceLevelSec: number;
  /** Desbordar llamadas al siguiente nodo si no hay agentes activos (solo teléfono). */
  readonly overflowWhenNoAgents: boolean;
  readonly cardOpening: CardOpening;
  readonly cardUrl: string;
  readonly cardHeight: number;
}

/** Con lo que nace un grupo: los valores por defecto de Configuración del AED > Grupos. */
export const DEFAULT_ANNOUNCEMENTS: GroupAnnouncements = {
  holdMusicFile: null,
  queueIdSource: 'none',
  queueIdFile: null,
  queueIdText: '',
  nextInLineSource: 'none',
  nextInLineFile: null,
  nextInLineText: '',
  voice: 'Femenina · español',
  periodicFile: null,
  periodicEverySec: 30,
  announceAvgWait: false,
  avgWaitSec: 60,
  announcePosition: false,
  announceWaitToAgent: false,
};

export const DEFAULT_ADVANCED: GroupAdvanced = {
  queueSizeType: 'fixed',
  queueSize: 50,
  transferSec: 30,
  maxQueueWaitSec: 120,
  wrapUpSec: 5,
  serviceLevelSec: 20,
  overflowWhenNoAgents: false,
  cardOpening: 'embedded',
  cardUrl: '',
  cardHeight: 400,
};

export const CHAT_STRATEGIES: readonly string[] = [
  'Rotativa (por turnos)',
  'Menos chats activos',
  'Balanceada',
];

export interface Group {
  readonly id: number;
  readonly code: string;
  readonly name: string;
  readonly phone: string;
  readonly priority: GroupPriority;
  readonly channels: readonly GroupChannel[];
  readonly strategy: string;
  readonly chatStrategy?: string;
  readonly labels?: readonly number[];
  readonly templates?: readonly number[];
  readonly subStrategy?: string;
  readonly ringAllAgents?: number;
  readonly services?: readonly string[];
  /** La tipificación del grupo: una categoría de `Repositorios > Tipificaciones`. Con ella, el agente tiene que
   *  tipificar antes de cerrar (manual de Voice, p. 14). */
  readonly typification?: string;
  readonly announcements?: GroupAnnouncements;
  readonly advanced?: GroupAdvanced;
  readonly schedules?: readonly number[];
  /** Draft flag — set on duplicated entities until the user saves (DD#294 in the React prototype). */
}

export const GROUPS_SEED: readonly Group[] = [
  {
    id: 1,
    code: '20001',
    name: 'ACD Demo C2CB',
    phone: '918371548',
    priority: 'Media',
    channels: ['phone'],
    strategy: 'Balanceada',
    labels: [1, 5],
    templates: [1, 3, 6],
    services: ['Atención general', 'Soporte técnico'],
    schedules: [1, 2],
  },
  {
    id: 2,
    code: '20002',
    name: 'ACD demo cuscare',
    phone: '918371548',
    priority: 'Baja',
    channels: ['phone', 'email'],
    strategy: 'Balanceada',
    services: ['Atención general'],
  },
  {
    id: 3,
    code: '20003',
    name: 'ACD outbound',
    phone: '918371548',
    priority: 'Baja',
    typification: 'Consulta',
    channels: ['phone'],
    strategy: 'Balanceada',
    services: ['Campañas salientes'],
    schedules: [1],
  },
  {
    id: 4,
    code: '20004',
    name: 'Campaigns',
    phone: '917945449',
    priority: 'Baja',
    channels: ['phone'],
    strategy: 'Más tiempo inactivo',
    services: ['Campañas salientes', 'Telemarketing VUI'],
  },
  {
    id: 5,
    code: '20005',
    name: 'Exclusivo',
    phone: '918371548',
    priority: 'Máxima',
    channels: ['phone'],
    strategy: 'Agente exclusivo',
    services: ['VIP Empresas'],
    schedules: [6],
  },
  {
    id: 6,
    code: '20006',
    name: 'Grupo de prueba 1',
    phone: '917945449',
    priority: 'Baja',
    channels: ['phone'],
    strategy: 'Balanceada',
  },
  {
    id: 7,
    code: '20007',
    name: 'Grupo de prueba 2',
    phone: '917945449',
    priority: 'Baja',
    channels: ['phone'],
    strategy: 'Ring All',
    ringAllAgents: 3,
  },
  {
    id: 8,
    code: '20008',
    name: 'Grupo demo',
    phone: '917945449',
    priority: 'Baja',
    typification: 'Consulta',
    channels: ['phone'],
    strategy: 'Balanceada',
    services: ['Demo interno'],
  },
  {
    id: 9,
    code: '20009',
    name: 'Grupo pedidos',
    phone: '917945449',
    priority: 'Baja',
    typification: 'Consulta',
    channels: ['phone'],
    strategy: 'Niveles',
    subStrategy: 'Balanceada',
    services: ['Pedidos online', 'Seguimiento envíos'],
    schedules: [1, 4, 5],
  },
  {
    id: 10,
    code: '20010',
    name: 'Nodo AED 1',
    phone: '917945449',
    priority: 'Baja',
    channels: ['phone', 'chat'],
    strategy: 'Balanceada',
    chatStrategy: 'Rotativa (por turnos)',
    services: ['Atención general', 'Soporte técnico', 'Consultas facturación'],
  },
  {
    id: 11,
    code: '20011',
    name: 'Online Support',
    phone: '918371548',
    priority: 'Máxima',
    channels: ['phone', 'chat', 'whatsapp', 'email'],
    strategy: 'Balanceada',
    chatStrategy: 'Menos chats activos',
    labels: [3, 6],
    templates: [1, 2, 3, 4, 5, 11],
    services: ['Soporte técnico', 'Soporte web'],
    schedules: [1, 2, 3],
  },
  {
    id: 12,
    code: '20012',
    name: 'Reclamaciones',
    phone: '918371548',
    priority: 'Alta',
    typification: 'Consulta',
    channels: ['phone', 'chat', 'whatsapp'],
    strategy: 'Balanceada',
    chatStrategy: 'Rotativa (por turnos)',
    labels: [4, 10],
    templates: [7, 8, 10],
    services: ['Reclamaciones', 'Atención general'],
    schedules: [1, 2],
  },
  {
    id: 13,
    code: '20013',
    name: 'Soporte Taller',
    phone: '917945449',
    priority: 'Máxima',
    channels: ['phone', 'chat', 'whatsapp'],
    strategy: 'Más tiempo inactivo',
    chatStrategy: 'Menos chats activos',
    services: ['Soporte taller', 'Averías'],
  },
  {
    id: 14,
    code: '20014',
    name: 'Telemarketing',
    phone: '918371548',
    priority: 'Baja',
    channels: ['phone'],
    strategy: 'Balanceada',
    services: ['Telemarketing VUI'],
  },
];
