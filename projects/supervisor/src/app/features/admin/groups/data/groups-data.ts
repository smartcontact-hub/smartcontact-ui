export type GroupPriority = 'Baja' | 'Media' | 'Alta' | 'Máxima';
export type GroupChannel = 'phone' | 'chat' | 'whatsapp' | 'email';

export const GROUP_PRIORITIES: readonly GroupPriority[] = ['Baja', 'Media', 'Alta', 'Máxima'];
export const GROUP_CHANNELS: readonly GroupChannel[] = ['phone', 'chat', 'whatsapp', 'email'];

/** Los números asignados a la cuenta con call blending: los únicos que un grupo puede enseñar a sus clientes como
 *  teléfono saliente, que con Teléfono es obligatorio (DD-142). En la demo, los de los grupos de ejemplo. */
export const OUTBOUND_NUMBERS: readonly string[] = ['917945449', '918371548'];

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

/** Por dónde atiende un agente en un grupo: Teléfono, Chat (Web Chat y WhatsApp juntos) o Email, como en el AED en
 *  vivo (DD-147). El grupo ofrece sus cuatro canales; el enlace de cada agente guarda familias. */
export type ChannelFamily = 'phone' | 'chat' | 'email';
export const CHANNEL_FAMILIES: readonly ChannelFamily[] = ['phone', 'chat', 'email'];
export const FAMILY_LABEL_KEYS: Readonly<Record<ChannelFamily, string>> = {
  phone: 'groups.channel.phone',
  chat: 'groups.channel.chat_family',
  email: 'groups.channel.email',
};

/* Las de SISMAC-1975 en COA (decisión de producto, 2026-09-16: las estrategias siguen al COA): quita Aleatoria y Lineal, y
 * añade Niveles, Ring All y Skills. «Agente exclusivo» se queda: el COA no la quita, y el manual de Voice (p. 12) y
 * el Figma de la migración la traen.
 * Skills sale APAGADA con su motivo a la vista, como pide el COA para las que necesitan configuración posterior: aquí
 * Niveles y Ring All ya se configuran en la ficha, pero las skills de cada agente todavía no existen. */
export const PHONE_STRATEGIES: readonly string[] = [
  'Balanceada',
  'Menos conversaciones atendidas',
  'Más tiempo inactivo',
  'Niveles',
  'Ring All',
  'Skills',
  'Agente exclusivo',
];

/** Las que aún no se pueden elegir (ver arriba). */
export const UNAVAILABLE_STRATEGIES: ReadonlySet<string> = new Set(['Skills']);

/** Las que sirven de valor por defecto en Contact Center › Grupos: las que no piden nada más en cada grupo. Niveles,
 *  Ring All, Skills y Agente exclusivo necesitan niveles, un número de agentes, skills o el IVR (SISMAC-1975). */
export const DEFAULT_STRATEGY_OPTIONS: readonly string[] = ['Balanceada', 'Menos conversaciones atendidas', 'Más tiempo inactivo'];

/** Desempata entre agentes del mismo nivel. No puede ser Niveles (manual de Voice, p. 12). */
export const SUB_STRATEGIES: readonly string[] = ['Balanceada', 'Más tiempo inactivo', 'Menos conversaciones atendidas'];

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
  /** «Desbordar sesión» del Figma de la migración («Redirige sesiones activas al superar el límite de…»). Sin pantalla
   *  desde DD-141: era de Chat, y lo cubre «Caducar sesión». Se sigue leyendo y guardando tal cual, para
   *  no perder lo que alguien guardó. */
  readonly overflowSession: boolean;
  readonly cardOpening: CardOpening;
  readonly cardUrl: string;
  readonly cardHeight: number;
  /**
   * Número al que llegan los mensajes de WhatsApp de este grupo.
   *
   * Desde la visión de producto de grupos (2026-09-25) WhatsApp es un SUBCANAL de Chat, con Web Chat:
   * comparten estrategia y cola, y el número se pide en el bloque de Chat en cuanto el grupo tiene
   * WhatsApp, con o sin Web Chat. (Hasta el 2026-09-26 solo se pintaba con Web Chat marcado, y un grupo
   * con WhatsApp y sin Web Chat se quedaba sin sitio donde ponerlo: medido el 2026-09-21.)
   *
   * **Sigue abierto con desarrollo, y es de modelo, no de pantalla:** la tabla de agentes da WhatsApp y
   * Web Chat POR SEPARADO a cada agente, pero en el AED en vivo el permiso del agente solo tiene
   * Tlf / Chat / Email (quien atiende Chat atiende los dos). ¿El backend nuevo tendrá un permiso de
   * WhatsApp propio por (agente, grupo), o WhatsApp es un ajuste dentro de Chat como en Voice?
   */
  readonly whatsappNumber: string;
  /** Al cerrar la conversación de chat, pedir al cliente que valore la atención. */
  readonly chatRatingEnabled: boolean;
  /** Webs donde se puede insertar el script del widget de chat (`chatScript`). Vacío = cualquiera. */
  readonly allowedDomains: readonly string[];
}

