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
