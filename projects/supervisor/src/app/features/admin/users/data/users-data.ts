export type UserType = 'administrator' | 'supervisor' | 'agent' | 'viewer';

export const USER_TYPES: readonly UserType[] = ['administrator', 'supervisor', 'agent', 'viewer'];

export const USER_TYPE_LABEL_KEYS: Readonly<Record<UserType, string>> = {
  administrator: 'users.type.administrator',
  supervisor: 'users.type.supervisor',
  agent: 'users.type.agent',
  viewer: 'users.type.viewer',
};

export interface UserSections {
  readonly dashboard: boolean;
  readonly services: boolean;
  readonly aiNode: boolean;
  readonly groupsAgentsTypifications: boolean;
  readonly campaigns: boolean;
  readonly conversations: boolean;
  readonly stats: boolean;
  readonly statsDataReports: boolean;
  readonly statsFlowAnalyzer: boolean;
  readonly vuiDesigner: boolean;
  readonly users: boolean;
}

export const DEFAULT_SECTIONS: UserSections = {
  dashboard: true,
  services: true,
  aiNode: true,
  groupsAgentsTypifications: true,
  campaigns: true,
  conversations: true,
  stats: true,
  statsDataReports: true,
  statsFlowAnalyzer: true,
  vuiDesigner: true,
  users: true,
};

export interface SectionDef {
  readonly key: keyof UserSections;
  readonly labelKey: string;
  readonly parent?: keyof UserSections;
}

export const SECTION_DEFS: readonly SectionDef[] = [
  { key: 'dashboard', labelKey: 'users.section.dashboard' },
  { key: 'services', labelKey: 'users.section.services' },
  { key: 'aiNode', labelKey: 'users.section.ai_node' },
  { key: 'groupsAgentsTypifications', labelKey: 'users.section.groups_agents_typifications' },
  { key: 'campaigns', labelKey: 'users.section.campaigns' },
  { key: 'conversations', labelKey: 'users.section.conversations' },
  { key: 'stats', labelKey: 'users.section.stats' },
  { key: 'statsDataReports', labelKey: 'users.section.stats_data_reports', parent: 'stats' },
  { key: 'statsFlowAnalyzer', labelKey: 'users.section.stats_flow_analyzer', parent: 'stats' },
  { key: 'vuiDesigner', labelKey: 'users.section.vui_designer' },
  { key: 'users', labelKey: 'users.section.users' },
];

export interface UserPermissions {
  readonly vuiDesignerManagement: boolean;
  readonly usersManagement: boolean;
  readonly recordingManagement: boolean;
  readonly transcriptionsManagement: boolean;
  readonly spyOnConversations: boolean;
}

export const DEFAULT_PERMISSIONS: UserPermissions = {
  vuiDesignerManagement: true,
  usersManagement: true,
  recordingManagement: true,
  transcriptionsManagement: true,
  spyOnConversations: true,
};

export interface PermissionDef {
  readonly key: keyof UserPermissions;
  readonly labelKey: string;
}

export const PERMISSION_DEFS: readonly PermissionDef[] = [
  { key: 'vuiDesignerManagement', labelKey: 'users.permission.vui_designer_management' },
  { key: 'usersManagement', labelKey: 'users.permission.users_management' },
  { key: 'recordingManagement', labelKey: 'users.permission.recording_management' },
  { key: 'transcriptionsManagement', labelKey: 'users.permission.transcriptions_management' },
  { key: 'spyOnConversations', labelKey: 'users.permission.spy_on_conversations' },
];

export interface User {
  readonly id: number;
  readonly code: string;
  readonly name: string;
  readonly email: string;
  readonly identifier: string;
  readonly type: UserType;
  readonly photo?: string;
  readonly sections: UserSections;
  readonly permissions: UserPermissions;
  readonly assignedGroups: readonly number[];
  readonly assignedServices: readonly string[];
  readonly status: 'active' | 'inactive';
  readonly createdAt: string;
  /** Draft flag — set on duplicated entities (DD#294 in the React prototype). */
}

