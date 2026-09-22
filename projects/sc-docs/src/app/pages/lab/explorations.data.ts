/**
 * Exploraciones con versiones: ramas de comparación que no se funden y sus puntos de control. Viven aquí, en `main`,
 * para que el índice no muera con la rama. Cada etiqueta `archive/comparar-*` y `archive/lab-*` del repo tiene que
 * salir en este fichero: lo vigila `explorations:check` (en `verify`).
 *
 * Un enlace fijo (`<hash>.sc-supervisor.pages.dev`) sirve ese build y solo ese; el de la rama cambia con cada push.
 */

export type ExplorationStatus = 'oficial' | 'en-revision' | 'archivada';

export interface ExplorationLink {
  readonly label: string;
  readonly href: string;
}

export interface ExplorationVersion {
  /** Fecha ISO del despliegue. */
  readonly date: string;
  /** Cómo se comporta esa versión, en una línea. */
  readonly behavior: string;
  /** Enlace fijo a ese build. */
  readonly href: string;
  readonly tag?: string;
  readonly commit?: string;
}

/**
 * Versión, Objetivo y Estado son obligatorios (Rafa, 2026-09-16): se enseñan arriba de cada tarjeta, y así ninguna
 * exploración puede publicarse sin decir cuál es la vigente, qué pregunta responde y en qué quedó.
 */
export interface Exploration {
  readonly id: string;
  readonly title: string;
  /** La versión vigente: la que hay que abrir hoy. */
  readonly version: ExplorationVersion;
  /** Qué pregunta responde, en una frase. */
  readonly objective: string;
  readonly status: ExplorationStatus;
  /** Matiz del estado, si hace falta. */
  readonly statusNote?: string;
  /** El enlace de la rama, que cambia con cada push. */
  readonly live: ExplorationLink;
  /** Las versiones anteriores, de la más nueva a la más vieja. */
  readonly history: readonly ExplorationVersion[];
  readonly figma?: readonly ExplorationLink[];
}

export const EXPLORATION_STATUS_LABEL: Readonly<Record<ExplorationStatus, string>> = {
  oficial: 'Oficial',
  'en-revision': 'En revisión',
  archivada: 'Archivada',
};

export const EXPLORATIONS: readonly Exploration[] = [
  {
    id: 'sidebar',
    title: 'Sidebar del Supervisor (SISMAC-4340)',
    version: {
      date: '2026-09-16',
      behavior: 'No se cierra nada y recuerda lo abierto, también plegado y al recargar.',
      href: 'https://b360eb07.sc-supervisor.pages.dev/solo-sidebar',
      commit: '3c3e76c1',
    },
    objective: '¿Qué se abre y qué se cierra al moverse por el menú?',
    status: 'oficial',
    statusNote: 'La regla «no se cierra nada» es la oficial; todavía vive en su rama de comparación.',
    live: {
      label: 'comparar-sidebar.sc-supervisor.pages.dev/solo-sidebar',
      href: 'https://comparar-sidebar.sc-supervisor.pages.dev/solo-sidebar',
    },
    history: [
      {
        date: '2026-09-16',
        behavior: 'Abrir una categoría no cierra otras, pero navegar y plegar sí.',
        href: 'https://c1ae0539.sc-supervisor.pages.dev/solo-sidebar',
        tag: 'archive/comparar-sidebar-sin-cerrar-al-abrir-2026-09-16',
        commit: '65185e3b',
      },
      {
        date: '2026-09-16',
        behavior: 'Tipo Apollo: abrir una categoría cierra las demás.',
        href: 'https://dbf5db2a.sc-supervisor.pages.dev/solo-sidebar',
        tag: 'archive/comparar-sidebar-apollo-2026-09-16',
        commit: '2d96a46e',
      },
      {
        date: '2026-09-15',
        behavior: 'Laboratorio del Sidebar de primeng.dev con sus variantes, el tema y las pantallas reales.',
        href: 'https://704e9f33.sc-supervisor.pages.dev/config/aed/servicio',
        tag: 'archive/lab-sidebar-2026-09-16',
        commit: 'eae86e78',
      },
    ],
    figma: [
      {
        label: 'Tablero del sidebar',
        href: 'https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=14912-6324',
      },
      {
        label: 'Archivo de versiones anteriores',
        href: 'https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=14930-1011',
      },
    ],
  },
  {
    id: 'fichas',
    title: 'Fichas de agente, grupo y usuario',
    version: {
      date: '2026-09-16',
      behavior: 'Configuración del AED habla como la ficha de grupo y las estrategias siguen al COA.',
      href: 'https://4994b228.sc-supervisor.pages.dev/admin/grupos/editar/9',
      commit: '6e183821',
    },
    objective: '¿Qué forma de ficha deja editar más rápido sin perder de vista el resto?',
    status: 'en-revision',
    statusNote: 'Producto elige entre tres formas: una página, resumen con panel lateral y pestañas.',
    live: {
      label: 'comparar-fichas.sc-supervisor.pages.dev',
      href: 'https://comparar-fichas.sc-supervisor.pages.dev/admin/agentes?variante=e',
    },
    history: [
      {
        date: '2026-09-16',
        behavior: 'La ficha de grupo sigue al manual de Voice y guardar se queda en la ficha, como Contact Center.',
        href: 'https://3332127b.sc-supervisor.pages.dev/admin/grupos/editar/3',
        commit: 'de40e9c0',
      },
      {
        date: '2026-09-16',
        behavior: '«Activo» solo significa sesión abierta, estados de solo lectura e iconos Rounded.',
        href: 'https://ce21eafb.sc-supervisor.pages.dev/admin/agentes',
        commit: '78c8cda2',
      },
      {
        date: '2026-09-16',
        behavior: 'Listas con Servicios, WhatsApp, Email y Grabación; exportar solo lo seleccionado.',
        href: 'https://158ce908.sc-supervisor.pages.dev/admin/agentes',
        commit: '90b99c0e',
      },
      {
        date: '2026-09-16',
        behavior: 'Las tarjetas del resumen miden igual en agente, grupo y usuario.',
        href: 'https://bd162959.sc-supervisor.pages.dev/admin/grupos/editar/1?variante=e',
        commit: '3e9f6288',
      },
      {
        date: '2026-09-15',
        behavior: 'Tres formas a elegir; el panel lateral se pone encima sin mover la ficha.',
        href: 'https://da89b761.sc-supervisor.pages.dev/admin/agentes/editar/1?variante=e',
        commit: '4b0aa6b1',
      },
    ],
  },
  {
    id: 'tablas',
    title: 'Tablas con scroll',
    version: {
      date: '2026-09-14',
      behavior: 'B, la elegida: la tabla hace scroll dentro, con cabecera fija y lista virtual.',
      href: 'https://e2aadce5.sc-supervisor.pages.dev/admin/agentes',
      commit: '1f8f2d54',
    },
    objective: '¿Hace scroll la página con la cabecera fija, o la tabla por dentro?',
    status: 'oficial',
    statusNote: 'Decidido en DD-95: la tabla hace scroll por dentro. La cabecera fija queda archivada.',
    live: {
      label: 'comparar-tabla-scroll.sc-supervisor.pages.dev',
      href: 'https://comparar-tabla-scroll.sc-supervisor.pages.dev/admin/agentes',
    },
    history: [
      {
        date: '2026-09-14',
        behavior: 'A, archivada: hace scroll la página, con buscador y cabecera fijos arriba.',
        href: 'https://2ba0c0f8.sc-supervisor.pages.dev/admin/agentes',
        commit: 'f939ac4c',
      },
    ],
  },
];

