// @ts-check
/**
 * Las tipificaciones (DD-173), sin Angular: su árbol de hasta tres niveles, qué le falta para guardarse y cómo entra y
 * sale de un CSV. Puro para probarlo con node:test (`scripts/__tests__/tipificaciones.test.mjs`);
 * lo usan el almacén (`tipificaciones.store.ts`), su listado, su ficha y la ficha de grupo.
 *
 * QUÉ ES UNA TIPIFICACIÓN. El árbol que el agente rellena al acabar una conversación, de hasta tres niveles
 * («Compra › Carne › Pollo»; manual de usuario de Voice, p. 14). Solo eso: su nombre, su descripción y su árbol. Si
 * un grupo clasifica sus conversaciones, con cuál, en cuáles (todas, entrantes o salientes) y si pide un comentario lo
 * decide el GRUPO, en su General (revisión de tipificaciones del 2026-10-09). Hasta ese día la tipificación llevaba su
 * dirección, su comentario y sus grupos por canal (DD-173).
 *
 * Cada rama llega hasta donde haga falta, hasta tres niveles: «Consulta › Facturación › Importe» y «Baja» pueden
 * convivir, como en Voice (revisión de tipificaciones del 2026-10-09). Hasta ese día todas las ramas tenían que llegar
 * al mismo nivel (DD-173), y una rama corta no dejaba guardar.
 */

/** Los niveles que puede tener el árbol. */
export const NIVELES_MAXIMOS = 3;

/** Las tipificaciones que caben en un archivo. Como en las agendas, la cuota de localStorage es una para todos. */
export const TOPE_DE_IMPORTACION = 500;

/* ── El árbol ───────────────────────────────────────────────────────────────────────────────────────────────────── */

/** Cuántos niveles pide al agente: los de su árbol. */
export function nivelesDe(t) {
  return t.levels;
}

/** Hasta qué nivel llega la rama más larga, de 1 a 3: los niveles de la tipificación. Sin opciones, 1. */
export function profundidad(opciones) {
  const hasta = (lista) => (lista.length === 0 ? 0 : 1 + Math.max(...lista.map((o) => hasta(o.children))));
  return Math.min(NIVELES_MAXIMOS, Math.max(1, hasta(opciones)));
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

/* ── Importar y descargar ───────────────────────────────────────────────────────────────────────────────────────── */

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
 * - columnas: nombre; descripción; nivel 1; nivel 2; nivel 3. Las líneas con el mismo nombre son la MISMA
 *   tipificación: la descripción sale de su primera línea, y sus niveles son los de su línea más larga;
 * - el separador es el de la primera línea con datos (`;` si lo lleva), la cabecera de la plantilla en cualquier
 *   idioma y las líneas vacías no cuentan;
 * - errores, con su línea: sin nombre, sin ningún nivel, o un hueco entre niveles (nivel 1 y nivel 3 sin nivel 2);
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
      const [name = '', description = '', n1 = '', n2 = '', n3 = ''] = campos(linea, separador);
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

      if (hasta === 0) return void resultado.errores.push({ linea: numero, motivo: 'vacia' });

      let t = porNombre.get(clave);
      if (!t) {
        if (porNombre.size >= tope) return void resultado.sobran++;
        t = { name, description, levels: hasta, options: [], linea: numero };
        porNombre.set(clave, t);
      } else {
        t.levels = Math.max(t.levels, hasta);
      }
      t.options = meterCamino(t.options, camino, siguienteId);
    });

  resultado.nuevas = [...porNombre.values()].map(({ linea: _linea, ...t }) => t);
  return resultado;
}

/** Las filas para descargar, con las columnas de la plantilla: una por camino del árbol. */
export function filasParaDescargar(tipificaciones) {
  return tipificaciones.flatMap((t) => {
    const cabeza = [t.name, t.description];
    const niveles = nivelesDe(t);
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
