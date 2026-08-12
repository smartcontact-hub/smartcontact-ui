/**
 * Semilla de la réplica de Informes.
 *
 * ⚠️ **Datos 100 % inventados.** La app real muestra entidades de clientes con
 * su número de servicio (`Centralita Virtual - 4200001xx`), marcas de terceros
 * y nombres de informes de prueba de sus empleados. Nada de eso entra al repo:
 * se replica la FORMA (longitudes, formatos, distribución) para que el layout
 * respire igual, no el contenido.
 */

/** Entidades del picklist. Nombres de producto propios + demos inventadas. */
export const ENTIDADES: readonly string[] = [
  'Centralita Virtual - 900110001',
  'Centralita Virtual - 900110002',
  'Demo SmartContact - 900110010',
  'Demo Atención Cliente - 900110011',
  'Demo Solo Intenciones - 900110012',
  'DV- Smart Contact - 900110013',
  'Demo Cita Previa - 900110014',
  'Demo Soporte Técnico - 900110015',
  'Demo Encuestas - 900110016',
  'Demo Fidelización - 900110017',
  'Demo Reservas - 900110018',
  'Demo Facturación - 900110019',
  'Demo Incidencias - 900110020',
  'Demo Comercial - 900110021',
  'Demo Postventa - 900110022',
  'Demo Logística - 900110023',
  'Demo Recobros - 900110024',
  'Demo Altas - 900110025',
  'Demo Bajas - 900110026',
  'Demo Portabilidad - 900110027',
  'Demo Roaming - 900110028',
  'Demo Averías - 900110029',
  'Demo Retención - 900110030',
  'Demo Formación - 900110031',
  'Demo Pruebas - 900110032',
  'Demo Integración - 900110033',
];

/** Etiquetas cortas para los chips de la tabla (sin el número de servicio). */
export const ENTIDADES_CHIP: readonly string[] = ENTIDADES.map((e) => e.split(' - ')[0]);

export interface InformeFavorito {
  readonly nombre: string;
  readonly descripcion: string;
  /** Índices sobre `ENTIDADES_CHIP`; el resto se resume en el badge `+N`. */
  readonly entidades: readonly string[];
  readonly ocultas: number;
  readonly rango: string;
  readonly creado: string;
  readonly subcategoria: string;
  readonly categoria: string;
}

export const FAVORITOS: readonly InformeFavorito[] = [
  {
    nombre: 'Informe de servicios 41208',
    descripcion: 'Cobertura diaria',
    entidades: ['Centralita Virtual', 'Demo Cita Previa', 'Centralita Virtual', 'DV- Smart Contact'],
    ocultas: 1,
    rango: 'Semana anterior',
    creado: '09-03-2026 13:30',
    subcategoria: 'Conversación',
    categoria: 'Servicios',
  },
  {
    nombre: 'Informe de servicios 41206',
    descripcion: 'Control de picos',
    entidades: [
      'Centralita Virtual',
      'Demo SmartContact',
      'Demo Reservas',
      'Demo Fidelización',
    ],
    ocultas: 21,
    rango: 'Mes anterior',
    creado: '09-03-2026 12:52',
    subcategoria: 'Conversación',
    categoria: 'Servicios',
  },
];

export interface InformePredeterminado {
  readonly nombre: string;
  readonly categoria: string;
  readonly subcategoria: string;
  readonly descripcion: string;
}

/**
 * Catálogo de informes predeterminados. Esto NO es dato de cliente: es el
 * catálogo del producto, así que se replica tal cual (traducido con el
 * diccionario real de la app, `assets/i18n/es.json`).
 */
