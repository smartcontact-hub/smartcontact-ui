// @ts-check
/**
 * Las tipificaciones (DD-173), sin Angular: su árbol de hasta tres niveles, qué le falta para guardarse, con qué choca en un
 * grupo y cómo entra y sale de un CSV. Puro para probarlo con node:test (`scripts/__tests__/tipificaciones.test.mjs`);
 * lo usan el almacén (`tipificaciones.store.ts`), su listado, su ficha y la ficha de grupo.
 *
 * QUÉ ES UNA TIPIFICACIÓN. Lo que el agente rellena al acabar una conversación, antes de poder recibir otra: un árbol
 * de hasta tres niveles («Compra › Carne › Pollo»), un comentario, o los dos (manual de usuario de Voice, p. 14). En
 * Voice vive dentro de cada grupo; aquí es una ficha propia que se asigna a grupos, por dirección y por canal.
 *
 * DOS REGLAS DE PRODUCTO:
 * - todas las ramas llegan al mismo nivel: con tres niveles, toda opción del primero y del segundo tiene hijas;
 * - en un grupo, cada conversación sabe qué tipificación le toca: dos tipificaciones no pueden cubrir la misma
 *   dirección por el mismo canal del mismo grupo.
 */

/** Los niveles que puede tener el árbol. */
export const NIVELES_MAXIMOS = 3;

/** Las tipificaciones que caben en un archivo. Como en las agendas, la cuota de localStorage es una para todos. */
export const TOPE_DE_IMPORTACION = 500;

/* ── El árbol ───────────────────────────────────────────────────────────────────────────────────────────────────── */

/** Cuántos niveles pide al agente: los de su árbol si tiene categorización, y ninguno si solo pide comentario. */
export function nivelesDe(t) {
  return t.categorization ? t.levels : 0;
}

/** Cuántas opciones hay en cada nivel, del primero al último que se usa: `[3, 6, 18]`. */
export function opcionesPorNivel(opciones, niveles) {
  const cuenta = Array.from({ length: niveles }, () => 0);
  const recorrer = (lista, nivel) => {
    if (nivel >= niveles) return;
    cuenta[nivel] += lista.length;
    for (const o of lista) recorrer(o.children, nivel + 1);
  };
  recorrer(opciones, 0);
  return cuenta;
}

/**
 * Las ramas que no llegan al último nivel, por su camino de nombres (`['Compra', 'Carne']`): una opción por encima del
 * último nivel sin hijas. Un primer nivel vacío es la rama `[]`. Con cero niveles no falta nada.
 */
export function ramasIncompletas(opciones, niveles) {
  if (niveles <= 0) return [];
  if (opciones.length === 0) return [[]];
  const faltan = [];
  const recorrer = (lista, camino) => {
    for (const o of lista) {
      const aqui = [...camino, o.label];
      if (aqui.length >= niveles) continue;
      if (o.children.length === 0) faltan.push(aqui);
      else recorrer(o.children, aqui);
    }
  };
  recorrer(opciones, []);
  return faltan;
}

/** El árbol cortado a `niveles`, y cuántas opciones se quitan al cortarlo (las de debajo, con sus hijas). */
export function recortarANiveles(opciones, niveles) {
  let quitadas = 0;
  const contar = (lista) => lista.reduce((n, o) => n + 1 + contar(o.children), 0);
  const cortar = (lista, nivel) =>
    lista.map((o) => {
      if (nivel + 1 < niveles) return { ...o, children: cortar(o.children, nivel + 1) };
      quitadas += contar(o.children);
      return o.children.length ? { ...o, children: [] } : o;
    });
  const recortadas = cortar(opciones, 0);
  return { opciones: recortadas, quitadas };
}

/** Dos hermanas con el mismo nombre (sin mayúsculas ni espacios de los lados): el agente no sabría cuál es cuál.
 *  Devuelve el camino de cada repetida a partir de la segunda. */
