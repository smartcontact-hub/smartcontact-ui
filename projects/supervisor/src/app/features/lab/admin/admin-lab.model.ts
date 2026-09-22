/**
 * LABORATORIO · módulo de administración del Supervisor (grupos y usuarios).
 *
 * Los datos y el vocabulario salen del módulo REAL
 * (`projects/supervisor/src/app/features/admin/{users,groups}/data/`): las 11 secciones,
 * los 5 permisos y los 4 tipos de usuario son los del producto, no inventados. Lo que
 * cambia aquí es la FORMA de repartirlos, según el teardown de Telegram y WhatsApp
 * (`~/Documents/Claude/2026-09 teardown admin usuarios-grupos/SINTESIS.md`).
 *
 * Cada decisión de esta carpeta lleva su código del teardown en el comentario (B4, B12, A1…)
 * para que se pueda discutir una por una sin abrir el informe.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Personas y grupos (semilla del laboratorio)
// ─────────────────────────────────────────────────────────────────────────────

export type LabPersonStatus = 'activo' | 'pausado' | 'pendiente';

export interface LabPerson {
  readonly id: string;
  readonly name: string;
  /** El identificador de acceso. Se fija al CREAR y desaparece al editar (B1). */
  readonly identifier: string;
  readonly email: string;
  /** Puesto, que no es lo mismo que el paquete de permisos. */
  readonly job: string;
  readonly status: LabPersonStatus;
  /** Grupos a los que ya pertenece, por id. */
  readonly groups: readonly string[];
  /** A1 · el tipo ES el paquete, no una etiqueta al lado de 16 casillas sueltas. */
  readonly type: LabUserType;
  /** Secciones y capacidades concedidas, por id. */
  readonly grants: readonly string[];
}

export interface LabGroup {
  readonly id: string;
  readonly name: string;
  /** Se fija al CREAR y ya no se edita (B1): hay vínculos y colas apuntando a él. */
  readonly code: string;
  readonly description: string;
  readonly members: readonly string[];
  /** Permisos concedidos, por id del catálogo de abajo. */
  readonly grants: readonly string[];
  /** Excepciones por persona (B15): `personId:permisoId` → valor. */
  readonly overrides: Readonly<Record<string, boolean>>;
}

const ALL_GROUP_GRANTS = [
  'phone', 'phone.transfer', 'phone.hold', 'phone.record',
  'chat', 'chat.files', 'chat.templates',
  'email', 'email.files', 'email.replyall',
  'typify', 'history',
];