/** Los anuncios de fábrica. Un grupo nuevo nace con la voz guardada en Contact Center › Grupos (`GroupDefaultsStore`),
 *  que arranca con esta. */
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

/** Lo que no guardó un grupo de EJEMPLO: `resolveGroup` rellena con esto los 14 del seed. Un grupo NUEVO nace con
 *  lo de Contact Center › Grupos (`GroupDefaultsStore`), y de fábrica con `NEW_GROUP_ADVANCED` (DD-135). */
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
  'Menos conversaciones activas',
  'Balanceada',
];

/** Con la que reparte un grupo de ejemplo con Chat que no ha elegido otra. Uno nuevo nace con la de Contact Center. */
export const DEFAULT_CHAT_STRATEGY = CHAT_STRATEGIES[0]!;

/** Las estrategias que cambiaron de nombre, con el de ahora: reparten conversaciones, no llamadas ni chats (DD-141). */
const RENAMED_STRATEGIES: Readonly<Record<string, string>> = {
  'Menos llamadas atendidas': 'Menos conversaciones atendidas',
  'Menos chats activos': 'Menos conversaciones activas',
};

/** El nombre de ahora de una estrategia guardada. El nombre ES el valor que se guarda: lo guardado con el de antes se
 *  lee con el de ahora (en `GroupsStore` y en `GroupDefaultsStore`), sin subir la versión de ningún almacén. */
export function currentStrategyName(name: string): string {
  return RENAMED_STRATEGIES[name] ?? name;
}

/** Un grupo guardado, con sus tres estrategias por su nombre de ahora; el mismo objeto si no había nada que cambiar. */
export function groupWithCurrentStrategies(group: Group): Group {
  const strategy = currentStrategyName(group.strategy);
  const subStrategy = group.subStrategy === undefined ? undefined : currentStrategyName(group.subStrategy);
  const chatStrategy = group.chatStrategy === undefined ? undefined : currentStrategyName(group.chatStrategy);
  if (strategy === group.strategy && subStrategy === group.subStrategy && chatStrategy === group.chatStrategy) return group;
  return {
    ...group,
    strategy,
    ...(subStrategy === undefined ? {} : { subStrategy }),
    ...(chatStrategy === undefined ? {} : { chatStrategy }),
  };
}

/** Con lo que nace un grupo nuevo mientras nadie cambie Contact Center › Grupos: los parámetros por defecto del
 *  documento de producto de usuarios y grupos (DD-135). Transferencia 10 s, espera en cola 15 s, % de servicio 60 s,
 *  tiempo administrativo casi nulo y desbordar si todos los agentes están inactivos. «Desbordar sesión» se queda
 *  apagado, y sin pantalla desde DD-141. */
export const NEW_GROUP_ADVANCED: GroupAdvanced = {
  ...DEFAULT_ADVANCED,
  transferSec: 10,
  maxQueueWaitSec: 15,
  serviceLevelSec: 60,
  wrapUpSec: 5,
  overflowWhenNoAgents: true,
};

