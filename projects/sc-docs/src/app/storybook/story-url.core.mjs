/**
 * El ENLACE de una story: su nombre en la URL y los valores de sus controles. PURO, sin Angular, para que `node:test`
 * lo pruebe dentro de `test:unit` y para que lo lean igual el motor, `docs:ia` (la ficha en texto de cada componente) y
 * `docs:capturas` (una captura por story).
 *
 * Por qué existe: hasta aquí una story no tenía dirección. Para enseñarle a alguien «el botón danger cargando» había que
 * decirle qué controles tocar; un agente no podía abrir un ejemplo concreto ni capturarlo sin el marco de la web.
 *
 *   /#/components/button?historia=variantes                    → la página, bajando hasta «Variantes»
 *   /#/components/button?historia=playground&args=variant:danger;loading:!true
 *   /#/components/button?historia=variantes&solo=1             → SOLO esa story, sin barra lateral (capturas, iframes)
 *
 * El formato de `args` es el de Storybook, para que se lea: `clave:valor` separados por `;`; lo que no es texto va con
 * `!` delante (`!true`, `!false`, `!null`, `!12`). En el texto se escapan `%`, `;`, `:` y un `!` inicial.
 */

/** Nombre de story → segmento de URL: minúsculas, sin acentos, lo demás a guiones. «Solo icono» → `solo-icono`. */
export function slugHistoria(nombre) {
  return String(nombre)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const escapar = (texto) =>
  texto.replace(/%/g, '%25').replace(/;/g, '%3B').replace(/:/g, '%3A').replace(/^!/, '%21');

function literal(valor) {
  if (typeof valor === 'string') return escapar(valor);
  if (valor === null) return '!null';
  if (typeof valor === 'boolean' || typeof valor === 'number') return `!${valor}`;
  return null; // objetos y funciones no viajan en una URL: se quedan con su valor de la story
}

/**
 * Los args que DIFIEREN de `base` (los de la story), en el formato de arriba y en el orden de `orden` (los `argTypes`):
 * un enlace con solo lo que cambia se lee de un vistazo. Cadena vacía si no cambia nada.
 */
export function codificarArgs(args, base = {}, orden = Object.keys(args)) {
  const partes = [];
  for (const clave of orden) {
    if (!(clave in args) || Object.is(args[clave], base[clave])) continue;
    const valor = literal(args[clave]);
    if (valor !== null) partes.push(`${clave}:${valor}`);
  }
  return partes.join(';');
}

function leerLiteral(texto) {
  if (!texto.startsWith('!')) return decodeURIComponent(texto);
  const resto = texto.slice(1);
  if (resto === 'true') return true;
  if (resto === 'false') return false;
  if (resto === 'null') return null;
  const n = Number(resto);
  return Number.isFinite(n) && resto.trim() !== '' ? n : decodeURIComponent(texto);
}

/**
 * Lo inverso de `codificarArgs`. Con `permitidos`, descarta las claves que no son controles de la story: una URL
 * vieja o tecleada no puede meterle al componente un input que su página no expone.
 */
export function decodificarArgs(texto, permitidos) {
  const args = {};
  if (!texto) return args;
  const vale = permitidos ? new Set(permitidos) : null;
  for (const parte of String(texto).split(';')) {
    const i = parte.indexOf(':');
    if (i <= 0) continue;
    const clave = parte.slice(0, i);
    if (vale && !vale.has(clave)) continue;
    try {
      args[clave] = leerLiteral(parte.slice(i + 1));
    } catch {
      // un `%` suelto que no decodifica: se ignora ese arg, no la URL entera
    }
  }
  return args;
}

/**
 * La URL de una story, relativa a la raíz de sc-docs (`#/components/…`). `pagina` es el segmento de la ruta del
 * componente (`button`, `inputtext`). Con `solo`, la story sola, sin marco.
 */
export function urlDeHistoria({ pagina, historia, args = '', solo = false, extra = {} }) {
  const q = new URLSearchParams();
  q.set('historia', historia);
  if (args) q.set('args', args);
  if (solo) q.set('solo', '1');
  for (const [k, v] of Object.entries(extra)) if (v) q.set(k, v);
  return `#/components/${pagina}?${q.toString()}`;
}
