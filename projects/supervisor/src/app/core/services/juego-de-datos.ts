/**
 * JUEGO DE DATOS DE LA DEMO — el mismo Supervisor con otros datos, sin tocar los de siempre (DD-124).
 *
 *   ?datos=tortura   los textos al límite: nombres, títulos y correos muy largos, y la mitad de las
 *                    descripciones vacías. Para ver una pantalla donde se rompe, no donde luce.
 *   ?datos=editorial los grupos con nombres de negocio («Atención al cliente», «Facturación»…) en vez
 *                    de los de producción y prueba. Para juzgar cómo luce y para enseñarla.
 *   ?datos=demo      vuelve a los de siempre.
 *
 * Por qué: una pantalla se juzga con los datos que tiene delante, y los de la demo miden todos de 7 a
 * 18 letras y no tienen un solo vacío (500 agentes medidos el 2026-09-27). Con ellos no se ve una
 * columna que envuelve ni un hueco que se queda sin dato.
 *
 * Cómo: lo aplica `createVersionedStorage`, por donde pasan todos los almacenes persistidos (agentes,
 * grupos, usuarios, etiquetas, plantillas, repositorios, monitores), así que ninguna pantalla lo sabe.
 * Lo que vive en memoria y repite un nombre (las conversaciones, los widgets del Dashboard) lo toma de
 * `nombreDeGrupo`, `nombreDePersona` y `nombreDeCosa`, que dan el mismo nombre que el almacén.
 * Cada juego guarda en SUS claves (`sc-agents@tortura`): probar uno no pisa lo editado en el otro. La
 * elección se recuerda en `sessionStorage`: sobrevive a recargar y no a cerrar la pestaña, para que nadie
 * se quede en tortura sin saberlo.
 */
export type JuegoDeDatos = 'demo' | 'tortura' | 'editorial';

/** Los juegos, en el orden en que se ofrecen: el de siempre, el que se enseña y el que estresa. */
export const JUEGOS_DE_DATOS: readonly JuegoDeDatos[] = ['demo', 'editorial', 'tortura'];
const CLAVE_SESION = 'sc-datos';

const esJuego = (v: string | null): v is JuegoDeDatos => v !== null && (JUEGOS_DE_DATOS as readonly string[]).includes(v);

/** El juego pedido en la URL (y lo recuerda), o el de la sesión, o `demo`. */
export function juegoDeDatos(): JuegoDeDatos {
  if (typeof window === 'undefined') return 'demo';
  try {
    const pedido = new URLSearchParams(window.location.search).get('datos');
    if (esJuego(pedido)) {
      recordarJuego(pedido);
      return pedido;
    }
    const guardado = window.sessionStorage.getItem(CLAVE_SESION);
    return esJuego(guardado) ? guardado : 'demo';
  } catch {
    return 'demo'; // almacenamiento bloqueado: los datos de siempre
  }
}

/** Lo recuerda la pestaña, como al entrar con `?datos=`. Sin almacenamiento, manda solo la dirección. */
export function recordarJuego(juego: JuegoDeDatos): void {
  try {
    window.sessionStorage.setItem(CLAVE_SESION, juego);
  } catch {
    // almacenamiento bloqueado
  }
}

/**
 * La dirección de la página actual con otro juego (`?datos=`). Se cambia NAVEGANDO y no escribiendo en la
 * sesión: el parámetro manda sobre lo recordado, así que con `?datos=tortura` en la barra, recargar después de
 * elegir otro juego volvería a tortura. Y al abrir la dirección, los almacenes arrancan con el juego nuevo.
 */
export const direccionConJuego = (href: string, juego: JuegoDeDatos): string => {
  const url = new URL(href);
  url.searchParams.set('datos', juego);
  return url.toString();
};

/** La clave de almacenamiento de un juego: la de siempre para `demo`, con sufijo para los demás. */
export const claveDelJuego = (clave: string, juego: JuegoDeDatos): string =>
  juego === 'demo' ? clave : `${clave}@${juego}`;

/** Un apellido compuesto de verdad: el largo que tiene un nombre español real, no uno inventado. */
const COLA_PERSONA = ' Fernández-Villaverde de la Concepción';
const COLA_COSA = ' — atención de incidencias de segundo nivel en horario extendido';
const DESCRIPCION_LARGA =
  'Descripción larga a propósito: cubre el caso de quien documenta con detalle para qué sirve esto, ' +
  'cuándo se usa, quién lo mantiene y qué excepciones tiene, en una sola frase que no cabe en una línea.';
const CORREO_LARGO = '.atencion-al-cliente-internacional';

/**
 * Estira los textos de cada elemento sin tocar su forma: `name` y `title` más largos (con cola de
 * persona si el elemento tiene correo), el correo más largo, y la descripción larga en los pares y
 * VACÍA en los impares. Ni ids, ni códigos, ni referencias: las relaciones entre almacenes siguen igual.
 */
export function torturar<T>(items: readonly T[]): readonly T[] {
  return items.map((item, i) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
    const o: Record<string, unknown> = { ...(item as Record<string, unknown>) };
    const persona = typeof o['email'] === 'string';
    for (const campo of ['name', 'title']) {
      if (typeof o[campo] === 'string') o[campo] = `${o[campo]}${persona ? COLA_PERSONA : COLA_COSA}`;
    }
    if (typeof o['description'] === 'string') o['description'] = i % 2 ? '' : DESCRIPCION_LARGA;
    if (typeof o['email'] === 'string') o['email'] = (o['email'] as string).replace('@', `${CORREO_LARGO}@`);
    return o as T;
  });
}

