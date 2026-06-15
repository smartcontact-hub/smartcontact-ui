export type GroupPriority = 'Baja' | 'Media' | 'Alta' | 'Máxima';
export type GroupChannel = 'phone' | 'chat' | 'email';
export type CapacityType = 'fixed' | 'variable';

export const GROUP_PRIORITIES: readonly GroupPriority[] = ['Baja', 'Media', 'Alta', 'Máxima'];
export const GROUP_CHANNELS: readonly GroupChannel[] = ['phone', 'chat', 'email'];

export const PRIORITY_LABEL_KEYS: Readonly<Record<GroupPriority, string>> = {
  Baja: 'groups.priority.low',
  Media: 'groups.priority.medium',
  Alta: 'groups.priority.high',
  Máxima: 'groups.priority.max',
};

export const CHANNEL_LABEL_KEYS: Readonly<Record<GroupChannel, string>> = {
  phone: 'groups.channel.phone',
  chat: 'groups.channel.chat',
  email: 'groups.channel.email',
};

export const PHONE_STRATEGIES: readonly string[] = [
  'Balanceada',
  'Lineal',
  'Niveles',
  'Ring All',
  'Agente exclusivo',
];

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
  readonly typification: boolean;
  readonly channels: readonly GroupChannel[];
  readonly strategy: string;
  readonly chatStrategy?: string;
  readonly capacityType?: CapacityType;
  readonly capacityValue?: number;
  readonly labels?: readonly number[];
  readonly templates?: readonly number[];
  /** Tiered fallback (Niveles strategy). Each row is one level. */
  readonly levels?: readonly (readonly string[])[];
  readonly subStrategy?: string;
  readonly ringAllAgents?: number;
  readonly services?: readonly string[];
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
    typification: false,
    channels: ['phone'],
    strategy: 'Balanceada',
    capacityType: 'fixed',
    capacityValue: 5,
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
    typification: false,
    channels: ['phone', 'email'],
    strategy: 'Balanceada',
    capacityType: 'fixed',
    capacityValue: 10,
    services: ['Atención general'],
  },
  {
    id: 3,
    code: '20003',
    name: 'ACD outbound',
    phone: '918371548',
    priority: 'Baja',
    typification: true,
    channels: ['phone'],
    strategy: 'Balanceada',
    capacityType: 'variable',
    capacityValue: 3,
    services: ['Campañas salientes'],
    schedules: [1],
  },
  {
    id: 4,
    code: '20004',
    name: 'Campaigns',
    phone: '917945449',
    priority: 'Baja',
    typification: false,
    channels: ['phone'],
    strategy: 'Lineal',
    services: ['Campañas salientes', 'Telemarketing VUI'],
  },
  {
    id: 5,
    code: '20005',
    name: 'Exclusivo',
    phone: '918371548',
    priority: 'Máxima',
    typification: false,
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
    typification: false,
    channels: ['phone'],
    strategy: 'Balanceada',
  },
  {
    id: 7,
    code: '20007',
    name: 'Grupo de prueba 2',
    phone: '917945449',
    priority: 'Baja',
    typification: false,
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
    typification: true,
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
    typification: true,
    channels: ['phone'],
    strategy: 'Niveles',
    levels: [
      ['Agente AED 1', 'Agente AED 2', 'Agente demo', 'Agente Jose', 'Jose Barcala'],
      ['Mario Perez', 'Inés Recio', 'Miguel Palacios', 'Miguel Palacios 3'],
    ],
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
    typification: false,
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
    typification: false,
    channels: ['phone', 'chat', 'email'],
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
    typification: true,
    channels: ['phone', 'chat'],
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
    typification: false,
    channels: ['phone', 'chat'],
    strategy: 'Lineal',
    chatStrategy: 'Menos chats activos',
    services: ['Soporte taller', 'Averías'],
  },
  {
    id: 14,
    code: '20014',
    name: 'Telemarketing',
    phone: '918371548',
    priority: 'Baja',
    typification: false,
    channels: ['phone'],
    strategy: 'Balanceada',
    services: ['Telemarketing VUI'],
  },
];
