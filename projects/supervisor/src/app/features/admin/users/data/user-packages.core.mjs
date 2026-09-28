/**
 * QUÉ TRAE CADA TIPO DE USUARIO (DD-132). Puro: lo usan la ficha y el listado de usuarios, y sus pruebas
 * (`scripts/__tests__/user-packages.test.mjs`, en `test:unit`).
 *
 * Los tipos y lo que ve y gestiona cada uno salen del documento de producto de usuarios y grupos (la matriz de
 * permisos por rol) y de los perfiles del manual de usuario de Voice; lo que el documento no reparte lo decidió
 * producto (2026-09-28): la supervisión la ven los cuatro, y lo sensible (grabaciones, transcripciones, espiar)
 * se marca a mano, salvo en Superadmin.
 *
 * El tipo ES una plantilla: elegirlo marca sus casillas, y apartarse de ella se ve («· 2 cambios»). Las casillas
 * siguen siendo del usuario: la plantilla no restringe nada por sí sola.
 */

/** Del que más puede al que menos: es el orden del desplegable. */
export const USER_TYPES = ['superadmin', 'administrator', 'supervisorOnline', 'supervisorOffline'];

/**
 * Lo guardado con los tipos de antes (`supervisor`, `viewer`, `agent`) se lee como Supervisor Offline, el de menos
 * privilegio, que según el documento «se queda igual». «Agente» deja de ser un tipo de usuario: los agentes tienen
 * su propia ficha.
 */
const LEGACY_TYPE = 'supervisorOffline';

/** Las secciones que enseña la ficha, en el orden del menú: Supervisión, VUI Designer, Administración, Configuración. */
export const SECTION_KEYS = [
  'dashboard',
  'services',
  'aiNode',
  'typifications',
  'campaigns',
  'conversations',
  'stats',
  'statsDataReports',
  'statsFlowAnalyzer',
  'vuiDesigner',
  'users',
  'groups',
  'agents',
  'repositories',
  'aed',
  'system',
];

/**
 * Siguen en el modelo, pero la ficha no las enseña. `groupsAgentsTypifications` juntaba tres destinos que el menú
 * de hoy separa (Grupos y Agentes en Administración, Tipificaciones en Supervisión): cada uno tiene ya su casilla.
 * Lo guardado en ella se conserva y no concede nada nuevo.
 */
export const HIDDEN_SECTION_KEYS = ['groupsAgentsTypifications'];

/** Lo que puede HACER, en el mismo orden que las secciones que gestiona; lo sensible, al final. */
export const PERMISSION_KEYS = [
  'vuiDesignerManagement',
  'usersManagement',
  'groupsManagement',
  'agentsManagement',
  'repositoriesManagement',
  'aedManagement',
  'recordingManagement',
  'transcriptionsManagement',
  'spyOnConversations',
];

const SUPERVISION = [
  'dashboard',
  'services',
  'aiNode',
  'typifications',
  'campaigns',
  'conversations',
  'stats',
  'statsDataReports',
  'statsFlowAnalyzer',
];
const ADMIN_AREAS = ['groups', 'agents', 'repositories'];
const ADMIN_MANAGEMENT = ['groupsManagement', 'agentsManagement', 'repositoriesManagement'];

/** Lo que trae marcado cada tipo. Lo que no nombra, sale apagado. */
export const TYPE_PACKAGES = {
  superadmin: { sections: [...SECTION_KEYS], permissions: [...PERMISSION_KEYS] },
  administrator: {
    sections: [...SUPERVISION, 'vuiDesigner', 'users', ...ADMIN_AREAS, 'aed'],
    permissions: ['vuiDesignerManagement', 'usersManagement', ...ADMIN_MANAGEMENT, 'aedManagement'],
  },
  supervisorOnline: { sections: [...SUPERVISION, ...ADMIN_AREAS], permissions: [...ADMIN_MANAGEMENT] },
  supervisorOffline: { sections: [...SUPERVISION], permissions: [] },
};

/**
 * LA ÚNICA VÍA DE LECTURA de un usuario guardado: su tipo entre los cuatro, y todas sus casillas presentes. Una que
 * no guardó (las que llegaron después) se lee apagada, sin deducirla de otra: mínimo privilegio (DD-130). El resto
 * del usuario pasa tal cual.
 * @template {{ type: string, sections?: Record<string, boolean>, permissions?: Record<string, boolean> }} U
 * @param {U} user
 */
export function resolveUserAccess(user) {
  const type = USER_TYPES.includes(user.type) ? user.type : LEGACY_TYPE;
  const read = (keys, saved) => Object.fromEntries(keys.map((k) => [k, saved?.[k] === true]));
  return {
    ...user,
    type,
    sections: read([...SECTION_KEYS, ...HIDDEN_SECTION_KEYS], user.sections),
    permissions: read(PERMISSION_KEYS, user.permissions),
  };
}

/**
 * Las casillas de un tipo: marca justo su plantilla en lo que la ficha enseña y deja lo demás como estaba.
 * @param {string} type
 * @param {Record<string, boolean>} sections
 * @param {Record<string, boolean>} permissions
 */
export function applyPackage(type, sections, permissions) {
  const pack = TYPE_PACKAGES[type];
  const nextSections = { ...sections };
  for (const k of SECTION_KEYS) nextSections[k] = pack.sections.includes(k);
  const nextPermissions = { ...permissions };
  for (const k of PERMISSION_KEYS) nextPermissions[k] = pack.permissions.includes(k);
  return { sections: nextSections, permissions: nextPermissions };
}

/**
 * Cuántas casillas VISIBLES se apartan de la plantilla del tipo. Es también lo que cambiaría al aplicarla.
 * @param {string} type
 * @param {Record<string, boolean>} sections
 * @param {Record<string, boolean>} permissions
 */
export function driftFromPackage(type, sections, permissions) {
  const pack = TYPE_PACKAGES[type];
  let drift = 0;
  for (const k of SECTION_KEYS) if ((sections[k] === true) !== pack.sections.includes(k)) drift += 1;
  for (const k of PERMISSION_KEYS) if ((permissions[k] === true) !== pack.permissions.includes(k)) drift += 1;
  return drift;
}