/* ── Por canal: la cola, los tiempos y lo propio de Chat (visión de producto de grupos, 2026-09-25) ──
 *
 * «Dentro de cada canal, distribución y colas»: Teléfono y Chat tienen cada uno su cola y sus tiempos.
 * Hasta el 2026-09-26 había UN juego para todo el grupo, en `GroupAdvanced`. El cambio es ADITIVO: los
 * campos nuevos son opcionales y, mientras un grupo no guarde los suyos, se leen del juego de antes
 * (`resolveGroup`). Los stores del repo no migran —subir su versión borra lo guardado y re-siembra—, así
 * que esta es la vía que no pierde nada de lo que alguien haya creado en la demo. */

/** La cola y los tiempos de UN canal. Mismos nombres que en `GroupAdvanced`, de donde salen al leer. */
export interface ChannelQueue {
  readonly queueSizeType: QueueSizeType;
  readonly queueSize: number;
  readonly maxQueueWaitSec: number;
  /** Tiempo para medir el % de servicio. */
  readonly serviceLevelSec: number;
  readonly transferSec: number;
}

/** Los subcanales de Chat. `chat` es Web Chat. */
export type ChatSubchannel = 'chat' | 'whatsapp';

/** Lo que se le escribe al cliente de chat mientras espera. Vacío = no se envía nada. */
export interface ChatQueueMessages {
  readonly onEnter: string;
  readonly whileWaiting: string;
  readonly noAgents: string;
}

/** Lo propio de Chat: cerrar por inactividad (visible, no en un «avanzado») y los mensajes de cola de cada
 *  subcanal, que se escriben por separado porque Web Chat y WhatsApp no hablan igual. */
export interface ChatSettings {
  readonly closeOnInactivity: boolean;
  readonly inactivityMinutes: number;
  readonly queueMessages: Readonly<Record<ChatSubchannel, ChatQueueMessages>>;
}

export const EMPTY_CHAT_MESSAGES: ChatQueueMessages = { onEnter: '', whileWaiting: '', noAgents: '' };

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  closeOnInactivity: false,
  inactivityMinutes: 10,
  queueMessages: { chat: EMPTY_CHAT_MESSAGES, whatsapp: EMPTY_CHAT_MESSAGES },
};

/** La cola de un canal, tal como la dejaba el juego único de antes. */
export function queueFrom(advanced: GroupAdvanced): ChannelQueue {
  const { queueSizeType, queueSize, maxQueueWaitSec, serviceLevelSec, transferSec } = advanced;
  return { queueSizeType, queueSize, maxQueueWaitSec, serviceLevelSec, transferSec };
}

/** Un grupo con TODO resuelto: lo que guardó, y lo que no, de su juego de antes o de fábrica. */
export interface ResolvedGroup extends Group {
  readonly announcements: GroupAnnouncements;
  readonly advanced: GroupAdvanced;
  readonly phoneQueue: ChannelQueue;
  readonly chatQueue: ChannelQueue;
  readonly chat: ChatSettings;
}

/**
 * LA ÚNICA VÍA DE LECTURA de un grupo guardado: lo nuevo, si no lo de antes, si no el valor de fábrica.
 * Cada objeto anidado se completa campo a campo, así que un grupo guardado ayer (sin colas por canal ni
 * ajustes de chat) abre con las colas que tenía, y uno de mañana con un campo más no pierde los demás.
 */
export function resolveGroup(group: Group): ResolvedGroup {
  const advanced: GroupAdvanced = { ...DEFAULT_ADVANCED, ...group.advanced };
  const legacyQueue = queueFrom(advanced);
  const messages = group.chat?.queueMessages;
  return {
    ...group,
    announcements: { ...DEFAULT_ANNOUNCEMENTS, ...group.announcements },
    advanced,
    phoneQueue: { ...legacyQueue, ...group.phoneQueue },
    chatQueue: { ...legacyQueue, ...group.chatQueue },
    chat: {
      ...DEFAULT_CHAT_SETTINGS,
      ...group.chat,
      queueMessages: {
        chat: { ...EMPTY_CHAT_MESSAGES, ...messages?.chat },
        whatsapp: { ...EMPTY_CHAT_MESSAGES, ...messages?.whatsapp },
      },
    },
  };
}

/**
 * La estrategia con la que reparte cada familia de canales que el grupo OFRECE; `null` si no la ofrece.
 * Una sola lectura para el listado (celda, orden, búsqueda, lote y exportación): un grupo sin Teléfono
 * guarda una estrategia de teléfono que no se aplica, y uno con Chat que no guardó la suya reparte con
 * la primera del catálogo, que es con la que abre su ficha.
 */
