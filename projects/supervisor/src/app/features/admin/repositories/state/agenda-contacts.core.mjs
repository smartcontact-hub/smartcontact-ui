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

/** Lo que busca la búsqueda de texto además del teléfono: lo que se lee en la tabla. */
const BUSCABLES = ['name', 'surname', 'company', 'position', 'emailWork', 'emailPersonal', 'emailOther'];

/** ¿Encuentra la búsqueda este contacto? Como en las listas, por subcadena y sin mayúsculas, en el nombre y en el
 *  teléfono tal como se escribió. Y si lo buscado tiene forma de teléfono, también por sus cifras, como se comparan los
 *  repetidos: «900100200» encuentra «900 100 200». Un texto con cifras («ventas 2») no es un teléfono. */
export function contactoCoincide(contacto, busqueda) {
  const q = String(busqueda ?? '').trim().toLowerCase();
  if (!q) return true;
  if (contacto.phone.includes(q)) return true;
  for (const clave of BUSCABLES) if (String(contacto[clave] ?? '').toLowerCase().includes(q)) return true;
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

/* ── Los campos de un contacto ──────────────────────────────────────────────────────────────────────────────────── */

/**
 * Los campos de un contacto y cómo se agrupan en su formulario, en el orden del formulario de Voice. `name` y `phone`
 * son los de siempre y los únicos obligatorios: son los que coinciden con los del puesto de agente. El resto, opcional.
 * `phone` es el «Teléfono trabajo» de Voice. Los cinco `custom` llevan una etiqueta que se edita en cada agenda.
 */
export const SECCIONES_DE_CONTACTO = [
  { seccion: 'datos', campos: ['name', 'surname', 'company', 'position', 'website'] },
  { seccion: 'telefonos', campos: ['phone', 'phoneHome', 'phonePersonal', 'phoneOther', 'fax'] },
  { seccion: 'emails', campos: ['emailWork', 'emailPersonal', 'emailOther'] },
  { seccion: 'trabajo', campos: ['workAddress', 'workZip', 'workCity', 'workProvince', 'workCountry'] },
  { seccion: 'personal', campos: ['homeAddress', 'homeZip', 'homeCity', 'homeProvince', 'homeCountry'] },
  { seccion: 'redes', campos: ['chat', 'twitter', 'facebook', 'linkedin'] },
  { seccion: 'otros', campos: ['date', 'notes'] },
  { seccion: 'personalizados', campos: ['custom1', 'custom2', 'custom3', 'custom4', 'custom5'] },
];

/** Los campos opcionales, en el orden del formulario. */
export const CAMPOS_OPCIONALES = SECCIONES_DE_CONTACTO.flatMap((s) => s.campos).filter((c) => c !== 'name' && c !== 'phone');

/** Las columnas de la plantilla y del CSV: nombre y teléfono primero (como siempre: un archivo de dos columnas sigue
 *  valiendo) y luego el resto, en el orden del formulario. */
export const CAMPOS_DEL_CSV = ['name', 'phone', ...CAMPOS_OPCIONALES];

/** Los cinco campos personalizados. */
export const CAMPOS_PERSONALIZADOS = ['custom1', 'custom2', 'custom3', 'custom4', 'custom5'];

/** Un contacto a partir de lo escrito: nombre y teléfono, y de los demás campos solo los que llevan algo. */
export function contactoDeValores(valores) {
  const contacto = { name: String(valores.name ?? '').trim(), phone: String(valores.phone ?? '').trim() };
  for (const clave of CAMPOS_OPCIONALES) {
    const valor = String(valores[clave] ?? '').trim();
    if (valor) contacto[clave] = valor;
  }
  return contacto;
}

/* ── Importar desde un CSV (DD-166) ─────────────────────────────────────────────────────────────────────────────── */

/** Los contactos que caben en una agenda. La cuota de localStorage es una para todos los almacenes, y lo que la pasa se
 *  pierde sin avisar (`local-store.factory.ts`): una agenda de 5000 contactos ocupa unos 250 KB. */
export const TOPE_DE_CONTACTOS = 5000;

/** La primera columna de la cabecera de la plantilla, en cualquiera de los cuatro idiomas de la app. */
const CABECERA = /^(nombre|name|nom|nome)$/i;

/** La plantilla: la cabecera con todos los campos (`CAMPOS_DEL_CSV`, ya en el idioma de la app) y nada más, con `;` (lo que espera Excel en español) y con BOM, para que Excel la abra
 *  como UTF-8 y no estropee las tildes. */
export function plantillaCsv(cabecera) {
  return `\uFEFF${cabecera.join(';')}\r\n`;
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
export function campos(linea, separador) {
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
 * Lo que entra en una agenda desde un CSV, una línea por contacto (nombre, teléfono y, si los trae, los demás campos en
 * el orden de la plantilla), y lo que no:
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
      const columnas = campos(linea, separador);
      const [name = '', phone = ''] = columnas;
      if (primera && CABECERA.test(name)) return;
      if (!name) return void resultado.errores.push({ linea: i + 1, motivo: 'nombre' });
      if (!telefonoValido(phone)) return void resultado.errores.push({ linea: i + 1, motivo: 'telefono' });
      const clave = normalizarTelefono(phone);
      if (vistos.has(clave)) return void resultado.repetidos++;
      if (resultado.nuevos.length >= sitio) return void resultado.sobran++;
      vistos.add(clave);
      resultado.nuevos.push(contactoDeValores(Object.fromEntries(CAMPOS_DEL_CSV.map((clave, i) => [clave, columnas[i] ?? '']))));
    });
  return resultado;
}

