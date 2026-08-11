/**
 * Datos de ejemplo de CusCare.
 *
 * ⚠️ TODO INVENTADO. El sitio real muestra PII de clientes reales (teléfonos,
 * emails, IPs); nada de eso se copia aquí. Lo que SÍ se replica es la FORMA de
 * los datos —longitudes, formatos, distribución de estados y de productos— para
 * que las columnas midan y el layout respire igual que en la app real.
 */

export type TicketStatus = 'open' | 'resolved' | 'pending' | 'closed';
export type TicketChannel = 'call' | 'chat' | 'mail';

export interface TicketRow {
  readonly id: string;
  readonly status: TicketStatus;
  readonly assignedTo: string;
  readonly group: string;
  readonly channel: TicketChannel;
  readonly source: string;
  readonly email: string;
  readonly country: string;
  readonly countryFlag: string;
  readonly products: readonly string[];
  readonly created: string;
  readonly updated: string;
  readonly description: string;
  readonly priority: string;
  readonly subStatus: string;
  readonly refund: string;
  readonly gdpr: string;
  readonly carrier: string;
  /** Columna del real; vacía en todas las filas de ejemplo. */
  readonly moErrorContent?: string;
  /** Fila bloqueada por otro agente (candado rojo en la real). */
  readonly locked?: boolean;
}

/** Catálogo de productos (nombres inventados con la misma cadencia que los reales). */
const PRODUCTS = [
  'Playweez',
  'Canaltv',
  'itrip',
  'UnlimitedVideos',
  'Clicnscore',
  'TopmusicTv',
  'Trendly',
  'Fuzeforge',
];

export const TICKETS: readonly TicketRow[] = [
  {
    id: '2050617',
    status: 'open',
    assignedTo: 'LATAM Agent 1 - Aleja',
    group: 'ES - DOD',
    channel: 'call',
    source: '34600111222',
    email: '',
    country: 'Spain',
    countryFlag: '🇪🇸',
    products: ['Playweez', 'Canaltv'],
    created: '11-08-2026 09:14',
    updated: '11-08-2026 09:20',
    description: '-',
    priority: 'Medium',
    subStatus: '-',
    refund: '-',
    gdpr: '-',
    carrier: 'Orange',
    locked: true,
  },
  {
    id: '2050567',
    status: 'resolved',
    assignedTo: 'ES Agent - M. Angeles',
    group: 'ES - DOD',
    channel: 'call',
    source: '34600222333',
    email: '',
    country: 'Spain',
    countryFlag: '🇪🇸',
    products: ['Playweez', 'itrip'],
    created: '11-08-2026 08:02',
    updated: '11-08-2026 08:41',
    description: '-',
    priority: 'Low',
    subStatus: '-',
    refund: '-',
    gdpr: '-',
    carrier: 'Orange',
  },
  {
    id: '2050563',
    status: 'resolved',
    assignedTo: 'LATAM Agent 1 - Aleja',
    group: 'ES - DOD',
    channel: 'call',
    source: '34600333444',
    email: '',
    country: 'Spain',
    countryFlag: '🇪🇸',
    products: ['Canaltv', 'UnlimitedVideos'],
    created: '10-08-2026 17:35',
    updated: '10-08-2026 17:52',
    description: '-',
    priority: 'Low',
    subStatus: '-',
    refund: '-',
    gdpr: '-',
    carrier: 'Movistar',
  },
  {
    id: '2050559',
    status: 'resolved',
    assignedTo: 'ES Agent - M. Angeles',
    group: 'ES - DOD',
    channel: 'call',
    source: '34600444555',
    email: '',
    country: 'Spain',
    countryFlag: '🇪🇸',
    products: ['UnlimitedVideos', 'Trendly_ES_Orange_W'],
    created: '10-08-2026 16:10',
    updated: '10-08-2026 16:44',
    description: '-',
    priority: 'Medium',
    subStatus: '-',
    refund: '-',
    gdpr: '-',
    carrier: 'Orange',
  },
  {
    id: '2050547',
    status: 'resolved',
    assignedTo: 'ES Agent - M. Angeles',
    group: 'ES - DOD',
    channel: 'call',
    source: '34600555666',
    email: '',
    country: 'Spain',
    countryFlag: '🇪🇸',
    products: ['itrip', 'Clicnscore', 'TopmusicTv', 'Canaltv'],
    created: '10-08-2026 12:22',
    updated: '10-08-2026 13:01',
    description: '-',
    priority: 'High',
    subStatus: '-',
    refund: '-',
    gdpr: '-',
    carrier: 'Vodafone',
  },
  {
    id: '2050542',
    status: 'resolved',
    assignedTo: 'LATAM Agent 1 - Aleja',
    group: 'ES - DOD',
    channel: 'call',
    source: '34600666777',
    email: '',
    country: 'Spain',
    countryFlag: '🇪🇸',
    products: ['Clicnscore', 'Playweez'],
    created: '09-08-2026 19:03',
    updated: '09-08-2026 19:18',
    description: '-',
    priority: 'Low',
    subStatus: '-',
    refund: '-',
    gdpr: '-',
    carrier: 'Orange',
  },
  {
    id: '2050493',
    status: 'resolved',
    assignedTo: 'LATAM Agent 2 - Karen',
    group: 'ES - DOD',
    channel: 'call',
    source: '34600777888',
    email: '',
    country: 'Spain',
    countryFlag: '🇪🇸',
    products: ['fuzeforge_spain_orange_mo', 'itrip'],
    created: '09-08-2026 11:47',
    updated: '09-08-2026 12:05',
    description: '-',
    priority: 'Medium',
    subStatus: '-',
    refund: '-',
    gdpr: '-',
    carrier: 'Orange',
  },
  {
    id: '2048152',
    status: 'pending',
    assignedTo: 'LATAM Agent 1 - Aleja',
    group: 'ES - DOD',
    channel: 'call',
    source: '34600888999',
    email: 'persona.ejemplo@example.com',
    country: 'Spain',
    countryFlag: '🇪🇸',
    products: ['Trendly'],
    created: '08-08-2026 15:29',
    updated: '08-08-2026 16:02',
    description: '-',
    priority: 'Low',
    subStatus: '-',
    refund: '-',
    gdpr: '-',
    carrier: 'Movistar',
  },
];

