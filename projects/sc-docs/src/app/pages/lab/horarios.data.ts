/**
 * HORARIOS · todas sus versiones en un sitio.
 *
 * Horarios se está probando en varias ramas experimentales a la vez, y cada una ponía su tarjeta en el Lab de SU
 * rama: en `sc-doc.pages.dev/#/lab`, que se sirve desde `main`, no salía ninguna. Este fichero vive en `main` y las
 * junta. Son dos versiones (el Lab y la propuesta de referencia), las variantes que salen del Lab, un experimento
 * sobre la pantalla de producción y lo que sirve para compararlas.
 *
 * Fichero aparte de `explorations.data.ts` a propósito: las ramas de Horarios añaden sus tarjetas en ese, y así este
 * no choca con ninguna al traer `main`.
 *
 * Los enlaces son el preview de cada rama (`<rama>.sc-supervisor.pages.dev`): se actualizan con cada push y dejan de
 * hacerlo si la rama se funde o se borra.
 */

/** Quien hizo cada versión: se enseña bajo su título, como en «Guardado». */
const AUTORES = {
  marta: 'Marta Recio',
  mantenedor: 'Rafa Areses',
} as const;

export interface HorariosEnlace {
  readonly label: string;
  readonly href: string;
}

export interface HorariosVersion {
  readonly id: string;
  readonly title: string;
  /** Qué es, en una frase. */
  readonly summary: string;
  /** De dónde sale, si no es una versión por sí misma («Sale del Lab»). */
  readonly origin?: string;
  readonly author: string;
  /** Su PR o, si no tiene, su rama. */
  readonly source: HorariosEnlace;
  /** Lo que se abre. Más de uno cuando la versión tiene varias pantallas. */
  readonly links: readonly HorariosEnlace[];
  /** El dominio que se ve bajo los enlaces. */
  readonly domain: string;
}

export interface HorariosGrupo {
  readonly title: string;
  readonly versions: readonly HorariosVersion[];
}

const PR = (n: number): HorariosEnlace => ({
  label: `PR #${n}`,
  href: `https://github.com/smartcontact-hub/smartcontact-ui/pull/${n}`,
});

export const HORARIOS: readonly HorariosGrupo[] = [
  {
    title: 'Versiones',
    versions: [
      {
        id: 'lab',
        title: 'Lab de Horarios',
        summary: 'Estado en una columna, la semana por tramos, el calendario siempre a la vista y festivos precargados.',
        author: AUTORES.mantenedor,
        source: PR(614),
        links: [{ label: 'Abrir', href: 'https://claude-lab-horarios.sc-supervisor.pages.dev/lab/horarios' }],
        domain: 'claude-lab-horarios.sc-supervisor.pages.dev/lab/horarios',
      },
      {
        id: 'lab-tabla',
        title: 'Lab con la tabla del DS',
        summary:
          'La tabla de la versión premium hecha con sc-datatable; en el editor, la semana dibujada y el calendario con calor.',
        origin: 'Sale del Lab',
        author: AUTORES.mantenedor,
        source: PR(619),
        links: [{ label: 'Abrir', href: 'https://claude-lab-horarios-tabla.sc-supervisor.pages.dev/lab/horarios' }],
        domain: 'claude-lab-horarios-tabla.sc-supervisor.pages.dev/lab/horarios',
      },
      {
        id: 'premium',
        title: 'Tiempo, versión premium',
        summary: 'Horarios y festivos con aspecto propio, en una sola pantalla y sin atarse al DS.',
        origin: 'Sale del Lab',
        author: AUTORES.mantenedor,
        source: PR(618),
        links: [{ label: 'Abrir', href: 'https://claude-lab-horarios-premium.sc-supervisor.pages.dev/lab/tiempo' }],
        domain: 'claude-lab-horarios-premium.sc-supervisor.pages.dev/lab/tiempo',
      },
      {
        id: 'referencia',
        title: 'Propuesta de referencia',
        summary: 'Calendarios montado tal cual con las piezas del DS, sin rediseñar.',
        origin: 'Una versión con tres pantallas',
        author: AUTORES.mantenedor,
        source: PR(617),
        links: [
          {
            label: 'Periodos v2',
            href: 'https://claude-proto-referencia.sc-supervisor.pages.dev/lab/calendarios/periodos',
          },
          {
            label: 'Horarios y calendarios',
            href: 'https://claude-proto-referencia.sc-supervisor.pages.dev/lab/calendarios/horarios',
          },
          { label: 'Calendarios IVR', href: 'https://claude-proto-referencia.sc-supervisor.pages.dev/lab/calendarios/ivr' },
        ],
        domain: 'claude-proto-referencia.sc-supervisor.pages.dev/lab/calendarios',
      },
      {
        id: 'calendario-manda',
        title: 'El calendario manda',
        summary:
          'Sobre la pantalla de producción: el calendario delante, las reglas en segundo plano y el listado con atención, grupos y estado.',
        author: AUTORES.marta,
        source: {
          label: 'Rama claude/fervent-ride-qlsmzs',
          href: 'https://github.com/smartcontact-hub/smartcontact-ui/tree/claude/fervent-ride-qlsmzs',
        },
        links: [{ label: 'Abrir', href: 'https://claude-fervent-ride-qlsmzs.sc-supervisor.pages.dev/admin/horarios' }],
        domain: 'claude-fervent-ride-qlsmzs.sc-supervisor.pages.dev/admin/horarios',
      },
    ],
  },
  {
    title: 'Para compararlas',
    versions: [
      {
        id: 'presentacion',
        title: 'La presentación',
        summary: 'La propuesta de referencia y el Lab lado a lado, paso a paso y con notas.',
        author: AUTORES.mantenedor,
        source: PR(616),
        links: [
          {
            label: 'Abrir',
            href: 'https://claude-presentacion-horarios.sc-doc.pages.dev/explorations/horarios-presentacion/index.html',
          },
        ],
        domain: 'claude-presentacion-horarios.sc-doc.pages.dev',
      },
      {
        id: 'produccion',
        title: 'Horarios, hoy en producción',
        summary: 'La pantalla que hay en main, el punto de partida de todas.',
        author: AUTORES.mantenedor,
        source: PR(611),
        links: [{ label: 'Abrir', href: 'https://sc-supervisor.pages.dev/admin/horarios' }],
        domain: 'sc-supervisor.pages.dev/admin/horarios',
      },
    ],
  },
];
