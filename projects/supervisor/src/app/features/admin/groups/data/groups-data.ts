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

/* Las de SISMAC-1975 en COA (Rafa, 2026-09-16: «estrategias hay que seguir al COA»): quita Aleatoria y Lineal, y
 * añade Niveles, Ring All y Skills. «Agente exclusivo» se queda: el COA no la quita, y el manual de Voice (p. 12) y
 * el Figma de la migración la traen.
 * Skills sale APAGADA con su motivo a la vista, como pide el COA para las que necesitan configuración posterior: aquí
 * Niveles y Ring All ya se configuran en la ficha, pero las skills de cada agente todavía no existen. */
export const PHONE_STRATEGIES: readonly string[] = [
  'Balanceada',
  'Menos llamadas atendidas',
  'Más tiempo inactivo',
  'Niveles',
  'Ring All',
  'Skills',
  'Agente exclusivo',
];

/** Las que aún no se pueden elegir (ver arriba). */
export const UNAVAILABLE_STRATEGIES: ReadonlySet<string> = new Set(['Skills']);

/** Las que sirven de valor por defecto en Configuración del AED: las que no piden nada más en cada grupo. Niveles,
 *  Ring All, Skills y Agente exclusivo necesitan niveles, un número de agentes, skills o el IVR (SISMAC-1975). */
export const DEFAULT_STRATEGY_OPTIONS: readonly string[] = ['Balanceada', 'Menos llamadas atendidas', 'Más tiempo inactivo'];

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

/** Un anuncio periódico: su .wav y cada cuánto suena. Postventa, 2026-09-18: «posibilidad de meter más de uno». */
export interface PeriodicAnnouncement {
  readonly file: string;
  readonly everySec: number;
}

export interface GroupAnnouncements {
  /** Nombre del .wav; null = la música por defecto. La misma música sirve para espera y transferencia
   *  (postventa, 2026-09-18: «debería de ser la misma»), así que es un solo campo. */
  readonly holdMusicFile: string | null;
  readonly queueIdSource: AudioSource;
  readonly queueIdFile: string | null;
  /** Lo que lee la voz cuando la fuente es «Texto a voz». */
  readonly queueIdText: string;
  readonly nextInLineSource: AudioSource;
  readonly nextInLineFile: string | null;
  readonly nextInLineText: string;
  readonly voice: string;
  readonly periodicAnnouncements: readonly PeriodicAnnouncement[];
  /** «Audio saliente» del Figma de la migración. No está en el manual: qué suena y cuándo, por confirmar con desarrollo. */
  readonly outboundAudioFile: string | null;
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
  /** «Desbordar sesión» del Figma de la migración («Redirige sesiones activas al superar el límite de…»). No está en el
   *  manual: a qué canal aplica y adónde van, por confirmar con desarrollo. */
  readonly overflowSession: boolean;
  readonly cardOpening: CardOpening;
  readonly cardUrl: string;
  readonly cardHeight: number;
  /**
   * Número al que llegan los mensajes de WhatsApp de este grupo.
   *
   * **Por confirmar con desarrollo, y es una decisión de modelo, no de pantalla.** Aquí conviven
   * dos respuestas distintas a la misma pregunta:
   *
   *   · `GroupChannel` incluye `whatsapp`, así que un grupo puede ofrecer WhatsApp **sin** Chat, y
   *     entonces la rejilla de agentes le pinta su propia columna: se puede dar WhatsApp a un
   *     agente y negarle el chat web.
   *   · Este campo, en cambio, solo se pinta dentro de `@if (hasChat())`. Un grupo con WhatsApp y
   *     sin Chat se queda **sin sitio donde poner el número** (medido el 2026-09-21).
   *
   * En el AED en vivo manda la segunda: el nodo configura `type_chatweb` y `type_whatsapp` por
   * separado, pero el permiso del agente solo tiene Tlf / Chat / Email, así que quien atiende Chat
   * atiende los dos. Lo que hay que preguntar:
   *
   *   1. ¿El backend nuevo va a tener un permiso de WhatsApp propio por (agente, grupo), o WhatsApp
   *      es un ajuste dentro de Chat como en Voice?
   *   2. Si es lo segundo, la capacidad y la estrategia de chat, ¿cuentan también las de WhatsApp?
   *
   * Con la respuesta, o sobra la columna de la rejilla, o sobra el `hasChat()` de este campo.
   */
  readonly whatsappNumber: string;
  /** Al cerrar la conversación de chat, pedir al cliente que valore la atención. */
  readonly chatRatingEnabled: boolean;
  /** Webs donde se puede insertar el script del widget de chat (`chatScript`). Vacío = cualquiera. */
  readonly allowedDomains: readonly string[];
}

/** Los valores de fábrica. Un grupo nuevo nace con lo guardado en Configuración del AED > Grupos (`GroupDefaultsStore`),
 *  que arranca con estos. */
export const DEFAULT_ANNOUNCEMENTS: GroupAnnouncements = {
  holdMusicFile: null,
  queueIdSource: 'none',
  queueIdFile: null,
  queueIdText: '',
  nextInLineSource: 'none',
  nextInLineFile: null,
  nextInLineText: '',
  voice: 'Femenina · español',
  periodicAnnouncements: [],
  outboundAudioFile: null,
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
  overflowSession: false,
  cardOpening: 'embedded',
  cardUrl: '',
  cardHeight: 400,
  whatsappNumber: '',
  chatRatingEnabled: false,
  allowedDomains: [],
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
  /** Foto del grupo (data URL), como la del agente. Sale en el Figma de la migración. */
  readonly photo?: string;
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

/** Lo que Configuración del AED > Grupos fija para los grupos nuevos. Mismos campos y mismas palabras que la ficha de
 *  grupo: antes esa página tenía sus propias listas (códecs como «voz», FIFO/LIFO, «Urgente») que no casaban con nada. */
export interface GroupDefaults {
  readonly strategy: string;
  readonly priority: GroupPriority;
  readonly voice: string;
  readonly advanced: GroupAdvanced;
}

export const FACTORY_GROUP_DEFAULTS: GroupDefaults = {
  strategy: 'Balanceada',
  priority: 'Baja',
  voice: DEFAULT_ANNOUNCEMENTS.voice,
  advanced: DEFAULT_ADVANCED,
};