/**
 * Los grupos del juego editorial, por su nombre de siempre: cada uno toma el nombre de negocio que
 * encaja con sus servicios y sus canales («Online Support», soporte técnico y web por los cuatro
 * canales, es «Soporte técnico»). La clave es el NOMBRE y no el id porque el nombre se repite fuera
 * del almacén de grupos: el grupo saliente del agente, la ficha de usuario, los filtros y las
 * conversaciones de Conversaciones y las entidades del Dashboard.
 */
const GRUPOS_EDITORIALES: Readonly<Record<string, string>> = {
  'ACD Demo C2CB': 'Atención al cliente',
  'ACD demo cuscare': 'Bajas',
  'ACD outbound': 'Campañas salientes',
  Campaigns: 'Ventas',
  Exclusivo: 'Clientes VIP',
  'Grupo de prueba 1': 'Citas y reservas',
  'Grupo de prueba 2': 'Distribuidores',
  'Grupo demo': 'Retención',
  'Grupo pedidos': 'Posventa',
  'Nodo AED 1': 'Facturación',
  'Online Support': 'Soporte técnico',
  Reclamaciones: 'Incidencias',
  'Soporte Taller': 'Segundo nivel',
  Telemarketing: 'Cobros',
  // Las colas que solo viven en Conversaciones (no están en el almacén de grupos). Sin nombre de negocio, el juego
  // para enseñar la app enseñaba «COLA_PRUEBA» (revisión con `--datos editorial`, 2026-09-27). «Clientes vip» es el
  // grupo VIP, el mismo nombre que toma «Exclusivo».
  'Soporte Nivel 1': 'Primer nivel',
  'Soporte Nivel 2': 'Escalados',
  'Clientes vip': 'Clientes VIP',
  COLA_PRUEBA: 'Desbordamiento',
};

/** El nombre de una persona en el juego activo: con el apellido compuesto de `torturar` en tortura. */
export const nombreDePersona = (nombre: string, juego: JuegoDeDatos = juegoDeDatos()): string =>
  juego === 'tortura' ? `${nombre}${COLA_PERSONA}` : nombre;

/** El nombre de una cosa (un servicio, una intención, una campaña) en el juego activo: estirado en tortura. */
export const nombreDeCosa = (nombre: string, juego: JuegoDeDatos = juegoDeDatos()): string =>
  juego === 'tortura' ? `${nombre}${COLA_COSA}` : nombre;

/** El nombre de un grupo en el juego activo: el de negocio en el editorial, el estirado en tortura (el mismo que
 *  da `torturar` al almacén de grupos), y si no, el mismo. */
export const nombreDeGrupo = (nombre: string, juego: JuegoDeDatos = juegoDeDatos()): string =>
  juego === 'editorial' ? (GRUPOS_EDITORIALES[nombre] ?? nombre) : nombreDeCosa(nombre, juego);

/**
 * Los servicios de Conversaciones en el juego editorial: el MOTIVO por el que se llama, distinto del equipo que
 * atiende (los grupos), para que las columnas Servicio y Grupo no digan lo mismo. Sin ellos, la demo para enseñar
 * la app enseñaba «DV: Smart Contact», con prefijo de producción (revisión editorial, 2026-09-27). Ninguno coincide
 * con un nombre de grupo del editorial.
 */
const SERVICIOS_EDITORIALES: Readonly<Record<string, string>> = {
  'DV: Smart Contact': 'Información general',
  'Atención al Cliente': 'Consultas',
  'Soporte Técnico': 'Averías',
  'Ventas Comercial': 'Contratación',
  Postventa: 'Instalaciones',
};

/** El nombre de un servicio en el juego activo: el editorial si toca, el estirado en tortura, y si no, el mismo. */
export const nombreDeServicio = (nombre: string, juego: JuegoDeDatos = juegoDeDatos()): string =>
  juego === 'editorial' ? (SERVICIOS_EDITORIALES[nombre] ?? nombre) : nombreDeCosa(nombre, juego);

/**
 * Los campos que guardan el NOMBRE de un grupo. Solo esos: «Reclamaciones» también es un servicio
 * (`services` del grupo 12) y ahí no se toca, que el catálogo de servicios sigue diciéndolo así.
 */
const CAMPOS_DE_GRUPO = ['name', 'group', 'defaultOutboundGroup'] as const;

/** Renombra los grupos de cada elemento sin tocar su forma, como `torturar`: ids y referencias, igual. */
function renombrarGrupos<T>(items: readonly T[], juego: JuegoDeDatos): readonly T[] {
  return items.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
    const o: Record<string, unknown> = { ...(item as Record<string, unknown>) };
    for (const campo of CAMPOS_DE_GRUPO) {
      const v = o[campo];
      if (typeof v === 'string') o[campo] = nombreDeGrupo(v, juego);
    }
    return o as T;
  });
}

/** Los grupos con su nombre de negocio: lo que aplica `createVersionedStorage` con `?datos=editorial`. */
export const editorializar = <T>(items: readonly T[]): readonly T[] => renombrarGrupos(items, 'editorial');

/**
 * Lo mismo para los datos que NO pasan por un almacén (viven en memoria: la ficha de usuario, las
 * conversaciones, el Dashboard) y repiten el nombre de un grupo: el de negocio en el editorial, el
 * estirado en tortura, y la misma lista con los datos de siempre.
 */
export const deGrupos = <T>(items: readonly T[]): readonly T[] => {
  const juego = juegoDeDatos();
  return juego === 'demo' ? items : renombrarGrupos(items, juego);
};