export function hermanasRepetidas(opciones) {
  const repetidas = [];
  const recorrer = (lista, camino) => {
    const vistas = new Set();
    for (const o of lista) {
      const clave = o.label.trim().toLowerCase();
      if (vistas.has(clave)) repetidas.push([...camino, o.label]);
      vistas.add(clave);
      recorrer(o.children, [...camino, o.label]);
    }
  };
  recorrer(opciones, []);
  return repetidas;
}

/** Cuántas opciones tiene el árbol en total, contando las de todos los niveles. */
export function totalDeOpciones(opciones) {
  return opciones.reduce((n, o) => n + 1 + totalDeOpciones(o.children), 0);
}

/** Un id de opción que no está en el árbol: `o` y el siguiente número. Solo sirve para seguirle la pista al editarla. */
export function nuevoIdDeOpcion(opciones) {
  let max = 0;
  const recorrer = (lista) => {
    for (const o of lista) {
      const n = Number(String(o.id).replace(/^o/, ''));
      if (Number.isFinite(n) && n > max) max = n;
      recorrer(o.children);
    }
  };
  recorrer(opciones);
  return `o${max + 1}`;
}

/* ── Los grupos ─────────────────────────────────────────────────────────────────────────────────────────────────── */

/** Las direcciones que cubre, en orden: `['inbound', 'outbound']`. */
export function direccionesDe(t) {
  return /** @type {('inbound' | 'outbound')[]} */ ([t.inbound ? 'inbound' : null, t.outbound ? 'outbound' : null].filter(Boolean));
}

/**
 * Con qué choca una tipificación en sus grupos: otra del mismo grupo que cubre una de sus direcciones por uno de sus
 * canales. Una entrada por grupo, otra tipificación, dirección y canal. La propia (mismo id) no cuenta, así la ficha la
 * compara con lo guardado de las demás.
 */
export function choquesDe(tipificacion, todas) {
  const choques = [];
  const direcciones = direccionesDe(tipificacion);
  for (const enlace of tipificacion.groups) {
    for (const otra of todas) {
      if (otra.id === tipificacion.id) continue;
      const suyo = otra.groups.find((g) => g.groupId === enlace.groupId);
      if (!suyo) continue;
      for (const direction of direccionesDe(otra).filter((d) => direcciones.includes(d))) {
        for (const channel of enlace.channels.filter((c) => suyo.channels.includes(c))) {
          choques.push({ groupId: enlace.groupId, otherId: otra.id, otherName: otra.name, direction, channel });
        }
      }
    }
  }
  return choques;
}

/** Las tipificaciones de un grupo, cada una con los canales por los que se usa en él. */
export function tipificacionesDeGrupo(todas, groupId) {
  return todas.flatMap((t) => {
    const enlace = t.groups.find((g) => g.groupId === groupId);
    return enlace ? [{ tipificacion: t, channels: enlace.channels }] : [];
  });
}

/**
 * Asignar a un grupo, desde su ficha, las tipificaciones `ids`: a las que no lo tenían se les añade con los canales del
 * grupo (`familias`), y a las que lo tenían y ya no están se les quita. Las que siguen conservan sus canales. Devuelve
 * solo las tipificaciones que cambian.
 */
export function asignarAGrupo(todas, ids, groupId, familias) {
  const quiero = new Set(ids);
  const cambian = [];
  for (const t of todas) {
    const tiene = t.groups.some((g) => g.groupId === groupId);
    if (quiero.has(t.id) && !tiene) {
      cambian.push({ ...t, groups: [...t.groups, { groupId, channels: [...familias] }] });
    } else if (!quiero.has(t.id) && tiene) {
      cambian.push({ ...t, groups: t.groups.filter((g) => g.groupId !== groupId) });
    }
  }
  return cambian;
}

/**
 * Los canales de cada grupo, al día con lo que ofrece el grupo: se queda lo que el grupo sigue ofreciendo y un grupo
 * borrado sale. Devuelve el MISMO objeto si ya estaba al día, para que leer no invente cambios.
 * `familiasDe(groupId)` da las familias del grupo, o `null` si ya no existe.
 */
