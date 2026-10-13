/**
 * «Todas las combinaciones» de una ficha de sc-docs: la rejilla que pinta el Playground con cada valor de dos o tres
 * de sus controles a la vez. PURO, sin Angular, para que `node:test` lo pruebe dentro de `test:unit`.
 *
 * Por qué existe: los ejemplos de una ficha enseñan lo que alguien eligió enseñar, y el Playground, una combinación
 * cada vez. Lo que se escapa es el cruce: el botón `help` con borde y pequeño, el `plain` cargando. La rejilla los saca
 * todos, con el resto de controles como estén en el Playground (un texto larguísimo ahí, y se ve en las 108).
 *
 * Los ejes salen solos de los controles que tienen valores contados: los desplegables (`select`) y los interruptores
 * (`boolean`). El texto y los números no: no hay una lista de valores que recorrer.
 */

/** Más casillas que esto no se pintan: la página se arrastra y nadie las mira todas. Se pide fijar un eje. */
export const MAX_CELDAS = 400;

/** Los controles que pueden ser un eje, en el orden de la ficha, con sus valores. */
export function ejesCandidatos(argTypes) {
  const ejes = [];
  for (const a of argTypes ?? []) {
    if (a.control?.kind === 'select' && a.control.options?.length > 1) ejes.push({ nombre: a.name, valores: [...a.control.options] });
    else if (a.control?.kind === 'boolean') ejes.push({ nombre: a.name, valores: [false, true] });
  }
  return ejes;
}

/**
 * Los ejes con que abre: los desplegables antes que los interruptores (dicen más del componente), en el orden de la
 * ficha. Filas, columnas y, si hay un tercero, grupos. `null` donde no hay eje.
 */
export function ejesPorDefecto(candidatos) {
  const esInterruptor = (e) => typeof e.valores[0] === 'boolean';
  const orden = [...candidatos.filter((e) => !esInterruptor(e)), ...candidatos.filter(esInterruptor)].map((e) => e.nombre);
  return { filas: orden[0] ?? null, columnas: orden[1] ?? null, grupos: orden[2] ?? null };
}

/** Cuántas casillas salen con esos ejes (un eje vacío o repetido no multiplica). */
export function contarCeldas(ejes, candidatos) {
  const por = new Map(candidatos.map((e) => [e.nombre, e.valores.length]));
  const usados = [...new Set([ejes.filas, ejes.columnas, ejes.grupos].filter(Boolean))];
  return usados.reduce((n, nombre) => n * (por.get(nombre) ?? 1), usados.length ? 1 : 0);
}

/**
 * La rejilla: grupos → filas → casillas, cada casilla con los args que cambia respecto a la base. Un eje repetido
 * cuenta una vez (filas y columnas iguales darían una diagonal sin sentido: se queda en filas).
 * `imposible(args)` marca las combinaciones que no existen (el `plain` relleno del botón): se pintan como hueco.
 */
export function construirRejilla(ejes, candidatos, base = {}, imposible = () => false) {
  const valoresDe = (nombre) => candidatos.find((e) => e.nombre === nombre)?.valores ?? [undefined];
  const filas = ejes.filas;
  const columnas = ejes.columnas && ejes.columnas !== filas ? ejes.columnas : null;
  const grupos = ejes.grupos && ejes.grupos !== filas && ejes.grupos !== columnas ? ejes.grupos : null;

  const fijar = (args, nombre, valor) => (nombre ? { ...args, [nombre]: valor } : args);

  return (grupos ? valoresDe(grupos) : [undefined]).map((g) => ({
    valor: g,
    filas: (filas ? valoresDe(filas) : [undefined]).map((f) => ({
      valor: f,
      celdas: (columnas ? valoresDe(columnas) : [undefined]).map((c) => {
        const args = fijar(fijar(fijar({ ...base }, grupos, g), filas, f), columnas, c);
        return { valor: c, args, imposible: !!imposible(args) };
      }),
    })),
  }));
}