/** Total que muestra el paginador de la real (2298 / 230 páginas de 10). */
export const TICKETS_TOTAL = 2298;

export { PRODUCTS };

/* ── Dashboard ─────────────────────────────────────────────────────────── */

export interface GroupRow {
  readonly name: string;
  readonly myAssigned: number;
  readonly totalWorkload: number;
  readonly created: number;
  readonly updated: number;
  readonly pending: number;
  readonly emailsSent: number;
  readonly smsSent: number;
  readonly totalActions: number;
}

export const GROUPS: readonly GroupRow[] = [
  { name: 'ES - DOD', myAssigned: 0, totalWorkload: 22, created: 0, updated: 2, pending: 11, emailsSent: 0, smsSent: 0, totalActions: 0 },
  { name: 'SK - Cuscare', myAssigned: 0, totalWorkload: 502, created: 433, updated: 41, pending: 34, emailsSent: 0, smsSent: 0, totalActions: 0 },
];

export const GROUPS_TOTALS: GroupRow = {
  name: 'Totals',
  myAssigned: 0,
  totalWorkload: 524,
  created: 433,
  updated: 43,
  pending: 45,
  emailsSent: 0,
  smsSent: 0,
  totalActions: 0,
};

/* ── Ajustes ───────────────────────────────────────────────────────────── */
/* Recordatorio: la app real lista NOMBRES DE EMPLEADOS reales en Users. Nada de
   eso se copia — los de aquí son inventados, con la misma cadencia (prefijos de
   rol/país, longitudes parecidas) para que las columnas midan igual. */

export interface UserRow {
  readonly name: string;
  readonly role: string;
  readonly acdGroups: string;
}

