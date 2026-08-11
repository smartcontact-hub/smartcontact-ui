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
