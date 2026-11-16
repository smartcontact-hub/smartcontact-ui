/**
 * HORARIOS · todas sus versiones en un sitio.
 *
 * Horarios se está probando en varias ramas experimentales a la vez, y cada una ponía su tarjeta en el Lab de SU
 * rama: en `sc-doc.pages.dev/#/lab`, que se sirve desde `main`, no salía ninguna. Este fichero vive en `main` y las
 * junta por autoría: un bloque por persona, por orden alfabético y con el mismo peso, y así el nombre sale una vez y
 * no en cada ficha. Dentro, dos versiones (el Lab y la propuesta de referencia), las variantes que salen del Lab, un
 * experimento sobre la pantalla de producción y lo que sirve para compararlas.
 *
 * Cada rama pone además su tarjeta en «Laboratorios» (`explorations.data.ts`). Mientras vive en su rama no se ve aquí;
 * cuando se funde, llegaría a `main` y saldría dos veces. `tarjeta` dice cuál es la suya, y la página la quita de
 * «Laboratorios» sola (`HORARIOS_YA_ESTA`): nadie tiene que acordarse al fundir.
 *
 * Fichero aparte de `explorations.data.ts` a propósito: las ramas de Horarios añaden sus tarjetas en ese, y así este
 * no choca con ninguna al traer `main`.
 *
 * Los enlaces son el preview de cada rama (`<rama>.sc-supervisor.pages.dev`): se actualizan con cada push y dejan de
 * hacerlo si la rama se funde o se borra.
 */

/** Quien hizo una versión: su nombre, sus iniciales para el avatar y el color de ese avatar. */
export interface HorariosAutor {
  readonly nombre: string;
  readonly iniciales: string;
  readonly color: 'blue' | 'purple';
}

/** Quien firma lo que enseña el Lab: las versiones de Horarios y los bocetos de «Guardado». */
export const AUTORES = {
  marta: { nombre: 'Marta Recio', iniciales: 'MR', color: 'purple' },
  mantenedor: { nombre: 'Rafa Areses', iniciales: 'RA', color: 'blue' },
} as const satisfies Record<string, HorariosAutor>;

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
  /** Su PR o, si no tiene, su rama. */
  readonly source: HorariosEnlace;
  /** Lo que se abre. Más de uno cuando la versión tiene varias pantallas. */
  readonly links: readonly HorariosEnlace[];
  /** El `id` de la tarjeta que su rama añade a «Laboratorios», que sobra cuando la rama se funde. */
  readonly tarjeta?: string;
}

export interface HorariosGrupo {
  readonly title: string;
  readonly versions: readonly HorariosVersion[];
}

/** Lo que ha hecho una persona. Todas se enseñan igual: ninguna pesa más que otra. */
export interface HorariosAutoria {
  readonly autor: HorariosAutor;
  /** Qué reúne, en una línea. */
  readonly lead: string;
  readonly grupos: readonly HorariosGrupo[];
}

const PR = (n: number): HorariosEnlace => ({
  label: `PR #${n}`,
  href: `https://github.com/smartcontact-hub/smartcontact-ui/pull/${n}`,
});

export const HORARIOS: readonly HorariosAutoria[] = [
  {
    autor: AUTORES.marta,
    lead: 'Una versión sobre la pantalla de producción.',
    grupos: [
      {
        title: 'Versiones',
        versions: [
          {
            id: 'calendario-manda',
            title: 'El calendario manda',
            summary:
              'El calendario delante, las reglas en segundo plano y el listado con atención, grupos y estado.',
            source: {
              label: 'Su rama, sin PR',
              href: 'https://github.com/smartcontact-hub/smartcontact-ui/tree/claude/fervent-ride-qlsmzs',
            },
            links: [
              { label: 'Abrir', href: 'https://claude-fervent-ride-qlsmzs.sc-supervisor.pages.dev/admin/horarios' },
            ],
          },
        ],
      },
    ],
  },
  {
    autor: AUTORES.mantenedor,
    lead: 'El Lab y lo que sale de él, la propuesta de referencia y lo que sirve para compararlas.',
    grupos: [
      {
        title: 'Versiones',
        versions: [
          {
            id: 'lab',
            title: 'Lab de Horarios',
            summary: 'Estado en una columna, la semana por tramos, el calendario a la vista y festivos precargados.',
            source: PR(614),
            links: [{ label: 'Abrir', href: 'https://claude-lab-horarios.sc-supervisor.pages.dev/lab/horarios' }],
            tarjeta: 'lab-horarios',
          },
          {
            id: 'lab-tabla',
            title: 'Lab con la tabla del DS',
            summary: 'La tabla de la premium hecha con sc-datatable; en el editor, la semana dibujada y el mes con calor.',
            origin: 'Sale del Lab',
            source: PR(619),
            links: [{ label: 'Abrir', href: 'https://claude-lab-horarios-tabla.sc-supervisor.pages.dev/lab/horarios' }],
          },
          {
            id: 'premium',
            title: 'Tiempo, versión premium',
            summary: 'Horarios y festivos con aspecto propio, en una sola pantalla y sin atarse al DS.',
            origin: 'Sale del Lab',
            source: PR(618),
            links: [{ label: 'Abrir', href: 'https://claude-lab-horarios-premium.sc-supervisor.pages.dev/lab/tiempo' }],
            tarjeta: 'lab-tiempo-premium',
          },
          {
            id: 'referencia',
            title: 'Propuesta de referencia',
            summary: 'Calendarios montado tal cual con las piezas del DS, sin rediseñar. Una versión con tres pantallas.',
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
              {
                label: 'Calendarios IVR',
                href: 'https://claude-proto-referencia.sc-supervisor.pages.dev/lab/calendarios/ivr',
              },
            ],
            tarjeta: 'lab-calendarios-referencia',
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
            source: PR(616),
            links: [
              {
                label: 'Abrir',
                href: 'https://claude-presentacion-horarios.sc-doc.pages.dev/explorations/horarios-presentacion/index.html',
              },
            ],
            tarjeta: 'lab-horarios-presentacion',
          },
          {
            id: 'produccion',
            title: 'Horarios, hoy en producción',
            summary: 'La pantalla que hay en main, el punto de partida de todas.',
            source: PR(611),
            links: [{ label: 'Abrir', href: 'https://sc-supervisor.pages.dev/admin/horarios' }],
          },
        ],
      },
    ],
  },
];

const VERSIONES = HORARIOS.flatMap((a) => a.grupos.flatMap((g) => g.versions));

/** Cuántas fichas hay entre todas las autorías: lo que cuenta el índice de arriba. */
export const HORARIOS_FICHAS = VERSIONES.length;

/**
 * Lo que Horarios ya enseña: el `id` de la tarjeta de cada rama y cada enlace. Una tarjeta de «Laboratorios» que
 * coincida en cualquiera de los dos sobra. El `id` la reconoce aunque al fundir su enlace pase a ser el de producción.
 */
export const HORARIOS_YA_ESTA: ReadonlySet<string> = new Set([
  ...VERSIONES.flatMap((v) => (v.tarjeta ? [v.tarjeta] : [])),
  ...VERSIONES.flatMap((v) => v.links.map((l) => l.href)),
]);