export const PREDETERMINADOS: readonly InformePredeterminado[] = [
  {
    nombre: 'Servicios-Conversación',
    categoria: 'Servicios',
    subcategoria: 'Conversación',
    descripcion: 'Todas las conversaciones gestionadas por el servicio',
  },
  {
    nombre: 'Servicios-Tiempos Medios',
    categoria: 'Servicios',
    subcategoria: 'Tiempos Medios',
    descripcion: 'Tiempos medios de todas las conversaciones',
  },
  {
    nombre: 'Servicios-Destino',
    categoria: 'Servicios',
    subcategoria: 'Destino',
    descripcion: 'Todas las conversaciones que un destino ha gestionado',
  },
  {
    nombre: 'Servicios-Grupos',
    categoria: 'Servicios',
    subcategoria: 'Grupos',
    descripcion: 'Todas las conversaciones que un servicio ha tenido',
  },
  {
    nombre: 'Servicios-Nodo Navegación',
    categoria: 'Servicios',
    subcategoria: 'Nodo Nav.',
    descripcion: 'Todas las conversaciones terminadas en un nodo',
  },
  {
    nombre: 'Servicios-Nodo Transferencia',
    categoria: 'Servicios',
    subcategoria: 'Nodo Transf.',
    descripcion: 'Todas las conversaciones terminadas en una transferencia',
  },
];

/**
 * Menú del diálogo "Informes de Estadísticas" (el que abre el botón + ).
 * Cuatro `p-menu`: tres en una fila y CDR debajo.
 */
export interface GrupoInformes {
  readonly titulo: string;
  readonly ancho: number;
  readonly items: readonly { readonly etiqueta: string; readonly tipo: string }[];
}

export const MENU_INFORMES: readonly GrupoInformes[] = [
  {
    titulo: 'Servicios',
    ancho: 227.6,
    items: [
      { etiqueta: 'Conversaciones', tipo: 'servicios-conversacion' },
      { etiqueta: 'Tiempos Medios', tipo: 'servicios-tiempos' },
      { etiqueta: 'Nodos IA', tipo: 'servicios-nodos-ia' },
      { etiqueta: 'Tasa de abandono y atención', tipo: 'servicios-tasa' },
      { etiqueta: 'Reporte gráfico', tipo: 'servicios-grafico' },
    ],
  },
  {
    titulo: 'Grupos',
    ancho: 175,
    items: [
      { etiqueta: 'Conversaciones', tipo: 'grupos-conversacion' },
      { etiqueta: 'Tiempos Medios', tipo: 'grupos-tiempos' },
    ],
  },
  {
    titulo: 'Agentes',
    ancho: 175,
    items: [
      { etiqueta: 'Conversaciones', tipo: 'agentes-conversacion' },
      { etiqueta: 'Tiempos Medios', tipo: 'agentes-tiempos' },
      { etiqueta: 'Tiempos', tipo: 'agentes-tiempos-detalle' },
      { etiqueta: 'Conexiones', tipo: 'agentes-conexiones' },
      { etiqueta: 'Log', tipo: 'agentes-log' },
    ],
  },
  {
    titulo: 'CDR',
    ancho: 175,
    items: [
      { etiqueta: 'Servicios', tipo: 'cdr-servicios' },
      { etiqueta: 'Grupos', tipo: 'cdr-grupos' },
      { etiqueta: 'Agentes', tipo: 'cdr-agentes' },
    ],
  },
];

/** Rótulo del constructor por tipo de informe (clave `TITLE_REPORTS.*`). */
export const TITULO_INFORME: Record<string, string> = {
  'servicios-conversacion': 'Informe de Servicios - Conversación',
  'servicios-tiempos': 'Informe de Servicios - Tiempos Medios',
  'servicios-nodos-ia': 'Informe de Servicios - Nodos IA',
  'servicios-tasa': 'Informe de Servicios - Tasa de abandono y atención',
  'servicios-grafico': 'Informe de Servicios - Reporte gráfico',
  'grupos-conversacion': 'Informe de Grupos - Conversación',
  'grupos-tiempos': 'Informe de Grupos - Tiempos Medios',
  'agentes-conversacion': 'Informe de Agentes - Conversación',
  'agentes-tiempos': 'Informe de Agentes - Tiempos Medios',
  'agentes-tiempos-detalle': 'Informe de Agentes - Tiempos',
  'agentes-conexiones': 'Informe de Agentes - Conexiones',
  'agentes-log': 'Informe de Agentes - Log',
  'cdr-servicios': 'Informe de CDR - Servicios',
  'cdr-grupos': 'Informe de CDR - Grupos',
  'cdr-agentes': 'Informe de CDR - Agentes',
};

/** Presets de rango del listbox de Fechas (`RANGE_DATES` del diccionario). */
export const RANGOS: readonly string[] = [
  'Hoy',
  'Ayer',
  'Esta semana',
  'Semana anterior',
  'Este mes',
  'Mes anterior',
  'Este año',
];

