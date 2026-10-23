import type { Channel } from '@features/admin/services/group-agent-links.types';
import type { LabelColor } from '@shared/components';
import { juegoDeDatos } from '@core/services/juego-de-datos';

/**
 * «Desconectado» es no tener la sesión abierta: sustituye a la columna «Activación», que no existía en el producto
 * (definición de producto, 2026-09-16). Conversación, Postconversando y Administrativo los pone la conversación o el
 * propio agente. En la lista el estado se VE y no se cambia: ninguno se edita desde ahí. «Conversación», el agente
 * atendiendo, es de SISMAC-4060 (DD-225).
 */
export type PresenceStatus =
  | 'disponible'
  | 'no_disponible'
  | 'bano'
  | 'comida'
  | 'formacion'
  | 'post_conversando'
  | 'conversacion'
  | 'administrativo'
  | 'desconectado';

export const PRESENCE_LABEL_KEYS: Readonly<Record<PresenceStatus, string>> = {
  disponible: 'agents.presence.available',
  no_disponible: 'agents.presence.unavailable',
  bano: 'agents.presence.bathroom',
  comida: 'agents.presence.lunch',
  formacion: 'agents.presence.training',
  post_conversando: 'agents.presence.wrap_up',
  conversacion: 'agents.presence.talking',
  administrativo: 'agents.presence.administrative',
  desconectado: 'agents.presence.offline',
};

/** Cómo se pinta la etiqueta de un estado: un color de etiqueta (con borde, salvo `bordered: false`), o una severidad
 * nativa de `p-tag`. */
export type PresenceTag =
  | { readonly labelColor: LabelColor; readonly bordered?: false }
  | { readonly severity: 'secondary' };

/**
 * La etiqueta de cada estado, por FAMILIA (SISMAC-4060, DD-225): Disponible verde; en rojo, No disponible y sus motivos
 * (Baño, Comida y Formación); Administrativo, en su marrón (DD-176), que no es una etiqueta roja; en azul, lo de la
 * conversación. Dentro del azul, Post-conversando lleva la etiqueta azul sin borde: la misma pieza, alto y peso que
 * las demás, y se distingue de Conversación por el borde. El `tag` Info que le da Figma no tiene la hechura de la
 * etiqueta (21,5 px de alto frente a 25,5, y en negrita); su color propio en el DS (`semantic/presence/wrapup`,
 * cyan/700), de fondo, saltaría sobre las demás, todas pastel; y el teal se confunde con el verde de Disponible.
 * Desconectado, sin etiqueta: gris (`secondary`) en el punto del avatar, y en el listado como texto, para no pesar como
 * un estado atendible.
 */
export const PRESENCE_TAGS: Readonly<Record<PresenceStatus, PresenceTag>> = {
  disponible: { labelColor: 'green' },
  no_disponible: { labelColor: 'red' },
  bano: { labelColor: 'red' },
  comida: { labelColor: 'red' },
  formacion: { labelColor: 'red' },
  administrativo: { labelColor: 'brown' },
  post_conversando: { labelColor: 'blue', bordered: false },
  conversacion: { labelColor: 'blue' },
  desconectado: { severity: 'secondary' },
};

/**
 * El orden de la columna Estado, de más a menos disponible (SISMAC-4060, DD-225): Disponible, No disponible, los
 * personalizados, Administrativo, Post-conversando, Conversación y Desconectado. Los personalizados (Baño, Comida,
 * Formación) comparten puesto: entre ellos, por su nombre en el idioma de la pantalla, que lo resuelve la lista.
 */
export const PRESENCE_SORT_RANK: Readonly<Record<PresenceStatus, number>> = {
  disponible: 0,
  no_disponible: 1,
  bano: 2,
  comida: 2,
  formacion: 2,
  administrativo: 3,
  post_conversando: 4,
  conversacion: 5,
  desconectado: 6,
};

