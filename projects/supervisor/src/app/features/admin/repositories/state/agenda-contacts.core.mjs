// @ts-check
/**
 * Los contactos de una agenda, sin Angular: cómo se valida y se compara un teléfono, y cómo se lee lo que las agendas
 * guardaban antes. Puro para probarlo con node:test (`scripts/__tests__/agenda-contacts.test.mjs`); lo usan el
 * almacén de agendas (`agendas.store.ts`), su editor y la tabla de contactos.
 *
 * POR QUÉ (DD-163). Hasta el 2026-10-04 una agenda era un texto con números separados por comas. La agenda es lo que
 * el agente ve en la sección Agenda de su teléfono, con el nombre de cada número: una lista de contactos.
 */

/** Lo que se compara de un teléfono para saber si está repetido: solo las cifras, y el `+` de delante si lo lleva.
 *  Se GUARDA como se escribió («900 100 200»): esto solo sirve para comparar. */
export function normalizarTelefono(telefono) {
  const t = String(telefono ?? '').trim();
  return (t.startsWith('+') ? '+' : '') + t.replace(/\D/g, '');
}

/** La forma de un teléfono, sin contar sus cifras: un `+` delante y luego cifras, espacios, guiones, puntos o paréntesis. */
const FORMA_DE_TELEFONO = /^\+?[\d\s().-]+$/;

/** Un teléfono vale con un `+` opcional y entre 3 y 15 cifras (15 es el máximo internacional; 3 deja pasar
 *  extensiones y números cortos). Se admiten espacios, guiones, puntos y paréntesis entre las cifras. */
export function telefonoValido(telefono) {
  const t = String(telefono ?? '').trim();
  if (!FORMA_DE_TELEFONO.test(t)) return false;
  const cifras = t.replace(/\D/g, '').length;
  return cifras >= 3 && cifras <= 15;
}

/** ¿Encuentra la búsqueda este contacto? Como en las listas, por subcadena y sin mayúsculas, en el nombre y en el
 *  teléfono tal como se escribió. Y si lo buscado tiene forma de teléfono, también por sus cifras, como se comparan los
 *  repetidos: «900100200» encuentra «900 100 200». Un texto con cifras («ventas 2») no es un teléfono. */
export function contactoCoincide(contacto, busqueda) {
  const q = String(busqueda ?? '').trim().toLowerCase();
  if (!q) return true;
  if (contacto.name.toLowerCase().includes(q) || contacto.phone.includes(q)) return true;
  const cifras = normalizarTelefono(q);
  return FORMA_DE_TELEFONO.test(q) && /\d/.test(cifras) && normalizarTelefono(contacto.phone).includes(cifras);
}

/** Lo que guardaban las agendas antes de DD-163 (un texto con comas): un contacto por número, con el nombre vacío
 *  (la vista dice «Sin nombre»; la frase no se guarda, para que no dependa del idioma). Un número repetido entra una
 *  vez: en la agenda nueva no puede haber dos contactos con el mismo teléfono. */
export function contactosDeNumeros(numeros) {
  const vistos = new Set();
  const contactos = [];
  for (const trozo of String(numeros ?? '').split(/[,;\n]/)) {
    const phone = trozo.trim();
    const clave = normalizarTelefono(phone);
    if (!phone || vistos.has(clave)) continue;
    vistos.add(clave);
    contactos.push({ id: contactos.length + 1, name: '', phone });
  }
  return contactos;
}

/* ── Importar desde un CSV (DD-166) ─────────────────────────────────────────────────────────────────────────────── */

/** Los contactos que caben en una agenda. La cuota de localStorage es una para todos los almacenes, y lo que la pasa se
 *  pierde sin avisar (`local-store.factory.ts`): una agenda de 5000 contactos ocupa unos 250 KB. */
export const TOPE_DE_CONTACTOS = 5000;

/** La primera columna de la cabecera de la plantilla, en cualquiera de los cuatro idiomas de la app. */
const CABECERA = /^(nombre|name|nom|nome)$/i;

/** La plantilla: la cabecera y nada más, con `;` (lo que espera Excel en español) y con BOM, para que Excel la abra
 *  como UTF-8 y no estropee las tildes. */
export function plantillaCsv(nombre, telefono) {
  return `\uFEFF${nombre};${telefono}\r\n`;
}

/** El texto de un CSV leído en bytes: UTF-8 si lo es (con o sin BOM) y, si no, windows-1252, que es como guarda Excel en
 *  español. Leído siempre como UTF-8, «Señal» llegaba como «Se�al». */
export function decodificarCsv(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

/** Los campos de una línea. Un campo entre comillas puede llevar el separador, y dentro `""` es una comilla. Un campo
 *  entre comillas no puede partir la línea: un contacto no lo necesita. */
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

/**
 * Lo que entra en una agenda desde un CSV, una línea por contacto con su nombre y su teléfono, y lo que no:
 * - el separador es el de la primera línea con datos: `;` si lo lleva (Excel en español), si no `,`;
 * - la cabecera de la plantilla, en cualquier idioma, y las líneas vacías no cuentan;
 * - una línea sin nombre, o con un teléfono que no vale, es un error, con su número de línea en el archivo. La regla es
 *   la del diálogo: todo contacto que se crea lleva nombre;
 * - un teléfono que ya está en la agenda, o que se repite en el archivo, se salta y se cuenta (se compara por cifras);
 * - lo que pasaría la agenda del tope se cuenta en `sobran` y no entra.
 */
export function parsearContactosCsv(texto, existentes, tope = TOPE_DE_CONTACTOS) {
  const resultado = { nuevos: [], errores: [], repetidos: 0, sobran: 0 };
  const vistos = new Set(existentes.map((c) => normalizarTelefono(c.phone)));
  const sitio = Math.max(0, tope - existentes.length);
  let separador = null;
  String(texto ?? '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .forEach((linea, i) => {
      if (!linea.trim()) return;
      const primera = separador === null;
      separador ??= linea.includes(';') ? ';' : ',';
      const [name = '', phone = ''] = campos(linea, separador);
      if (primera && CABECERA.test(name)) return;
      if (!name) return void resultado.errores.push({ linea: i + 1, motivo: 'nombre' });
      if (!telefonoValido(phone)) return void resultado.errores.push({ linea: i + 1, motivo: 'telefono' });
      const clave = normalizarTelefono(phone);
      if (vistos.has(clave)) return void resultado.repetidos++;
      if (resultado.nuevos.length >= sitio) return void resultado.sobran++;
      vistos.add(clave);
      resultado.nuevos.push({ name, phone });
    });
  return resultado;
}

