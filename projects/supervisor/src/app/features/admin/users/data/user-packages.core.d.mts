/** Tipos de lo que trae cada tipo de usuario (la lógica vive en `user-packages.core.mjs`). */
export type UserType = 'superadmin' | 'administrator' | 'supervisorOnline' | 'supervisorOffline';

export type SectionKey =
  | 'dashboard'
  | 'services'
  | 'aiNode'
  | 'typifications'
  | 'campaigns'
  | 'conversations'
  | 'stats'
  | 'statsDataReports'
  | 'statsFlowAnalyzer'
  | 'vuiDesigner'
  | 'users'
  | 'groups'
  | 'agents'
  | 'repositories'
  | 'aed'
  | 'system';

export type HiddenSectionKey = 'groupsAgentsTypifications';

export type PermissionKey =
  | 'vuiDesignerManagement'
  | 'usersManagement'
  | 'groupsManagement'
  | 'agentsManagement'
  | 'repositoriesManagement'
  | 'aedManagement'
  | 'recordingManagement'
  | 'transcriptionsManagement'
  | 'spyOnConversations';

export type SectionRecord = Readonly<Record<SectionKey | HiddenSectionKey, boolean>>;
export type PermissionRecord = Readonly<Record<PermissionKey, boolean>>;

export const USER_TYPES: readonly UserType[];
export const SECTION_KEYS: readonly SectionKey[];
export const HIDDEN_SECTION_KEYS: readonly HiddenSectionKey[];
export const PERMISSION_KEYS: readonly PermissionKey[];
export const TYPE_PACKAGES: Readonly<
  Record<UserType, { readonly sections: readonly SectionKey[]; readonly permissions: readonly PermissionKey[] }>
>;

export function resolveUserAccess<
  U extends { readonly type: string; readonly sections?: Partial<Record<string, boolean>>; readonly permissions?: Partial<Record<string, boolean>> },
>(user: U): Omit<U, 'type' | 'sections' | 'permissions'> & { type: UserType; sections: SectionRecord; permissions: PermissionRecord };

export function applyPackage(
  type: UserType,
  sections: SectionRecord,
  permissions: PermissionRecord,
): { sections: SectionRecord; permissions: PermissionRecord };

export function driftFromPackage(type: UserType, sections: SectionRecord, permissions: PermissionRecord): number;