/**
 * Channel type alias kept on the Agents feature for callers that still
 * type a single channel value (icon picker, list-page chip cell). The
 * canonical type lives in `@features/admin/services/group-agent-links.types`
 * — both unions are structurally identical.
 */
export type AgentChannel = 'phone' | 'chat' | 'whatsapp' | 'email';

export type AgentType = 'normal' | 'cuscare' | 'cuscare_carrier' | 'admin_cuscare';
export const AGENT_TYPES: readonly AgentType[] = [
  'normal',
  'cuscare',
  'cuscare_carrier',
  'admin_cuscare',
];
export const AGENT_TYPE_LABEL_KEYS: Readonly<Record<AgentType, string>> = {
  normal: 'agents.type.normal',
  cuscare: 'agents.type.cuscare',
  cuscare_carrier: 'agents.type.cuscare_carrier',
  admin_cuscare: 'agents.type.admin_cuscare',
};

/**
 * Si el cliente tiene CusCare. Solo entonces la ficha pregunta el tipo de agente (CusCare, Carrier, Admin CusCare): en
 * un cliente sin CusCare todos son normales y el campo no sale (revisión de agentes del 2026-10-09). El cliente de la
 * demo lo tiene: SCC está en el menú.
 */
export const CLIENTE_CON_CUSCARE = true;

/**
 * Si el cliente tiene contratados agentes en el navegador (WebRTC). Sin ellos, todos suenan en el teléfono: la ficha
 * enseña «Navegador» deshabilitado (`optionDisabled` del SelectButton de primeng.dev) y el tipo queda en Teléfono
 * (DD-211 §2). El cliente de la demo los tiene.
 */
export const CLIENTE_CON_WEBRTC = true;

/**
 * Si el cliente tiene Call Blending. Solo entonces el agente tiene «Grupo para llamadas salientes», obligatorio con
 * Teléfono, y lo copia al duplicarse (SISMAC-4062, DD-211 §9). El cliente de la demo lo tiene: el prototipo enseña todo
 * lo contratable.
 */
export const CLIENTE_CON_CALL_BLENDING = true;

/** Dónde suena: `phone`, en su teléfono móvil; `webrtc`, en el navegador, con Smart Contact Agent. */
export type ExtensionType = 'phone' | 'webrtc';
export const EXTENSION_TYPES: readonly ExtensionType[] = ['webrtc', 'phone'];
/** El glifo de cada tipo de extensión: la llamada va por un teléfono o por la web. Lo usan la lista y la ficha. */
export const EXTENSION_ICONS: Readonly<Record<ExtensionType, string>> = {
  phone: 'smartphone',
  webrtc: 'language',
};
/** Las de Contact Center › Servicio («Tipo de descuelgue»), con sus palabras. Una para llamadas y chats: que fueran
 *  distintas no tenía sentido para comercial ni para postventa (revisión de agentes del 2026-10-09). Sin «Automático con
 *  preview» (DD-211 §2): lo guardado con él se lee como automático. */
export type PickupType = 'manual' | 'auto';
export const PICKUP_TYPES: readonly PickupType[] = ['manual', 'auto'];

export interface AgentPermissions {
  readonly manageDevices: boolean;
  readonly selfActivate: boolean;
  readonly externalDevices: boolean;
  readonly callsEnabled: boolean;
  readonly transfersEnabled: boolean;
  /** A otros agentes y a grupos (DD-211 §2). Lo guardado antes no lo trae: se lee como de fábrica, permitido
   *  (`agenteAlDia`), porque antes no se restringía. */
  readonly callsDestAgents: boolean;
  readonly callsDestGroups: boolean;
  readonly callsDestFixed: boolean;
  readonly callsDestMobile: boolean;
  readonly callsDestInternational: boolean;
  readonly callsDestSpecial: boolean;
  readonly transfersDestFixed: boolean;
  readonly transfersDestMobile: boolean;
  readonly transfersDestInternational: boolean;
  readonly transfersDestSpecial: boolean;
  readonly transfersDestAgents: boolean;
  readonly transfersDestGroups: boolean;
  readonly recording: boolean;
  /** «Gestión de conversaciones pendientes»: el agente gestiona las pérdidas (revisión de agentes del 2026-10-09: es del
   *  agente, no del grupo). Lo guardado antes no lo trae: se lee como de fábrica, apagado (`agenteAlDia`). */
  readonly pendingConversations: boolean;
}