export function gruposAlDia(tipificacion, familiasDe) {
  let cambia = false;
  const groups = tipificacion.groups.flatMap((g) => {
    const familias = familiasDe(g.groupId);
    if (!familias) {
      cambia = true;
      return [];
    }
    const channels = g.channels.filter((c) => familias.includes(c));
    if (channels.length !== g.channels.length) cambia = true;
    return [channels.length === g.channels.length ? g : { ...g, channels }];
  });
  return cambia ? { ...tipificacion, groups } : tipificacion;
}

/* ── Importar y descargar ───────────────────────────────────────────────────────────────────────────────────────── */

/** Las palabras que se leen de una celda, en cualquiera de los cuatro idiomas de la app. */
const DIRECCIONES = {
  inbound: /^(entrantes?|inbound|entrants?|entradas?)$/i,
  outbound: /^(salientes?|outbound|sortants?|sa[ií]das?)$/i,
  both: /^(ambas|las dos|both|les deux|ambos|as duas)$/i,
};
const SI = /^(s[ií]|yes|oui|sim|y|s)$/i;
const NO = /^(no|non|n[aã]o|n)$/i;

/** La primera columna de la cabecera de la plantilla, en cualquiera de los cuatro idiomas. */
const CABECERA = /^(nombre|name|nom|nome)$/i;

/** La plantilla: la cabecera y nada más, con `;` y con BOM, como la de las agendas (DD-166). */
export function plantillaCsv(cabecera) {
  return `﻿${cabecera.join(';')}\r\n`;
}

/** Los campos de una línea; un campo entre comillas puede llevar el separador, y dentro `""` es una comilla. */
function campos(linea, separador) {
  const salida = [];
  let actual = '';
  let entreComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (entreComillas) {
      if (c === '"' && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else if (c === '"') entreComillas = false;
      else actual += c;
    } else if (c === '"') entreComillas = true;
    else if (c === separador) {
      salida.push(actual);
      actual = '';
    } else actual += c;
  }
  salida.push(actual);
  return salida.map((campo) => campo.trim());
}

/** La dirección de una celda: `{ inbound, outbound }`, o `null` si no se entiende. */
function leerDireccion(celda) {
  if (DIRECCIONES.both.test(celda)) return { inbound: true, outbound: true };
  if (DIRECCIONES.inbound.test(celda)) return { inbound: true, outbound: false };
  if (DIRECCIONES.outbound.test(celda)) return { inbound: false, outbound: true };
  return null;
}

/** Mete un camino en un árbol, sin repetir las opciones que ya están (por nombre, sin mayúsculas). */
function meterCamino(opciones, camino, siguienteId) {
  if (camino.length === 0) return opciones;
  const [cabeza, ...resto] = camino;
  const clave = cabeza.toLowerCase();
  const i = opciones.findIndex((o) => o.label.toLowerCase() === clave);
  if (i >= 0) {
    const copia = [...opciones];
    copia[i] = { ...opciones[i], children: meterCamino(opciones[i].children, resto, siguienteId) };
    return copia;
  }
  return [...opciones, { id: siguienteId(), label: cabeza, children: meterCamino([], resto, siguienteId) }];
}

/**
 * Lo que entra desde un CSV, una línea por camino del árbol, y lo que no:
 * - columnas: nombre; descripción; dirección; comentarios; nivel 1; nivel 2; nivel 3. Las líneas con el mismo nombre
 *   son la MISMA tipificación: la descripción, la dirección y los comentarios salen de su primera línea;
 * - el separador es el de la primera línea con datos (`;` si lo lleva), la cabecera de la plantilla en cualquier
 *   idioma y las líneas vacías no cuentan;
 * - errores, con su línea: sin nombre, una dirección que no se entiende, un hueco entre niveles (nivel 1 y nivel 3
 *   sin nivel 2), o una línea que no llega al mismo nivel que la primera de su tipificación (todas las ramas, al mismo
 *   nivel). Sin niveles ni comentarios, la tipificación no pide nada: también es un error;
 * - una tipificación con el nombre de una que ya existe se salta y se cuenta;
 * - lo que pasa del tope se cuenta en `sobran`.
 */