/* ── LABORATORIOS ───────────────────────────────────────────────────────────────────────────────
 *
 * Un laboratorio no es una exploración. Una exploración son VERSIONES que se comparan abriendo
 * enlaces distintos; un laboratorio es UNA página con su propio conmutador dentro, donde el mismo
 * ojo ve las dos respuestas sin cambiar de pestaña. Por eso aquí no hay historial: la comparación
 * ocurre dentro. (Rafa, 2026-09-22: «así no tenemos muchos links».)
 */
export interface Lab {
  readonly id: string;
  readonly title: string;
  /** La pregunta que se contesta tocando, no leyendo. */
  readonly question: string;
  /** Qué se acciona dentro. Dos o tres, cortos: son pistas, no documentación. */
  readonly controls: readonly string[];
  /** Dónde está el mando, para no buscarlo. */
  readonly where: string;
  readonly href: string;
  /** El dominio que se ve bajo el título. */
  readonly label: string;
}

export const LABS: readonly Lab[] = [
  {
    id: 'lab-sidebar',
    title: 'Sidebar, el de PrimeNG',
    question: '¿Cómo se comporta el menú lateral en cada modo, y cuál queremos?',
    controls: ['Inset', 'Responsive', 'Drawer o Slim'],
    where: 'La barra de mandos, arriba de la página.',
    href: 'https://sc-supervisor.pages.dev/lab/sidebar',
    label: 'sc-supervisor.pages.dev/lab/sidebar',
  },
  {
    id: 'lab-admin',
    title: 'Administración, tras el teardown',
    question: '¿Las 20 decisiones del teardown mejoran el alta y la edición de grupos y usuarios?',
    controls: ['Reglas nuevas', 'Grietas de hoy'],
    where: 'El botón flotante, abajo a la derecha: apaga las dos reglas y enseña lo de hoy en vivo.',
    /* Producción desde que entró #225 (medido: 200). Antes apuntaba al preview de su rama, que es
     * lo que existía; un enlace del Lab a una rama es un 404 esperando a que alguien la borre. */
    href: 'https://sc-supervisor.pages.dev/lab/admin/grupos',
    label: 'sc-supervisor.pages.dev/lab/admin',
  },
];