/** La base de los permisos de los agentes de EJEMPLO. Uno nuevo nace con lo de Contact Center › Agentes
 *  (`AgentDefaultsStore`), y de fábrica con `FACTORY_AGENT_DEFAULTS` (DD-135). */
export const SEED_AGENT_PERMISSIONS: AgentPermissions = {
  manageDevices: false,
  selfActivate: false,
  externalDevices: false,
  callsEnabled: true,
  transfersEnabled: true,
  callsDestAgents: true,
  callsDestGroups: true,
  transfersDestAgents: true,
  transfersDestGroups: true,
  callsDestFixed: true,
  callsDestMobile: true,
  callsDestInternational: false,
  callsDestSpecial: false,
  transfersDestFixed: true,
  transfersDestMobile: true,
  transfersDestInternational: false,
  transfersDestSpecial: false,
  recording: false,
  pendingConversations: false,
};

/** Las filas de la matriz de permisos: a quién llama o transfiere el agente, otros agentes y grupos (DD-211 §2), y a
 *  qué numeración. */
export type DestinoKey = 'agentes' | 'grupos' | 'fijos' | 'moviles' | 'internacionales' | 'especial';
/** Sus columnas. */
export type DestinoCol = 'llamada' | 'transferencia';

export const DESTINO_KEYS: readonly DestinoKey[] = ['agentes', 'grupos', 'fijos', 'moviles', 'internacionales', 'especial'];

/** Cada casilla de la matriz (destino × llamada o transferencia) es una clave de `AgentPermissions`. La misma matriz
 *  en la ficha de agente y en Contact Center › Agentes. */
export const PERMISSION_MATRIX_KEYS: Readonly<Record<DestinoKey, Record<DestinoCol, keyof AgentPermissions>>> = {
  agentes: { llamada: 'callsDestAgents', transferencia: 'transfersDestAgents' },
  grupos: { llamada: 'callsDestGroups', transferencia: 'transfersDestGroups' },
  fijos: { llamada: 'callsDestFixed', transferencia: 'transfersDestFixed' },
  moviles: { llamada: 'callsDestMobile', transferencia: 'transfersDestMobile' },
  internacionales: { llamada: 'callsDestInternational', transferencia: 'transfersDestInternational' },
  especial: { llamada: 'callsDestSpecial', transferencia: 'transfersDestSpecial' },
};

/** Con lo que nace un agente nuevo, y lo que fija Contact Center › Agentes (DD-135): sus permisos y la URL de su
 *  iframe. Lo demás (nombre, extensión, grupos…) es de cada agente. */
export interface AgentDefaults {
  readonly allowedChannels: readonly Channel[];
  readonly permissions: AgentPermissions;
  readonly iframeUrl: string;
}

/** De fábrica, los parámetros por defecto del documento de producto de usuarios y grupos: llamadas y transferencias a
 *  todo menos la numeración especial, gestión de dispositivos, activación por grupo y dispositivos externos. La
 *  grabación, apagada: el documento no la cuenta entre ellos. */
export const FACTORY_AGENT_DEFAULTS: AgentDefaults = {
  allowedChannels: ['phone', 'chat', 'email'],
  permissions: {
    manageDevices: true,
    selfActivate: true,
    externalDevices: true,
    callsEnabled: true,
    transfersEnabled: true,
    callsDestAgents: true,
    callsDestGroups: true,
    transfersDestAgents: true,
    transfersDestGroups: true,
    callsDestFixed: true,
    callsDestMobile: true,
    callsDestInternational: true,
    callsDestSpecial: false,
    transfersDestFixed: true,
    transfersDestMobile: true,
    transfersDestInternational: true,
    transfersDestSpecial: false,
    recording: false,
    pendingConversations: false,
  },
  iframeUrl: '',
};