export const LAB_GROUPS: readonly LabGroup[] = [
  {
    id: 'g-atencion', code: 'GRP-001', name: 'Atención general',
    description: 'Primer nivel de entrada', members: ['p-01', 'p-03', 'p-07'],
    grants: ALL_GROUP_GRANTS.filter((g) => g !== 'email.replyall' && g !== 'chat.files'),
    overrides: { 'p-01:m.spy': true },
  },
  {
    id: 'g-soporte', code: 'GRP-002', name: 'Soporte técnico',
    description: 'Incidencias de plataforma', members: ['p-02', 'p-05'],
    grants: ALL_GROUP_GRANTS.filter((g) => !g.startsWith('email') && g !== 'phone.record'),
    overrides: {},
  },
  {
    id: 'g-ventas', code: 'GRP-003', name: 'Ventas',
    description: 'Campañas salientes y alta de clientes', members: ['p-04', 'p-06', 'p-08'],
    grants: ALL_GROUP_GRANTS.filter((g) => !g.startsWith('chat')),
    overrides: {},
  },
  {
    id: 'g-premium', code: 'GRP-004', name: 'Atención premium',
    description: 'Clientes con acuerdo de nivel de servicio', members: ['p-01', 'p-09'],
    grants: ALL_GROUP_GRANTS.filter((g) => g !== 'typify'),
    overrides: {},
  },
  {
    id: 'g-facturacion', code: 'GRP-005', name: 'Facturación',
    description: 'Cobros, abonos y reclamaciones', members: ['p-10'],
    grants: ALL_GROUP_GRANTS.filter((g) => !g.startsWith('phone') && g !== 'history'),
    overrides: {},
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Usuario: el tipo ES el paquete (A1) y las secciones traen la madre real
// ─────────────────────────────────────────────────────────────────────────────

export type LabUserType = 'administrator' | 'supervisor' | 'agent' | 'viewer';

export interface LabUserTypeDef {
  readonly id: LabUserType;
  readonly label: string;
  /** Qué abarca el paquete, en palabras (B13) — donde se elige, no en otra pantalla. */
  readonly detail: string;
}

export const USER_TYPES: readonly LabUserTypeDef[] = [
  { id: 'administrator', label: 'Administrador', detail: 'Todo el Supervisor, incluida la gestión de usuarios y el VUI Designer.' },
  { id: 'supervisor', label: 'Supervisor', detail: 'Opera y mide su centro: conversaciones, campañas, grabaciones y estadísticas. No reparte permisos.' },
  { id: 'agent', label: 'Agente', detail: 'Solo lo suyo: su panel, sus conversaciones y sus servicios.' },
  { id: 'viewer', label: 'Visor', detail: 'Mira y no toca: panel, estadísticas y conversaciones en solo lectura.' },
];

/**
 * Las 11 secciones del Supervisor, con `stats` como madre de sus dos hijas.
 * Copiadas de `users-data.ts` (SECTION_DEFS) con los rótulos de su `es.json`.
 */
export const USER_SECTIONS: readonly PermissionMother[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'services', label: 'Servicios' },
  { id: 'aiNode', label: 'Nodo IA' },
  { id: 'groupsAgentsTypifications', label: 'Grupos / Agentes / Tipificaciones' },
  { id: 'campaigns', label: 'Campañas' },
  { id: 'conversations', label: 'Conversaciones' },
  {
    id: 'stats',
    label: 'Estadísticas',
    children: [
      { id: 'statsDataReports', label: 'Informes de Datos' },
      { id: 'statsFlowAnalyzer', label: 'Analizador de Flujo' },
    ],
  },
  { id: 'vuiDesigner', label: 'VUI Designer' },
  { id: 'users', label: 'Usuarios' },
];

/** Los 5 permisos de capacidad, que NO son secciones (B11: dos planos, no una rejilla). */
export const USER_CAPABILITIES: readonly PermissionLeaf[] = [
  { id: 'vuiDesignerManagement', label: 'Gestión VUI Designer' },
  { id: 'usersManagement', label: 'Gestión de usuarios', detail: 'Da de alta, edita y borra personas. Incluye repartir permisos.' },
  { id: 'recordingManagement', label: 'Gestión de grabaciones' },
  { id: 'transcriptionsManagement', label: 'Gestión de transcripciones' },
  { id: 'spyOnConversations', label: 'Espiar conversaciones' },
];

/**
 * A1 · el tipo ES el paquete. Cada tipo trae encendido lo que trae; elegirlo
 * PRESELECCIONA sus casillas y apartarse se ve («Supervisor · 2 cambios»).
 */
export const TYPE_PACKAGES: Readonly<Record<LabUserType, readonly string[]>> = {
  administrator: [
    'dashboard', 'services', 'aiNode', 'groupsAgentsTypifications', 'campaigns', 'conversations',
    'stats', 'statsDataReports', 'statsFlowAnalyzer', 'vuiDesigner', 'users',
    'vuiDesignerManagement', 'usersManagement', 'recordingManagement', 'transcriptionsManagement', 'spyOnConversations',
  ],
  supervisor: [
    'dashboard', 'services', 'aiNode', 'groupsAgentsTypifications', 'campaigns', 'conversations',
    'stats', 'statsDataReports', 'statsFlowAnalyzer',
    'recordingManagement', 'transcriptionsManagement', 'spyOnConversations',
  ],
  agent: ['dashboard', 'services', 'conversations'],
  viewer: ['dashboard', 'conversations', 'stats', 'statsDataReports'],
};

/** Todos los ids de permiso de un usuario, en orden de pantalla. */
export const ALL_USER_KEYS: readonly string[] = [
  ...USER_SECTIONS.flatMap((s) => [s.id, ...(s.children ?? []).map((c) => c.id)]),
  ...USER_CAPABILITIES.map((c) => c.id),
];

/** Cuántas casillas se apartan del paquete del tipo. A1: apartarse se VE. */
export function driftFromPackage(type: LabUserType, granted: ReadonlySet<string>): number {
  const pack = new Set(TYPE_PACKAGES[type]);
  let drift = 0;
  for (const key of ALL_USER_KEYS) {
    if (pack.has(key) !== granted.has(key)) drift += 1;
  }
  return drift;
}


/* Los correos usan `example.com`, un dominio RESERVADO para ficción (RFC 2606) y por eso
 * exento en `audit:seed-pii`. No los cambies a algo con pinta de real —`@ejemplo.es`,
 * `@empresa.com`—: ese gate existe porque un dato de contacto copiado de una pantalla real
 * y uno inventado se ven exactamente igual. */
export const LAB_PEOPLE: readonly LabPerson[] = [
  { id: 'p-01', name: 'Elena Vidal', identifier: 'evidal', email: 'elena.vidal@example.com', job: 'Coordinadora de turno', status: 'activo', groups: ['g-atencion', 'g-premium'], type: 'supervisor', grants: [...TYPE_PACKAGES.supervisor] },
  { id: 'p-02', name: 'Marc Ferrer', identifier: 'mferrer', email: 'marc.ferrer@example.com', job: 'Técnico de soporte', status: 'activo', groups: ['g-soporte'], type: 'agent', grants: [...TYPE_PACKAGES.agent] },
  { id: 'p-03', name: 'Nadia Bouzid', identifier: 'nbouzid', email: 'nadia.bouzid@example.com', job: 'Agente', status: 'activo', groups: ['g-atencion'], type: 'agent', grants: [...TYPE_PACKAGES.agent] },
  { id: 'p-04', name: 'Tomás Iglesias', identifier: 'tiglesias', email: 'tomas.iglesias@example.com', job: 'Agente de ventas', status: 'pausado', groups: ['g-ventas'], type: 'agent', grants: [...TYPE_PACKAGES.agent] },
  { id: 'p-05', name: 'Júlia Roca', identifier: 'jroca', email: 'julia.roca@example.com', job: 'Técnica de soporte', status: 'activo', groups: ['g-soporte'], type: 'agent', grants: [...TYPE_PACKAGES.agent] },
  { id: 'p-06', name: 'Andrés Pardo', identifier: 'apardo', email: 'andres.pardo@example.com', job: 'Agente de ventas', status: 'activo', groups: ['g-ventas'], type: 'agent', grants: [...TYPE_PACKAGES.agent] },
  { id: 'p-07', name: 'Lucía Serrano', identifier: 'lserrano', email: 'lucia.serrano@example.com', job: 'Agente', status: 'activo', groups: ['g-atencion'], type: 'agent', grants: [...TYPE_PACKAGES.agent] },
  { id: 'p-08', name: 'Iker Mendoza', identifier: 'imendoza', email: 'iker.mendoza@example.com', job: 'Agente de ventas', status: 'pendiente', groups: ['g-ventas'], type: 'agent', grants: [...TYPE_PACKAGES.agent] },
  /* Rosa se aparta de su paquete a propósito: sin Campañas y CON gestión de usuarios. Es el
   * caso que hace visible A1 —«Supervisor · 2 cambios»— ya desde la lista. */
  {
    id: 'p-09', name: 'Rosa Calvet', identifier: 'rcalvet', email: 'rosa.calvet@example.com',
    job: 'Supervisora', status: 'activo', groups: ['g-premium'], type: 'supervisor',
    grants: [...TYPE_PACKAGES.supervisor.filter((k) => k !== 'campaigns'), 'usersManagement'],
  },
  { id: 'p-10', name: 'Hugo Salas', identifier: 'hsalas', email: 'hugo.salas@example.com', job: 'Administrativo', status: 'activo', groups: ['g-facturacion'], type: 'viewer', grants: [...TYPE_PACKAGES.viewer] },
  { id: 'p-11', name: 'Paula Nieto', identifier: 'pnieto', email: 'paula.nieto@example.com', job: 'Agente', status: 'activo', groups: [], type: 'agent', grants: [...TYPE_PACKAGES.agent] },
  { id: 'p-12', name: 'Dani Requena', identifier: 'drequena', email: 'dani.requena@example.com', job: 'Agente', status: 'activo', groups: [], type: 'agent', grants: [...TYPE_PACKAGES.agent] },
];

export const PERSON_BY_ID: ReadonlyMap<string, LabPerson> = new Map(LAB_PEOPLE.map((p) => [p.id, p]));
export const GROUP_BY_ID: ReadonlyMap<string, LabGroup> = new Map(LAB_GROUPS.map((g) => [g.id, g]));

/** Iniciales para el avatar generado. B7: existe desde que hay nombre, no hace falta foto. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// El árbol de permisos, que es el mismo molde para las dos entidades (B4, B12)
// ─────────────────────────────────────────────────────────────────────────────

export interface PermissionLeaf {
  readonly id: string;
  readonly label: string;
  /** Qué abarca, en palabras (B13). Solo donde el rótulo no se explica solo. */
  readonly detail?: string;
  /**
   * Bloqueado y POR QUÉ. B18: bloqueado se ve, pero Telegram no lo anuncia; aquí
   * el motivo es obligatorio para poder marcarlo.
   */
  readonly lockedReason?: string;
}

