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

/** Quién puso un tipo de solicitud: la IA al clasificar el ticket, o el agente al revisarlo. */
export type RequestOrigin = 'ai' | 'agent';

/** Un tipo de solicitud con su origen. Un ticket puede llevar varios, de los dos orígenes. */
export interface RequestTag {
  readonly label: string;
  readonly origin: RequestOrigin;
}

/**
 * Los tipos de solicitud, en el orden del comentario de la V3 en Figma (1900:2949), que suma
 * Legal y Spam a los de «Nature of demand». «Empty» (Vacío) no es un tipo que se ponga: es
 * una opción del filtro y vive en `request-type.ts`. La columna «Request type» y su filtro son
 * de la V3 (SCC 2081), que aún no está en la app real: aquí se enseña el comportamiento.
 */
export const REQUEST_TYPES: readonly string[] = [
  'Unsubscription',
  'Refund',
  'Legal',
  'Spam',
  'Information',
  'Withdrawal Right',
  'GDPR access',
  'GDPR Forgotten',
  'Product problem',
  'Log problem',
  'Others',
  'Pending to define',
];

export interface TicketRow {
  readonly id: string;
  readonly status: TicketStatus;
  readonly assignedTo: string;
  readonly group: string;
  readonly channel: TicketChannel;
  readonly source: string;
  readonly email: string;
  readonly country: string;
  /**
   * Fichero de bandera del original (`assets/icons/flags/{iso}.svg`), que es lo
   * que pinta él. La interfaz usa el SVG: un emoji lo dibuja el sistema
   * operativo y cambia de forma según el equipo, así que no es replicable.
   */
  readonly countryFlagSrc: string;
  readonly products: readonly string[];
  /** Tipos de solicitud con su origen (V3). Vacío = aún sin clasificar. */
  readonly requestTypes: readonly RequestTag[];
  readonly created: string;
  readonly updated: string;
  readonly description: string;
  readonly priority: string;
  readonly subStatus: string;
  readonly refund: string;
  readonly gdpr: string;
  /** Marca junto al ID: ticket nuevo o tratado hace poco por un agente (los recién tratados suben arriba en la real). */
  readonly badge?: 'new' | 'updated';
  /** Estado de servicio de los productos del ticket, para el filtro de Productos. */
  readonly serviceState: 'active' | 'inactive' | 'none';
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

export const TICKETS: readonly Omit<TicketRow, 'serviceState'>[] = [
  {
    id: '2050617',
    status: 'open',
    assignedTo: 'LATAM Agent 1 - Aleja',
    group: 'ES - DOD',
    channel: 'call',
    source: '34600111222',
    email: '',
    country: 'Spain',
    countryFlagSrc: 'icons/flags/es.svg',
    products: ['Playweez', 'Canaltv'],
    requestTypes: [{ label: 'Unsubscription', origin: 'ai' }],
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
    countryFlagSrc: 'icons/flags/es.svg',
    products: ['Playweez', 'itrip'],
    requestTypes: [{ label: 'Refund', origin: 'agent' }, { label: 'Information', origin: 'agent' }],
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
    countryFlagSrc: 'icons/flags/es.svg',
    products: ['Canaltv', 'UnlimitedVideos'],
    requestTypes: [{ label: 'Information', origin: 'ai' }],
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
    countryFlagSrc: 'icons/flags/es.svg',
    products: ['UnlimitedVideos', 'Trendly_ES_Orange_W'],
    requestTypes: [
      { label: 'Unsubscription', origin: 'ai' },
      { label: 'Unsubscription', origin: 'agent' },
      { label: 'Refund', origin: 'ai' },
    ],
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
    countryFlagSrc: 'icons/flags/es.svg',
    products: ['itrip', 'Clicnscore', 'TopmusicTv', 'Canaltv'],
    requestTypes: [{ label: 'Unsubscription', origin: 'agent' }],
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
    countryFlagSrc: 'icons/flags/es.svg',
    products: ['Clicnscore', 'Playweez'],
    requestTypes: [{ label: 'Unsubscription', origin: 'ai' }, { label: 'Others', origin: 'ai' }],
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
    countryFlagSrc: 'icons/flags/es.svg',
    products: ['fuzeforge_spain_orange_mo', 'itrip'],
    requestTypes: [{ label: 'Refund', origin: 'ai' }, { label: 'Withdrawal Right', origin: 'agent' }],
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
    countryFlagSrc: 'icons/flags/es.svg',
    products: ['Trendly'],
    requestTypes: [],
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

/**
 * Cuántas filas se generan.
 *
 * **3280** porque es lo que muestra el paginador de la app real (328 páginas de
 * 10), y con 60 filas la réplica enseñaba "1–10 of 60 results" y 6 páginas: la
 * diferencia más visible de toda la pantalla, y además dejaba sin ejercitar la
 * ventana del paginador (que sólo se mueve a partir de la página 5). Se generan
 * en tiempo de ejecución con un bucle, así que no engordan el bundle.
 */
const ROWS = 3280;

/**
 * Genera filas adicionales DETERMINISTAS para que la paginación tenga por dónde
 * pasar. Sin `Math.random`: el mismo índice da siempre la misma fila, así los
 * tests e2e y las capturas no bailan entre ejecuciones.
 *
 * Sigue siendo todo inventado — solo replica la FORMA de los datos reales.
 */
const AGENTS = [
  'LATAM Agent 1 - Aleja',
  'ES Agent - M. Angeles',
  'LATAM Agent 2 - Karen',
  'LATAM Agent 3 - Natty',
  'Marek Horvat',
  'LATAM Agent 5 - Jeimy Alexandra',
  'Unassigned',
];

/**
 * Plantilla del desplegable "Assign" (acciones en bloque).
 *
 * La lista real tiene **34 agentes** y desborda el panel (`scrollHeight` 1318 vs
 * 196 visibles), así que aquí hay 34 para que el scroll se comporte igual. Los
 * nombres son INVENTADOS; lo replicado es su FORMA, que tiene dos patrones
 * mezclados a propósito porque así está en la real: unos llevan prefijo de
 * equipo (`TECH - …`, `ATT - …`, `ES Admin - …`, `FR - …`) y otros son solo
 * nombre y apellido. El rótulo del grupo está en castellano ("Agentes") dentro
 * de una interfaz en inglés — también es del original.
 */
export const ASSIGNABLE_AGENTS: readonly string[] = [
  'TECH - Agente Carrier',
  'ATT - Monica Vidales',
  'ES Admin - Pilar',
  'TECH - Pablo Guillén Almarza',
  'ATT - Amandine Guiberteau',
  'TECH - Agente Carrier 2',
  'TECH - Eva',
  'Marek Horvat',
  'Jozef Bartos',
  'Lucia Kovacova',
  'TECH - Agente Carrier 3',
  'FR - Baptiste Joubert',
  'FR - Camille Renaud',
  'ATT - Sofia Marchetti',
  'ES Admin - Nuria',
  'LATAM Agent 1 - Aleja',
  'LATAM Agent 2 - Karen',
  'LATAM Agent 3 - Natty',
  'LATAM Agent 5 - Jeimy Alexandra',
  'ES Agent - M. Angeles',
  'TECH - Soporte N2',
  'TECH - Soporte N3',
  'ATT - Elena Prieto',
  'ATT - Rubén Casal',
  'FR - Océane Lefèvre',
  'ES Admin - Teresa',
  'Zuzana Malikova',
  'Ondrej Bilek',
  'TECH - Integraciones',
  'ATT - Beatriz Solana',
  'FR - Mathieu Perrot',
  'LATAM Agent 6 - Dayana',
  'ES Agent - Cristina',
  'TECH - Agente Carrier 4',
];
const STATUSES: TicketStatus[] = ['open', 'resolved', 'pending', 'closed'];
const CHANNELS: TicketChannel[] = ['call', 'chat', 'mail'];
const CARRIERS = ['Orange', 'Movistar', 'Vodafone', 'O2', 'Yoigo'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const COUNTRIES: readonly { name: string; src: string }[] = [
  { name: 'Spain', src: 'icons/flags/es.svg' },
  { name: 'Slovakia', src: 'icons/flags/sk.svg' },
];
const GROUPS_NAMES = ['ES - DOD', 'SK - Cuscare'];

/**
 * Tipos de solicitud de una fila generada. Reparte los cinco casos que el filtro tiene que
 * distinguir: solo IA, solo agente, los dos coinciden, los dos discrepan, y sin clasificar.
 */
function requestTypesFor(i: number): RequestTag[] {
  const n = REQUEST_TYPES.length;
  const a = REQUEST_TYPES[i % 7];
  const b = REQUEST_TYPES[(i * 3 + 2) % n] === a ? REQUEST_TYPES[(i + 1) % n] : REQUEST_TYPES[(i * 3 + 2) % n];
  switch (i % 6) {
    case 0:
      return [{ label: a, origin: 'ai' }];
    case 1:
      return [{ label: a, origin: 'agent' }];
    case 2:
      return [
        { label: a, origin: 'ai' },
        { label: a, origin: 'agent' },
      ];
    case 3:
      return [
        { label: a, origin: 'ai' },
        { label: b, origin: 'agent' },
      ];
    case 4:
      return [
        { label: a, origin: 'ai' },
        { label: b, origin: 'ai' },
      ];
    default:
      return [];
  }
}

function makeRow(i: number): Omit<TicketRow, 'serviceState'> {
  const id = String(2050400 - i * 7);
  const c = COUNTRIES[i % COUNTRIES.length];
  const day = 1 + (i % 28);
  const hh = 8 + (i % 10);
  const mm = (i * 13) % 60;
  // La fecha RETROCEDE con el índice, como en la real: sus primeras páginas son
  // del mes en curso y la última (la 328) llega a 2023. Un mes cada 90 filas.
  const monthsBack = Math.floor(i / 90);
  const abs = 2026 * 12 + (8 - 1) - monthsBack; // agosto de 2026 hacia atrás
  const year = Math.floor(abs / 12);
  const month = (abs % 12) + 1;
  const stamp = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  return {
    id,
    status: STATUSES[i % STATUSES.length],
    assignedTo: AGENTS[i % AGENTS.length],
    group: GROUPS_NAMES[i % GROUPS_NAMES.length],
    channel: CHANNELS[i % CHANNELS.length],
    source: `346${String(10000000 + i * 137).slice(0, 8)}`,
    email: i % 4 === 0 ? `persona${i}@example.com` : '',
    country: c.name,
    countryFlagSrc: c.src,
    products: [PRODUCTS[i % PRODUCTS.length], PRODUCTS[(i + 3) % PRODUCTS.length]],
    requestTypes: requestTypesFor(i),
    created: stamp,
    updated: stamp,
    description: '-',
    priority: PRIORITIES[i % PRIORITIES.length],
    subStatus: '-',
    refund: '-',
    gdpr: '-',
    carrier: CARRIERS[i % CARRIERS.length],
  };
}

/** Las 8 curadas + el resto generadas = 3280 filas → 328 páginas, como la real. */
/** Los estados y los medios de reembolso que ofrece su filtro (inventados con la forma de los de la real). */
/** El listado completo de sub-estados de producción (el que facilita el equipo de producto). */
export const SUB_STATUSES = ['Cliente', 'Legal', 'GPDR', 'Técnico', 'Devolución', 'Socio', 'Revisar', 'Agente', 'Supervisor'] as const;

export const REFUND_STATES = ['Requested', 'Validated', 'Approved', 'Processed', 'Error', 'Completed'] as const;
export const REFUND_METHODS = ['Carrier', 'Bank', 'Cheque', 'External'] as const;

/**
 * Los tres campos que las filas escritas a mano no traen, repartidos con una regla fija (sin azar: que dos cargas
 * den lo mismo): marca Nuevo/Actualizado, estado de servicio, reembolso y GDPR.
 */
/** Un reparto repetible pero mezclado: así las marcas no coinciden con el ciclo de agentes, grupos o estados. */
const mix = (i: number, salt: number): number => ((Math.imul(i + 1, 2654435761) ^ Math.imul(salt, 40503)) >>> 0) % 100;

function withDerived(row: TicketRow, i: number): TicketRow {
  return {
    ...row,
    badge: i % 650 === 12 ? 'updated' : i % 23 === 5 ? 'new' : undefined,
    subStatus: mix(i, 3) < 40 ? SUB_STATUSES[mix(i, 4) % SUB_STATUSES.length]! : '-',
    locked: (row.locked ?? (mix(i, 5) < 4 && row.assignedTo !== 'Unassigned')) && row.status !== 'resolved',
    serviceState: row.products.length === 0 ? 'none' : mix(i, 6) < 35 ? 'inactive' : 'active',
    refund: mix(i, 7) < 20 ? [...REFUND_STATES, ...REFUND_METHODS][mix(i, 8) % 10]! : '-',
    gdpr: mix(i, 9) < 12 ? 'Pending GDPR' : 'Not pending GDPR',
  };
}

export const TICKETS_ALL: readonly TicketRow[] = [
  ...TICKETS,
  ...Array.from({ length: ROWS - TICKETS.length }, (_, i) => makeRow(i)),
]
  .map((row, i) => withDerived(row as TicketRow, i))
  /* Los tickets tratados hace poco por un agente suben arriba (comentario del diseño); el resto, en su orden. */
  .sort((a, b) => Number(b.badge === 'updated') - Number(a.badge === 'updated'));

/** Lo que enseña el pie sin filtros. Derivado, no una constante a mano. */
export const TICKETS_TOTAL = TICKETS_ALL.length;

export { PRODUCTS };