export function phoneStrategyOf(group: Pick<Group, 'channels' | 'strategy'>): string | null {
  return group.channels.includes('phone') ? group.strategy : null;
}

export function chatStrategyOf(group: Pick<Group, 'channels' | 'chatStrategy'>): string | null {
  const hasChat = group.channels.includes('chat') || group.channels.includes('whatsapp');
  return hasChat ? (group.chatStrategy ?? DEFAULT_CHAT_STRATEGY) : null;
}

/** Orden de la prioridad: de Baja a Máxima, no alfabético (Alta < Baja < Máxima < Media). */
export function priorityRank(priority: GroupPriority): number {
  return GROUP_PRIORITIES.indexOf(priority);
}

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
  /** La cola y los tiempos de Teléfono. Sin ella, los de `advanced` (se lee con `resolveGroup`). */
  readonly phoneQueue?: ChannelQueue;
  /** La cola y los tiempos de Chat (Web Chat y WhatsApp). Sin ella, los de `advanced`. */
  readonly chatQueue?: ChannelQueue;
  readonly chat?: ChatSettings;
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
    chatStrategy: 'Menos conversaciones activas',
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
    chatStrategy: 'Menos conversaciones activas',
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

/** Lo que Contact Center › Grupos fija para los grupos nuevos (DD-135). Mismos campos y mismas palabras que la ficha
 *  de grupo: la réplica de la maqueta tenía sus propias listas (códecs como «voz», FIFO/LIFO, «Urgente») que no
 *  casaban con nada. */
export interface GroupDefaults {
  /** La de Teléfono. */
  readonly strategy: string;
  readonly priority: GroupPriority;
  readonly voice: string;
  readonly advanced: GroupAdvanced;
  /* Por canal, como la ficha desde el 2026-09-26 (visión de producto de grupos, 2026-09-25). Lo guardado antes no
   * los trae: `GroupDefaultsStore` los resuelve al leer, con la cola única de antes en las dos colas. */
  readonly chatStrategy: string;
  readonly phoneQueue: ChannelQueue;
  readonly chatQueue: ChannelQueue;
  readonly chat: Pick<ChatSettings, 'closeOnInactivity' | 'inactivityMinutes'>;
}

/** Prioridad baja y estrategia balanceada en los dos canales, como pide el documento de producto de usuarios y grupos. */
export const FACTORY_GROUP_DEFAULTS: GroupDefaults = {
  strategy: 'Balanceada',
  priority: 'Baja',
  voice: DEFAULT_ANNOUNCEMENTS.voice,
  advanced: NEW_GROUP_ADVANCED,
  chatStrategy: 'Balanceada',
  phoneQueue: queueFrom(NEW_GROUP_ADVANCED),
  chatQueue: queueFrom(NEW_GROUP_ADVANCED),
  /* Cerrar por inactividad, a los 5 minutos si se enciende (DD-141). Las semillas guardan los 10 de
   * `DEFAULT_CHAT_SETTINGS`: es lo que ya tenían, y un grupo de ejemplo no cambia al abrirlo. */
  chat: {
    closeOnInactivity: DEFAULT_CHAT_SETTINGS.closeOnInactivity,
    inactivityMinutes: 5,
  },
};

/** Lo que pide el diálogo de duplicar: lo que identifica al duplicado. Un grupo NUEVO nace en su propia ficha,
 *  en modo alta, con los valores de Contact Center › Grupos (DD-121, DD-135). */
export interface GroupIdentityDraft {
  readonly name: string;
  readonly phone: string;
  readonly priority: GroupPriority;
}

/**
 * Duplicado: TODO lo del original, canales incluidos, con los datos que se hayan puesto en el diálogo.
 * El diálogo propone el nombre «… (copia)» y deja vacío el teléfono asociado: identifica al grupo, y dos
 * grupos no deben sacar el mismo número a la calle.
 */
export function duplicateGroupDraft(source: Group, identity: GroupIdentityDraft): Omit<Group, 'id' | 'code'> {
  const { id: _id, code: _code, services: _services, ...rest } = source;
  return { ...rest, ...identity };
}