export interface PermissionMother extends PermissionLeaf {
  readonly children?: readonly PermissionLeaf[];
}

export interface PermissionBlock {
  readonly id: string;
  readonly title: string;
  /** El encabezado en voz de producto: «Los miembros pueden…». */
  readonly lead: string;
  readonly nodes: readonly PermissionMother[];
}

/**
 * PLANO 1 · permisos del GRUPO (B11): lo que puede hacer cualquier agente del grupo.
 *
 * La jerarquía no es decorativa: el canal es la madre y sus capacidades son las hijas,
 * así que apagar «Teléfono» tiene que apagar de verdad «Transferir» — el grupo ya no
 * atiende llamadas. Es la grieta 2 del Supervisor (`stats` apagada con `statsDataReports`
 * viva debajo) puesta del derecho.
 */
export const GROUP_PERMISSIONS: readonly PermissionBlock[] = [
  {
    id: 'canales',
    title: 'Canales que atiende el grupo',
    lead: 'Los agentes de este grupo pueden…',
    nodes: [
      {
        id: 'phone',
        label: 'Atender llamadas',
        children: [
          { id: 'phone.transfer', label: 'Transferir a otro grupo' },
          { id: 'phone.hold', label: 'Poner en espera' },
          { id: 'phone.record', label: 'Grabar bajo demanda' },
        ],
      },
      {
        id: 'chat',
        label: 'Atender chats',
        children: [
          { id: 'chat.files', label: 'Adjuntar ficheros' },
          { id: 'chat.templates', label: 'Usar plantillas de respuesta' },
        ],
      },
      {
        id: 'email',
        label: 'Atender correos',
        children: [
          { id: 'email.files', label: 'Adjuntar ficheros' },
          { id: 'email.replyall', label: 'Responder a todos' },
        ],
      },
    ],
  },
  {
    id: 'conversacion',
    title: 'Sobre la conversación',
    lead: 'Además, en cualquier canal…',
    nodes: [
      { id: 'typify', label: 'Tipificar al cerrar', detail: 'Obliga a elegir una tipificación antes de dar la conversación por cerrada.' },
      { id: 'history', label: 'Ver el histórico del contacto' },
      {
        id: 'owner',
        label: 'Cambiar el propietario del grupo',
        detail: 'Solo lo hace quien creó el grupo.',
        lockedReason: 'Solo el propietario del grupo puede moverlo. Tú eres Supervisora.',
      },
    ],
  },
];