/**
 * Full Agent shape. Backward-compatible with the slim stub the Labels and
 * Seguridad features adopted earlier (they only consume id / name / code /
 * extension / email / status / labels).
 *
 * Per-(agent, group) channel permissions live in `GroupAgentLinksStore`
 * since DD#54. To get an agent's effective channels, query the store for
 * its links, intersect with offered and permitted families, and union the active ones.
 */
export interface Agent {
  /** Ausente en datos antiguos: las tres familias. Vacío: ninguna (DD-150). */
  readonly allowedChannels?: readonly Channel[];
  readonly id: number;
  readonly code: string;
  readonly name: string;
  readonly extension: string;
  readonly extensionType: ExtensionType;
  readonly agentType: AgentType;
  readonly status: 'active' | 'inactive';
  readonly presenceStatus?: PresenceStatus;
  readonly phone?: string;
  readonly email?: string;
  readonly pin?: string;
  /** El grupo por el que salen sus llamadas: uno de los suyos con Teléfono. Se elige en su tabla de grupos. */
  readonly defaultOutboundGroupId?: number;
  /** Sus equipos (Repositorios › Equipos): marcas para filtrar, no reparten nada. */
  readonly teams?: readonly number[];
  readonly iframeUrl?: string;
  readonly permissions: AgentPermissions;
  readonly languages?: readonly string[];
  readonly randomOrder?: boolean;
  readonly pickupType?: PickupType;
  /** De cuando chat y llamadas tenían cada uno su descuelgue: ya no se lee ni se escribe. */
  readonly pickupTypeChat?: PickupType;
  readonly photo?: string;
  readonly maxChats?: number;
  readonly labels?: readonly number[];
  readonly schedules?: readonly number[];
  readonly templates?: readonly number[];
  /** «Actualizar teléfono en login»: fuera de la ficha (DD-211 §2); ya no se lee ni se escribe. */
  readonly loginExtOverride?: boolean;
  /** Draft flag — set on duplicated entities until the user saves (DD#294). */
}

/** Lo guardado antes de un permiso nuevo no lo trae: se lee como de fábrica, igual que lo de Contact Center
 *  (`AgentDefaultsStore`), sin subir la versión (AGENTS: «normalize», la vía que no borra). Agentes y Grupos del
 *  Destino salen permitidos (DD-211 §2): antes no había nada que los restringiera. */
export function agenteAlDia(guardado: Agent): Agent {
  return { ...guardado, permissions: { ...FACTORY_AGENT_DEFAULTS.permissions, ...guardado.permissions } };
}

export interface ExtensionOption {
  readonly number: string;
  readonly type: ExtensionType;
}

export const AVAILABLE_LANGUAGES: readonly string[] = [
  'Español',
  'Inglés',
  'Francés',
  'Portugués',
  'Alemán',
  'Italiano',
];

export const AVAILABLE_EXTENSIONS: readonly ExtensionOption[] = [
  { number: '100', type: 'webrtc' },
  { number: '101', type: 'webrtc' },
  { number: '102', type: 'webrtc' },
  { number: '103', type: 'phone' },
  { number: '104', type: 'webrtc' },
  { number: '105', type: 'webrtc' },
  { number: '106', type: 'webrtc' },
  { number: '108', type: 'webrtc' },
  { number: '110', type: 'webrtc' },
  { number: '112', type: 'webrtc' },
  { number: '113', type: 'webrtc' },
  { number: '114', type: 'webrtc' },
  { number: '116', type: 'webrtc' },
  { number: '118', type: 'webrtc' },
  { number: '120', type: 'webrtc' },
  { number: '122', type: 'webrtc' },
  { number: '123', type: 'webrtc' },
  { number: '124', type: 'webrtc' },
  { number: '126', type: 'phone' },
  { number: '128', type: 'webrtc' },
  { number: '130', type: 'phone' },
  { number: '132', type: 'webrtc' },
  { number: '134', type: 'webrtc' },
  { number: '136', type: 'webrtc' },
  { number: '138', type: 'webrtc' },
  { number: '140', type: 'webrtc' },
];