export const USERS: readonly UserRow[] = [
  { name: 'Agent Romania 1', role: 'Agent', acdGroups: '' },
  { name: 'Agent Romania 2', role: 'Agent', acdGroups: '' },
  { name: 'Agent Romania 3', role: 'Supervisor', acdGroups: '' },
  { name: 'Alba Requena', role: 'Supervisor', acdGroups: '' },
  { name: 'Aneta Kowalczyk', role: 'Agent', acdGroups: '' },
  { name: 'Andreu Tapies', role: 'Agent', acdGroups: '' },
  { name: 'Asli Demir', role: 'Agent', acdGroups: '' },
  { name: 'ATT - Elodie Marchand', role: 'Agent', acdGroups: '' },
  { name: 'ATT - Monica Valli', role: 'Supervisor', acdGroups: '' },
  { name: 'Beata Nowak', role: 'Agent', acdGroups: '' },
  { name: 'Dana Stolarova', role: 'RefundsType3', acdGroups: '' },
  { name: 'DE - Admin - Rene Wolf', role: 'Agent', acdGroups: '' },
  { name: 'Debora Voltolina', role: 'Supervisor', acdGroups: '' },
  { name: 'Enrico Moretti', role: 'Supervisor', acdGroups: '' },
  { name: 'ES Admin - Conchi', role: 'RefundsType3', acdGroups: '' },
  { name: 'ES Admin - Laura', role: 'Agent', acdGroups: '' },
  { name: 'ES Admin - Pilar', role: 'RefundsType3', acdGroups: '' },
  { name: 'ES Admin - Roberto', role: 'Agent', acdGroups: '' },
  { name: 'ES Agent - Backup', role: 'Supervisor', acdGroups: '' },
];

export interface RoleRow {
  readonly name: string;
  readonly description: string;
  readonly lastUpdate: string;
  readonly permissions: string;
}

export const ROLES: readonly RoleRow[] = [
  { name: 'Agent', description: 'Gestión de tickets asignados y contacto con cliente', lastUpdate: '02-07-2026 11:20', permissions: '18' },
  { name: 'Supervisor', description: 'Agent + reasignación, informes y gestión de cola', lastUpdate: '02-07-2026 11:22', permissions: '27' },
  { name: 'RefundsType1', description: 'Devoluciones hasta 10 €', lastUpdate: '14-05-2026 09:41', permissions: '20' },
  { name: 'RefundsType2', description: 'Devoluciones hasta 50 €', lastUpdate: '14-05-2026 09:42', permissions: '21' },
  { name: 'RefundsType3', description: 'Devoluciones sin límite + anulación de suscripción', lastUpdate: '14-05-2026 09:45', permissions: '24' },
  { name: 'Admin', description: 'Acceso completo, incluida configuración', lastUpdate: '30-04-2026 17:03', permissions: '41' },
  { name: 'ReadOnly', description: 'Solo consulta, sin acciones sobre el ticket', lastUpdate: '30-04-2026 17:05', permissions: '9' },
  { name: 'QA', description: 'Consulta + tipificación para control de calidad', lastUpdate: '11-03-2026 12:18', permissions: '13' },
  { name: 'MO Manager', description: 'Gestión de MO en error y reenvíos', lastUpdate: '11-03-2026 12:20', permissions: '15' },
  { name: 'Billing', description: 'Consulta de cobros y conciliación', lastUpdate: '08-02-2026 08:55', permissions: '11' },
];

export interface EntityRow {
  readonly groupName: string;
  readonly products: string;
  readonly rules: string;
  readonly country: string;
  readonly company: string;
  readonly orderBy: string;
}

export const ENTITIES: readonly EntityRow[] = [
  { groupName: 'ES - DOD', products: 'Playweez, itrip, Canaltv', rules: '4', country: 'Spain', company: 'Digital Virgo', orderBy: '1' },
  { groupName: 'SK - Cuscare', products: 'Busuu, WEEZCHAT SK', rules: '2', country: 'Slovakia', company: 'Digital Virgo', orderBy: '2' },
];

export interface TemplateFolder {
  readonly name: string;
  readonly tags: readonly string[];
  /** Nº de grupos extra colapsados en un chip "+N". */
  readonly moreTags?: number;
}

export const TEMPLATE_FOLDERS: readonly TemplateFolder[] = [
  { name: 'ES-DOD', tags: ['ES - DOD'] },
  { name: 'SK EMAIL', tags: ['SK - Cuscare'] },
  { name: 'Vsetky adresy', tags: ['SK - Cuscare'] },
  { name: 'Category - ES', tags: ['ES - DOD'], moreTags: 18 },
];