export interface NodoColumna {
  readonly etiqueta: string;
  /** 0-based; el original sangra 14 px por nivel. */
  readonly nivel: number;
  readonly hoja: boolean;
}

/**
 * Árbol de columnas de "Servicios - Conversación" (24 nodos), con las
 * etiquetas del diccionario real `COLUMNS.SERVICES_CONVERSATIONS.LABEL`.
 */
export const ARBOL_COLUMNAS: readonly NodoColumna[] = [
  { etiqueta: 'TOTAL', nivel: 0, hoja: false },
  { etiqueta: 'ENTRANTES', nivel: 1, hoja: false },
  { etiqueta: 'BOTS', nivel: 2, hoja: false },
  { etiqueta: 'ABANDONADAS', nivel: 3, hoja: true },
  { etiqueta: 'DESBORDADAS', nivel: 3, hoja: true },
  { etiqueta: 'FINALIZADAS', nivel: 3, hoja: true },
  { etiqueta: 'TRANSFERENCIAS', nivel: 2, hoja: false },
  { etiqueta: 'NO ATENDIDAS', nivel: 3, hoja: false },
  { etiqueta: 'ABANDONADAS', nivel: 3, hoja: true },
  { etiqueta: 'DESBORDADAS/COMUNICA', nivel: 3, hoja: true },
  { etiqueta: 'DESCONECTADAS/NO CONTESTA', nivel: 3, hoja: true },
  { etiqueta: 'OTRAS', nivel: 3, hoja: true },
  { etiqueta: 'ATENDIDAS', nivel: 3, hoja: false },
  { etiqueta: 'AT. ENTRANTE %', nivel: 4, hoja: true },
  { etiqueta: 'PICO MÁXIMO', nivel: 3, hoja: true },
  { etiqueta: 'PICO MAX. FECHA', nivel: 3, hoja: true },
  { etiqueta: 'SALIENTES', nivel: 1, hoja: false },
  { etiqueta: 'NO ATENDIDAS', nivel: 2, hoja: false },
  { etiqueta: 'ABANDONADAS', nivel: 2, hoja: true },
  { etiqueta: 'DESBORDADAS/COMUNICA', nivel: 2, hoja: true },
  { etiqueta: 'DESCONECTADAS/NO CONTESTA', nivel: 2, hoja: true },
  { etiqueta: 'OTRAS', nivel: 2, hoja: true },
  { etiqueta: 'ATENDIDAS', nivel: 2, hoja: false },
  { etiqueta: 'AT. SALIENTE %', nivel: 3, hoja: true },
];

/**
 * Cabeceras de la tabla de previsualización (25 columnas), del diccionario
 * `COLUMNS.SERVICES_CONVERSATIONS.COLUMNAME`.
 *
 * El original arrastra dos erratas de traducción — doble espacio en
 * "Desbordadas  (Ent. Bot N.A.)" y espacio final en "AT. Ent. % ". No se
 * replican: copiarlas sería replicar un fallo, no un diseño.
 */
export const COLUMNAS_PREVIEW: readonly string[] = [
  'Servicios',
  'Total',
  'Entrantes',
  'Bots',
  'Abandonadas (Ent. Bot N.A.)',
  'Desbordadas (Ent. Bot N.A.)',
  'Finalizadas (Ent. Bot N.A.)',
  'Transferidas (Ent.)',
  'No Atendidas (Ent. Trans.)',
  'Abandonadas (Ent. Trans. N.A.)',
  'Desbordadas (Ent. Trans. N.A.)',
  'Desconectadas/No contesta (Ent. Trans. N.A.)',
  'Otras (Ent. Trans. N.A.)',
  'Atendidas (Ent. Trans.)',
  'AT. Ent. %',
  'Pico Máximo',
  'Fecha Pico Máximo',
  'Salientes',
  'No Atendidas (Sal.)',
  'Abandonadas (Sal. N.A.)',
  'Desbordadas/Comunica (Sal. N.A.)',
  'Desconectadas/No contesta (Sal. N.A.)',
  'Otras (Sal. N.A.)',
  'Atendidas (Sal.)',
  'AT. Sal. %',
];