const DP = SEED_AGENT_PERMISSIONS;

const BASE_AGENTS: readonly Agent[] = [
  {
    id: 1,
    code: '10001',
    name: 'Tom Hanks',
    extension: '122',
    extensionType: 'webrtc',
    agentType: 'cuscare',
    status: 'active',
    presenceStatus: 'disponible',
    pin: '392',
    teams: [1],
    defaultOutboundGroupId: 1,
    permissions: { ...DP },
    pickupType: 'auto',
  },
  {
    id: 2,
    code: '10002',
    name: 'Meryl Streep',
    extension: '123',
    extensionType: 'webrtc',
    agentType: 'cuscare',
    status: 'active',
    presenceStatus: 'disponible',
    pin: '507',
    permissions: { ...DP },
    pickupType: 'auto',
    schedules: [1],
  },
  {
    id: 3,
    code: '10003',
    name: 'Denzel Washington',
    extension: '124',
    extensionType: 'webrtc',
    agentType: 'cuscare',
    status: 'active',
    presenceStatus: 'comida',
    pin: '135',
    iframeUrl: 'https://crm.example.com/agent-panel',
    teams: [1, 4],
    permissions: { ...DP, manageDevices: true, recording: true },
    pickupType: 'auto',
    schedules: [1, 3],
  },
  {
    id: 4,
    code: '10004',
    name: 'Julia Roberts',
    extension: '114',
    extensionType: 'webrtc',
    agentType: 'cuscare_carrier',
    status: 'active',
    presenceStatus: 'disponible',
    pin: '638',
    permissions: { ...DP },
    pickupType: 'auto',
    schedules: [1],
  },
  {
    id: 5,
    code: '10005',
    name: 'Leonardo DiCaprio',
    extension: '103',
    extensionType: 'phone',
    phone: '612345678',
    agentType: 'normal',
    status: 'active',
    presenceStatus: 'bano',
    pin: '990',
    permissions: { ...DP },
    pickupType: 'manual',
    schedules: [4],
  },
  {
    id: 6,
    code: '10006',
    name: 'Scarlett Johansson',
    extension: '120',
    extensionType: 'webrtc',
    agentType: 'cuscare',
    status: 'inactive',
    presenceStatus: 'desconectado',
    phone: '612345678',
    email: 'jbarcala@company.com',
    pin: '614',
    permissions: { ...DP },
    pickupType: 'auto',
  },
  {
    id: 7,
    code: '10007',
    name: 'Morgan Freeman',
    extension: '118',
    extensionType: 'webrtc',
    agentType: 'admin_cuscare',
    status: 'active',
    presenceStatus: 'disponible',
    phone: '698765432',
    email: 'mperez@company.com',
    iframeUrl: 'https://crm.example.com/mario',
    pin: '246',
    defaultOutboundGroupId: 1,
    teams: [1, 3],
    permissions: { ...DP, selfActivate: true, manageDevices: true, recording: true },
    languages: ['Español', 'Inglés'],
    pickupType: 'auto',
    schedules: [1, 2],
  },
  {
    id: 8,
    code: '10008',
    name: 'Natalie Portman',
    extension: '106',
    extensionType: 'webrtc',
    agentType: 'cuscare',
    status: 'active',
    presenceStatus: 'formacion',
    email: 'mrecio@company.com',
    pin: '835',
    teams: [2],
    permissions: { ...DP, recording: true },
    pickupType: 'auto',
    schedules: [2],
  },
  {
    id: 9,
    code: '10009',
    name: 'Keanu Reeves',
    extension: '102',
    extensionType: 'webrtc',
    agentType: 'cuscare',
    status: 'inactive',
    presenceStatus: 'desconectado',
    pin: '773',
    permissions: { ...DP },
    pickupType: 'auto',
  },
  {
    id: 10,
    code: '10010',
    name: 'Viola Davis',
    extension: '104',
    extensionType: 'webrtc',
    agentType: 'cuscare_carrier',
    status: 'active',
    presenceStatus: 'disponible',
    pin: '482',
    permissions: { ...DP, recording: true },
    pickupType: 'auto',
  },
  {
    id: 11,
    code: '10011',
    name: 'Brad Pitt',
    extension: '108',
    extensionType: 'webrtc',
    agentType: 'cuscare',
    status: 'active',
    presenceStatus: 'post_conversando',
    pin: '419',
    permissions: { ...DP },
    pickupType: 'auto',
    schedules: [1, 3],
  },
  {
    id: 12,
    code: '10012',
    name: 'Cate Blanchett',
    extension: '105',
    extensionType: 'webrtc',
    agentType: 'cuscare',
    status: 'active',
    presenceStatus: 'comida',
    pin: '551',
    permissions: { ...DP },
    pickupType: 'auto',
  },
  {
    id: 13,
    code: '10013',
    name: 'Samuel L. Jackson',
    extension: '116',
    extensionType: 'webrtc',
    agentType: 'cuscare',
    status: 'active',
    presenceStatus: 'administrativo',
    pin: '284',
    permissions: { ...DP, externalDevices: true, recording: true },
    pickupType: 'auto',
    schedules: [1, 3],
  },
  {
    id: 14,
    code: '10014',
    name: 'Emma Stone',
    extension: '110',
    extensionType: 'webrtc',
    agentType: 'cuscare',
    status: 'active',
    presenceStatus: 'no_disponible',
    pin: '706',
    permissions: { ...DP },
    pickupType: 'auto',
  },
  {
    id: 15,
    code: '10015',
    name: 'Rafa Areses',
    extension: '113',
    extensionType: 'webrtc',
    agentType: 'admin_cuscare',
    status: 'active',
    presenceStatus: 'disponible',
    pin: '139',
    permissions: { ...DP, recording: true },
    pickupType: 'auto',
    schedules: [4, 5],
  },
  {
    id: 16,
    code: '10016',
    name: 'Robert De Niro',
    extension: '109',
    extensionType: 'phone',
    phone: '600112233',
    agentType: 'normal',
    status: 'inactive',
    presenceStatus: 'desconectado',
    pin: '672',
    permissions: { ...DP },
    pickupType: 'manual',
  },
  // Cuatro nombres del equipo de producto, junto a los de Hollywood. Sin teléfono propio; el email lo
  // saca `demoEmail` del nombre, en el dominio de demo.
  {
    id: 17,
    code: '10017',
    name: 'Ángel Valderrama',
    extension: '125',
    extensionType: 'webrtc',
    agentType: 'normal',
    status: 'active',
    // Atendiendo, para que la lista enseñe «Conversación» (SISMAC-4060, DD-225). No es de la demo del Dashboard.
    presenceStatus: 'conversacion',
    pin: '318',
    permissions: { ...DP, recording: true },
    pickupType: 'auto',
  },
  {
    id: 18,
    code: '10018',
    name: 'Marta Recio',
    extension: '126',
    extensionType: 'webrtc',
    agentType: 'cuscare',
    status: 'active',
    presenceStatus: 'post_conversando',
    pin: '527',
    permissions: { ...DP },
    pickupType: 'auto',
  },
  {
    id: 19,
    code: '10019',
    name: 'Miguel Palacios',
    extension: '127',
    extensionType: 'phone',
    phone: '655443322',
    agentType: 'normal',
    status: 'active',
    presenceStatus: 'comida',
    pin: '846',
    permissions: { ...DP, recording: true },
    pickupType: 'manual',
  },
  {
    id: 20,
    code: '10020',
    name: 'Mario Pérez',
    extension: '128',
    extensionType: 'webrtc',
    agentType: 'normal',
    status: 'inactive',
    presenceStatus: 'desconectado',
    pin: '205',
    permissions: { ...DP },
    pickupType: 'auto',
  },
];

