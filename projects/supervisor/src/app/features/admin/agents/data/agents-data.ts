export type PresenceStatus = 'disponible' | 'no_disponible' | 'bano' | 'comida' | 'formacion';

export const PRESENCE_LABEL_KEYS: Readonly<Record<PresenceStatus, string>> = {
  disponible: 'agents.presence.available',
  no_disponible: 'agents.presence.unavailable',
  bano: 'agents.presence.bathroom',
  comida: 'agents.presence.lunch',
  formacion: 'agents.presence.training',
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

export type ExtensionType = 'phone' | 'webrtc';
export type PickupType = 'auto' | 'manual';

export interface AgentPermissions {
  readonly manageDevices: boolean;
  readonly selfActivate: boolean;
  readonly externalDevices: boolean;
  readonly callsEnabled: boolean;
  readonly transfersEnabled: boolean;
  readonly callsDestFixed: boolean;
  readonly callsDestMobile: boolean;
  readonly callsDestInternational: boolean;
  readonly callsDestSpecial: boolean;
  readonly transfersDestFixed: boolean;
  readonly transfersDestMobile: boolean;
  readonly transfersDestInternational: boolean;
  readonly transfersDestSpecial: boolean;
  readonly recording: boolean;
}

export const DEFAULT_AGENT_PERMISSIONS: AgentPermissions = {
  manageDevices: false,
  selfActivate: false,
  externalDevices: false,
  callsEnabled: true,
  transfersEnabled: true,
  callsDestFixed: true,
  callsDestMobile: true,
  callsDestInternational: false,
  callsDestSpecial: false,
  transfersDestFixed: true,
  transfersDestMobile: true,
  transfersDestInternational: false,
  transfersDestSpecial: false,
  recording: false,
};

/**
 * Full Agent shape. Backward-compatible with the slim stub the Labels and
 * Seguridad features adopted earlier (they only consume id / name / code /
 * extension / email / status / labels).
 *
 * Per-(agent, group) channel permissions live in `GroupAgentLinksStore`
 * since DD#54. To get an agent's effective channels, query the store for
 * its links and union the active ones.
 */
export interface Agent {
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
  readonly defaultOutboundGroup?: string;
  readonly iframeUrl?: string;
  readonly permissions: AgentPermissions;
  readonly languages?: readonly string[];
  readonly randomOrder?: boolean;
  readonly pickupType?: PickupType;
  readonly pickupTypeChat?: PickupType;
  readonly photo?: string;
  readonly maxChats?: number;
  readonly labels?: readonly number[];
  readonly schedules?: readonly number[];
  readonly templates?: readonly number[];
  /** When true, the agent's `extension` field is auto-updated on login. */
  readonly loginExtOverride?: boolean;
  /** Draft flag — set on duplicated entities until the user saves (DD#294). */
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

const DP = DEFAULT_AGENT_PERMISSIONS;

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
    presenceStatus: 'no_disponible',
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
    defaultOutboundGroup: 'ACD Demo C2CB',
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
    presenceStatus: 'no_disponible',
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
    presenceStatus: 'disponible',
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
    presenceStatus: 'disponible',
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
    presenceStatus: 'disponible',
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
    agentType: 'normal',
    status: 'inactive',
    presenceStatus: 'no_disponible',
    pin: '672',
    permissions: { ...DP },
    pickupType: 'manual',
  },
];

/*
 * DEMO (2026-09-14, Rafa): 500 agentes por defecto, para que la lista enseñe la tabla con scroll propio
 * y lista virtual (DD-95) con un volumen real. Los 16 de arriba conservan sus ids, que usan la
 * membresía de grupos y el catálogo de entidades; los demás repiten sus datos con nombres de Hollywood.
 */
const NOMBRES = ['Nicole', 'Harrison', 'Sandra', 'Will', 'Anne', 'Matt', 'Charlize', 'Ryan', 'Jodie', 'Hugh', 'Julianne', 'Al', 'Halle', 'Johnny', 'Kate', 'Idris', 'Penélope', 'Javier', 'Salma', 'Antonio', 'Zendaya', 'Timothée', 'Margot', 'Pedro', 'Florence'];
const APELLIDOS = ['Kidman', 'Ford', 'Bullock', 'Smith', 'Hathaway', 'Damon', 'Theron', 'Gosling', 'Foster', 'Jackman', 'Moore', 'Pacino', 'Berry', 'Depp', 'Winslet', 'Elba', 'Cruz', 'Bardem', 'Hayek', 'Banderas', 'Coleman', 'Chalamet', 'Robbie', 'Pascal', 'Pugh'];
const TOTAL_AGENTES_DEMO = 500;

const GENERATED_AGENTS: readonly Agent[] = Array.from({ length: TOTAL_AGENTES_DEMO - BASE_AGENTS.length }, (_, i) => {
  const base = BASE_AGENTS[i % BASE_AGENTS.length];
  const id = BASE_AGENTS.length + i + 1;
  return {
    ...base,
    id,
    code: String(10000 + id),
    name: `${NOMBRES[i % NOMBRES.length]} ${APELLIDOS[Math.floor(i / NOMBRES.length) % APELLIDOS.length]}`,
    extension: String(200 + id),
    pin: String(100 + ((id * 37) % 900)),
  };
});

/** Email de demo sacado del nombre («Penélope Cruz» → `penelope.cruz@company.com`), para que ninguno se repita. */
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
  ...BASE_AGENTS.map((a) => ({ ...a, email: a.email ?? demoEmail(a.name) })),
  ...GENERATED_AGENTS.map((a) => ({ ...a, email: demoEmail(a.name) })),
];