export const AVAILABLE_SERVICES: readonly string[] = [
  'Atención general',
  'Soporte técnico',
  'Ventas',
  'Facturación',
  'Incidencias',
  'Atención premium',
  'Campañas outbound',
  'Help desk',
];

export const USERS_SEED: readonly User[] = [
  {
    id: 1,
    code: 'U001',
    name: 'Mario Supervisor',
    email: 'mario.supervisor@empresa.com',
    identifier: 'MSUP001',
    type: 'administrator',
    sections: { ...DEFAULT_SECTIONS },
    permissions: { ...DEFAULT_PERMISSIONS },
    assignedGroups: [1, 2, 3],
    assignedServices: ['Atención general', 'Soporte técnico'],
    status: 'active',
    createdAt: '2025-06-15',
  },
  {
    id: 2,
    code: 'U002',
    name: 'Laura Martínez',
    email: 'laura.martinez@empresa.com',
    identifier: 'LMAR002',
    type: 'supervisor',
    sections: { ...DEFAULT_SECTIONS, vuiDesigner: false, users: false },
    permissions: { ...DEFAULT_PERMISSIONS, vuiDesignerManagement: false, usersManagement: false },
    assignedGroups: [1, 4],
    assignedServices: ['Atención general', 'Ventas'],
    status: 'active',
    createdAt: '2025-07-20',
  },
  {
    id: 3,
    code: 'U003',
    name: 'Carlos García',
    email: 'carlos.garcia@empresa.com',
    identifier: 'CGAR003',
    type: 'supervisor',
    sections: { ...DEFAULT_SECTIONS, aiNode: false, vuiDesigner: false, users: false },
    permissions: {
      vuiDesignerManagement: false,
      usersManagement: false,
      recordingManagement: true,
      transcriptionsManagement: false,
      spyOnConversations: true,
    },
    assignedGroups: [2, 3, 5],
    assignedServices: ['Soporte técnico', 'Incidencias'],
    status: 'active',
    createdAt: '2025-08-10',
  },
  {
    id: 4,
    code: 'U004',
    name: 'Ana López',
    email: 'ana.lopez@empresa.com',
    identifier: 'ALOP004',
    type: 'viewer',
    sections: {
      ...DEFAULT_SECTIONS,
      aiNode: false,
      campaigns: false,
      vuiDesigner: false,
      users: false,
      groupsAgentsTypifications: false,
    },
    permissions: {
      vuiDesignerManagement: false,
      usersManagement: false,
      recordingManagement: false,
      transcriptionsManagement: false,
      spyOnConversations: false,
    },
    assignedGroups: [1],
    assignedServices: ['Atención general'],
    status: 'active',
    createdAt: '2025-09-05',
  },
  {
    id: 5,
    code: 'U005',
    name: 'Roberto Sánchez',
    email: 'roberto.sanchez@empresa.com',
    identifier: 'RSAN005',
    type: 'administrator',
    sections: { ...DEFAULT_SECTIONS },
    permissions: { ...DEFAULT_PERMISSIONS },
    assignedGroups: [1, 2, 3, 4, 5],
    assignedServices: ['Atención general', 'Soporte técnico', 'Ventas', 'Facturación'],
    status: 'inactive',
    createdAt: '2025-10-12',
  },
  {
    id: 6,
    code: 'U006',
    name: 'Elena Torres',
    email: 'elena.torres@empresa.com',
    identifier: 'ETOR006',
    type: 'supervisor',
    sections: { ...DEFAULT_SECTIONS, vuiDesigner: false },
    permissions: { ...DEFAULT_PERMISSIONS, vuiDesignerManagement: false },
    assignedGroups: [3, 4],
    assignedServices: ['Campañas outbound', 'Ventas'],
    status: 'active',
    createdAt: '2025-11-01',
  },
];
