import {
  applyPackage,
  type PermissionKey,
  type PermissionRecord,
  type SectionKey,
  type SectionRecord,
  USER_TYPES as PACKAGE_USER_TYPES,
  type UserType as PackageUserType,
} from './user-packages.core.mjs';

/**
 * Los cuatro tipos del documento de producto de usuarios y grupos, del que más puede al que menos (DD-132). Cada
 * uno trae su plantilla de acceso (`user-packages.core.mjs`); lo guardado con los tipos de antes se lee con
 * `resolveUserAccess` (Supervisor, Visor y Agente pasan a Supervisor Offline).
 */
export type UserType = PackageUserType;

export const USER_TYPES: readonly UserType[] = PACKAGE_USER_TYPES;

export const USER_TYPE_LABEL_KEYS: Readonly<Record<UserType, string>> = {
  superadmin: 'users.type.superadmin',
  administrator: 'users.type.administrator',
  supervisorOnline: 'users.type.supervisor_online',
  supervisorOffline: 'users.type.supervisor_offline',
};

/** Lo que VE: una casilla por destino del menú, más la de antes que ya no se enseña (`groupsAgentsTypifications`). */
export type UserSections = SectionRecord;

/** Lo que puede HACER. */
export type UserPermissions = PermissionRecord;

export interface SectionDef {
  readonly key: SectionKey;
  readonly labelKey: string;
  readonly parent?: SectionKey;
}

/**
 * Las secciones de la ficha, en el orden del menú: Supervisión, VUI Designer, Administración y Configuración.
 * «Grupos / Agentes / Tipificaciones» era UNA casilla para tres destinos que el menú de hoy separa; cada uno tiene
 * la suya y la vieja sigue en el modelo, sin enseñarse (DD-132).
 */
export const SECTION_DEFS: readonly SectionDef[] = [
  { key: 'dashboard', labelKey: 'users.section.dashboard' },
  { key: 'services', labelKey: 'users.section.services' },
  { key: 'aiNode', labelKey: 'users.section.ai_node' },
  { key: 'typifications', labelKey: 'users.section.typifications' },
  { key: 'campaigns', labelKey: 'users.section.campaigns' },
  { key: 'conversations', labelKey: 'users.section.conversations' },
  { key: 'stats', labelKey: 'users.section.stats' },
  { key: 'statsDataReports', labelKey: 'users.section.stats_data_reports', parent: 'stats' },
  { key: 'statsFlowAnalyzer', labelKey: 'users.section.stats_flow_analyzer', parent: 'stats' },
  { key: 'vuiDesigner', labelKey: 'users.section.vui_designer' },
  { key: 'users', labelKey: 'users.section.users' },
  { key: 'groups', labelKey: 'users.section.groups' },
  { key: 'agents', labelKey: 'users.section.agents' },
  { key: 'repositories', labelKey: 'users.section.repositories' },
  { key: 'aed', labelKey: 'users.section.aed' },
  { key: 'system', labelKey: 'users.section.system' },
];

export interface PermissionDef {
  readonly key: PermissionKey;
  readonly labelKey: string;
}

/** En el orden de las secciones que gestionan; lo sensible (grabaciones, transcripciones, espiar), al final. */
export const PERMISSION_DEFS: readonly PermissionDef[] = [
  { key: 'vuiDesignerManagement', labelKey: 'users.permission.vui_designer_management' },
  { key: 'usersManagement', labelKey: 'users.permission.users_management' },
  { key: 'groupsManagement', labelKey: 'users.permission.groups_management' },
  { key: 'agentsManagement', labelKey: 'users.permission.agents_management' },
  { key: 'repositoriesManagement', labelKey: 'users.permission.repositories_management' },
  { key: 'aedManagement', labelKey: 'users.permission.aed_management' },
  { key: 'recordingManagement', labelKey: 'users.permission.recording_management' },
  { key: 'transcriptionsManagement', labelKey: 'users.permission.transcriptions_management' },
  { key: 'spyOnConversations', labelKey: 'users.permission.spy_on_conversations' },
];

/** Todo apagado, también la casilla que ya no se enseña. Es la base sobre la que se aplica una plantilla. */
export const EMPTY_SECTIONS: UserSections = {
  dashboard: false,
  services: false,
  aiNode: false,
  typifications: false,
  campaigns: false,
  conversations: false,
  stats: false,
  statsDataReports: false,
  statsFlowAnalyzer: false,
  vuiDesigner: false,
  users: false,
  groups: false,
  agents: false,
  repositories: false,
  aed: false,
  system: false,
  groupsAgentsTypifications: false,
};

export const EMPTY_PERMISSIONS: UserPermissions = {
  vuiDesignerManagement: false,
  usersManagement: false,
  groupsManagement: false,
  agentsManagement: false,
  repositoriesManagement: false,
  aedManagement: false,
  recordingManagement: false,
  transcriptionsManagement: false,
  spyOnConversations: false,
};

/** Un usuario NUEVO nace Supervisor Offline, el tipo de menos privilegio, con su plantilla (DD-132, enmienda
 *  DD-130 §4): ve la supervisión y nada de lo sensible. */
export const NEW_USER_TYPE: UserType = 'supervisorOffline';

/** Las casillas de un tipo: su plantilla sobre todo apagado, y los cambios a mano que se le pidan encima. */
export function accessFor(
  type: UserType,
  changes: { readonly sections?: Partial<Record<SectionKey, boolean>>; readonly permissions?: Partial<Record<PermissionKey, boolean>> } = {},
): { sections: UserSections; permissions: UserPermissions } {
  const base = applyPackage(type, EMPTY_SECTIONS, EMPTY_PERMISSIONS);
  return {
    sections: { ...base.sections, ...changes.sections },
    permissions: { ...base.permissions, ...changes.permissions },
  };
}

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

/**
 * Los usuarios de ejemplo, cada uno con su tipo y su plantilla (DD-132). U001, el de la barra de arriba, es
 * Superadmin. Tres siguen su plantilla tal cual y tres llevan cambios a mano, para que el desvío se vea.
 */
export const USERS_SEED: readonly User[] = [
  {
    id: 1,
    code: 'U001',
    name: 'Mario Supervisor',
    email: 'mario.supervisor@empresa.com',
    identifier: 'MSUP001',
    type: 'superadmin',
    ...accessFor('superadmin'),
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
    type: 'supervisorOnline',
    // Un cambio a mano sobre la plantilla: gestiona grabaciones.
    ...accessFor('supervisorOnline', { permissions: { recordingManagement: true } }),
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
    type: 'supervisorOffline',
    // Tres cambios a mano: sin Nodo IA, y con grabaciones y espiar.
    ...accessFor('supervisorOffline', {
      sections: { aiNode: false },
      permissions: { recordingManagement: true, spyOnConversations: true },
    }),
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
    type: 'supervisorOffline',
    // Dos cambios a mano: sin Nodo IA ni Campañas.
    ...accessFor('supervisorOffline', { sections: { aiNode: false, campaigns: false } }),
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
    ...accessFor('administrator'),
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
    type: 'supervisorOnline',
    ...accessFor('supervisorOnline'),
    assignedGroups: [3, 4],
    assignedServices: ['Campañas outbound', 'Ventas'],
    status: 'active',
    createdAt: '2025-11-01',
  },
];