/**
 * PLANO 2 · permisos de una PERSONA dentro del grupo (B11). Lista distinta a propósito:
 * qué se puede hacer EN el grupo no es lo mismo que qué puede hacer ESTA persona.
 */
export const MEMBER_PERMISSIONS: readonly PermissionLeaf[] = [
  { id: 'm.spy', label: 'Espiar conversaciones del grupo' },
  { id: 'm.recordings', label: 'Escuchar grabaciones' },
  { id: 'm.reports', label: 'Sacar informes del grupo' },
  { id: 'm.members', label: 'Añadir y quitar miembros' },
];

/** El permiso por defecto de un miembro, del que cada persona se puede apartar (B15). */
export const MEMBER_DEFAULTS: Readonly<Record<string, boolean>> = {
  'm.spy': false,
  'm.recordings': false,
  'm.reports': true,
  'm.members': false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers del árbol (madre/hijas) — la regla de B12 en UN solo sitio
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apagar la madre apaga las hijas DE VERDAD, las deja visibles, y reencenderla
 * las enciende TODAS (B12). No recuerda: lo que se ve es siempre lo que se guarda.
 *
 * `modoHoy` reproduce la grieta 2 del Supervisor a propósito, para poder verla al lado:
 * la madre cambia sola y el valor de las hijas sigue guardado debajo.
 */
export function toggleMother(
  granted: ReadonlySet<string>,
  mother: PermissionMother,
  next: boolean,
  modoHoy = false,
): Set<string> {
  const out = new Set(granted);
  if (next) out.add(mother.id);
  else out.delete(mother.id);

  if (modoHoy) return out;

  for (const child of mother.children ?? []) {
    if (next) out.add(child.id);
    else out.delete(child.id);
  }
  return out;
}

/** Marca o desmarca una hija; encender una hija enciende a su madre (no hay huérfanas). */
export function toggleChild(
  granted: ReadonlySet<string>,
  mother: PermissionMother,
  childId: string,
  next: boolean,
): Set<string> {
  const out = new Set(granted);
  if (next) {
    out.add(childId);
    out.add(mother.id);
  } else {
    out.delete(childId);
  }
  return out;
}

/** «7/9» de una lista de nodos: cuenta madres e hijas, que es lo que el usuario ve. */
export function countOf(nodes: readonly PermissionMother[], granted: ReadonlySet<string>): { on: number; total: number } {
  let on = 0;
  let total = 0;
  for (const node of nodes) {
    total += 1;
    if (granted.has(node.id)) on += 1;
    for (const child of node.children ?? []) {
      total += 1;
      if (granted.has(child.id)) on += 1;
    }
  }
  return { on, total };
}

/** El contador vivo de una madre con hijas: «Atender llamadas 3/3». */
export function motherCount(mother: PermissionMother, granted: ReadonlySet<string>): string | null {
  const children = mother.children ?? [];
  if (children.length === 0) return null;
  const on = children.filter((c) => granted.has(c.id)).length;
  return `${on}/${children.length}`;
}

/**
 * Plural en llano: «1 canal», «3 canales». Los «(s)» de una primera pasada se leen como
 * plantilla sin rellenar, y esta pantalla se enseña para decidir sobre su copy.
 */
export function plural(n: number, one: string, many: string): string {
  return n + ' ' + (n === 1 ? one : many);
}