/*
 * DEMO (decisión de producto, 2026-09-14): 500 agentes por defecto, para que la lista enseñe la tabla con scroll propio
 * y lista virtual (DD-95) con un volumen real. Los 20 de arriba conservan sus ids, que usan la
 * membresía de grupos y el catálogo de entidades; los demás repiten sus datos con nombres de Hollywood.
 */
const NOMBRES = ['Nicole', 'Harrison', 'Sandra', 'Will', 'Anne', 'Matt', 'Charlize', 'Ryan', 'Jodie', 'Hugh', 'Julianne', 'Al', 'Halle', 'Johnny', 'Kate', 'Idris', 'Penélope', 'Javier', 'Salma', 'Antonio', 'Zendaya', 'Timothée', 'Margot', 'Pedro', 'Florence'];
const APELLIDOS = ['Kidman', 'Ford', 'Bullock', 'Smith', 'Hathaway', 'Damon', 'Theron', 'Gosling', 'Foster', 'Jackman', 'Moore', 'Pacino', 'Berry', 'Depp', 'Winslet', 'Elba', 'Cruz', 'Bardem', 'Hayek', 'Banderas', 'Coleman', 'Chalamet', 'Robbie', 'Pascal', 'Pugh'];
const TOTAL_AGENTES_DEMO = 500;