export function parsearTipificacionesCsv(texto, existentes, tope = TOPE_DE_IMPORTACION) {
  const resultado = { nuevas: [], errores: [], repetidas: 0, sobran: 0 };
  const yaEstan = new Set(existentes.map((t) => t.name.trim().toLowerCase()));
  /** @type {Map<string, any>} */
  const porNombre = new Map();
  const repetidasVistas = new Set();
  let separador = null;
  let id = 0;
  const siguienteId = () => `o${++id}`;

  String(texto ?? '')
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .forEach((linea, i) => {
      if (!linea.trim()) return;
      const primera = separador === null;
      separador ??= linea.includes(';') ? ';' : ',';
      const [name = '', description = '', direccion = '', comentarios = '', n1 = '', n2 = '', n3 = ''] = campos(linea, separador);
      if (primera && CABECERA.test(name)) return;
      const numero = i + 1;
      if (!name) return void resultado.errores.push({ linea: numero, motivo: 'nombre' });
      const clave = name.toLowerCase();
      if (yaEstan.has(clave)) {
        if (!repetidasVistas.has(clave)) resultado.repetidas++;
        repetidasVistas.add(clave);
        return;
      }
      const niveles = [n1, n2, n3];
      const hasta = niveles.reduce((ultimo, n, k) => (n ? k + 1 : ultimo), 0);
      if (niveles.slice(0, hasta).some((n) => !n)) return void resultado.errores.push({ linea: numero, motivo: 'hueco' });
      const camino = niveles.slice(0, hasta);

      let t = porNombre.get(clave);
      if (!t) {
        const dir = leerDireccion(direccion);
        if (!dir) return void resultado.errores.push({ linea: numero, motivo: 'direccion' });
        const comments = SI.test(comentarios) ? true : NO.test(comentarios) || !comentarios ? false : null;
        if (comments === null) return void resultado.errores.push({ linea: numero, motivo: 'comentarios' });
        if (hasta === 0 && !comments) return void resultado.errores.push({ linea: numero, motivo: 'vacia' });
        if (porNombre.size >= tope) return void resultado.sobran++;
        t = {
          name,
          description,
          ...dir,
          comments,
          categorization: hasta > 0,
          levels: Math.max(1, hasta),
          options: [],
          groups: [],
          linea: numero,
        };
        porNombre.set(clave, t);
      } else if ((t.categorization ? t.levels : 0) !== hasta) {
        return void resultado.errores.push({ linea: numero, motivo: 'nivel' });
      }
      t.options = meterCamino(t.options, camino, siguienteId);
    });

  resultado.nuevas = [...porNombre.values()].map(({ linea: _linea, ...t }) => t);
  return resultado;
}

/**
 * Las filas para descargar, con las columnas de la plantilla: una por camino del árbol, y una sola si solo pide
 * comentario. `textos` traduce la dirección (`inbound`, `outbound`, `both`) y los comentarios (`yes`, `no`).
 */
export function filasParaDescargar(tipificaciones, textos) {
  return tipificaciones.flatMap((t) => {
    const direccion = t.inbound && t.outbound ? textos.both : t.inbound ? textos.inbound : textos.outbound;
    const cabeza = [t.name, t.description, direccion, t.comments ? textos.yes : textos.no];
    const niveles = nivelesDe(t);
    if (niveles === 0) return [[...cabeza, '', '', '']];
    const filas = [];
    const recorrer = (lista, camino) => {
      for (const o of lista) {
        const aqui = [...camino, o.label];
        if (aqui.length >= niveles || o.children.length === 0) {
          filas.push([...cabeza, ...aqui, ...Array(NIVELES_MAXIMOS - aqui.length).fill('')]);
        } else recorrer(o.children, aqui);
      }
    };
    recorrer(t.options, []);
    return filas.length ? filas : [[...cabeza, '', '', '']];
  });
}
