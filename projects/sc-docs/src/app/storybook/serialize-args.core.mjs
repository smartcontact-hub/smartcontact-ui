/**
 * El código que enseña una story de sc-docs sin snippet propio: el tag con los args que tiene puestos. PURO y
 * determinista (el orden es el de `argTypes`), sin Angular, para que `node:test` lo pruebe dentro de `test:unit`.
 *
 * Escribe lo justo para obtener lo mismo, como Storybook:
 *   - lo vacío (`null`, `undefined`, `''`) no se escribe nunca;
 *   - lo que vale su valor por defecto, tampoco. Con el contrato del componente (`porDefecto`: el literal del código,
 *     tal como lo genera `audit:components`), se compara con él, así que un booleano que nace `true` y se apaga SÍ se
 *     escribe. Sin contrato (aún cargando) o sin valor por defecto legible, se omite `false`, como antes.
 *
 * Va en varias líneas si lleva más de 3 atributos o si en una pasa de 80.
 *
 *   serializeArgs({ tag: 'sc-button', … }, { label: 'Guardar', variant: 'primary', loading: true }, { variant: "'primary'" })
 *   → `<sc-button label="Guardar" [loading]="true" />`
 */

/** Más de 80 en una línea se lee mal en la caja del código: pasa a una por atributo. */
const ANCHO_MAX = 80;

/** Cómo se emite un arg: atributo string, binding `[prop]`, o contenido proyectado. */
function emitMode(argType, value) {
  if (argType.emit) return argType.emit;
  return typeof value === 'string' ? 'attr' : 'prop';
}

/** Literal para un binding `[prop]="…"`: strings entre comillas simples, resto tal cual. Es también como escribe el
 *  contrato su `porDefecto` (`'md'`, `0`, `false`), así que sirve para compararlos. */
function propLiteral(value) {
  return typeof value === 'string' ? `'${value}'` : String(value);
}

const vacio = (value) => value === '' || value === null || value === undefined;

/** ¿Escribirlo cambiaría algo? No, si es lo que el componente ya tiene sin escribirlo. */
function sobra(name, value, porDefecto) {
  if (vacio(value)) return true;
  const literal = porDefecto?.[name];
  if (typeof literal === 'string') return propLiteral(value) === literal;
  return value === false;
}

export function serializeArgs(meta, args, porDefecto) {
  const attrs = [];
  const slots = [];

  for (const argType of meta.argTypes) {
    const value = args[argType.name];
    const mode = emitMode(argType, value);

    if (mode === 'slot') {
      if (typeof value === 'string' && value !== '') slots.push(value);
      continue;
    }
    if (sobra(argType.name, value, porDefecto)) continue;

    if (mode === 'attr') attrs.push(`${argType.name}="${value}"`);
    else attrs.push(`[${argType.name}]="${propLiteral(value)}"`);
  }

  const { tag } = meta;
  const inner = slots.join('');
  const enUna = `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}${inner ? `>${inner}</${tag}>` : ' />'}`;
  if (!attrs.length || (attrs.length <= 3 && enUna.length <= ANCHO_MAX)) return enUna;

  const open = `<${tag}\n  ${attrs.join('\n  ')}\n`;
  return inner ? `${open}>${inner}</${tag}>` : `${open}/>`;
}