/*
 * Con `?datos=editorial` (DD-124), el cruce va en diagonal: cada agente cambia de apellido respecto al anterior. En
 * orden, la lista enseñaba 25 seguidos apellidados «Kidman», y en una demo se lee como generado (revisión editorial,
 * 2026-09-27). Cada nombre sigue saliendo con apellidos distintos, así que no se repite ninguna combinación.
 */
const EN_DIAGONAL = juegoDeDatos() === 'editorial';
const apellidoDe = (i: number): string => {
  const bloque = Math.floor(i / NOMBRES.length);
  return APELLIDOS[(EN_DIAGONAL ? (i % NOMBRES.length) + bloque : bloque) % APELLIDOS.length];
};

const GENERATED_AGENTS: readonly Agent[] = Array.from({ length: TOTAL_AGENTES_DEMO - BASE_AGENTS.length }, (_, i) => {
  const base = BASE_AGENTS[i % BASE_AGENTS.length];
  const id = BASE_AGENTS.length + i + 1;
  return {
    ...base,
    id,
    code: String(10000 + id),
    name: `${NOMBRES[i % NOMBRES.length]} ${apellidoDe(i)}`,
    extension: String(200 + id),
    pin: String(100 + ((id * 37) % 900)),
    // Solo los que ya lo tenían en su molde, y cada uno el suyo: copiado, el mismo móvil salía en 30 agentes.
    phone: base.phone ? String(600000000 + id * 1237) : undefined,
  };
});

/**
 * Email de demo sacado del nombre (nombre.apellido, sin acentos, en el dominio de demo), para que ninguno se repita.
 * También para los 16 de arriba: los suyos venían de antes de que se llamaran como actores («jbarcala» era Scarlett
 * Johansson) y en la columna Email se leía el desajuste.
 */
function demoEmail(name: string): string {
  const local = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '');
  return `${local}@company.com`;
}

export const AGENTS_SEED: readonly Agent[] = [
  ...BASE_AGENTS.map((a) => ({ ...a, email: demoEmail(a.name) })),
  ...GENERATED_AGENTS.map((a) => ({ ...a, email: demoEmail(a.name), ...(a.id === 499 || a.id === 500 ? { allowedChannels: ['chat'] as const } : {}) })),
];
