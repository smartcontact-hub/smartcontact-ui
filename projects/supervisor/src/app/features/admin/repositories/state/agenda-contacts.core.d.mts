/** Tipos de los contactos de una agenda (la lógica vive en `agenda-contacts.core.mjs`, DD-163). */
export interface AgendaContact {
  readonly id: number;
  readonly name: string;
  readonly phone: string;
}

/** Lo que se compara de un teléfono: solo las cifras, y el `+` de delante si lo lleva. */
export function normalizarTelefono(telefono: string | null | undefined): string;
/** `+` opcional y de 3 a 15 cifras, con espacios, guiones, puntos o paréntesis entre ellas. */
export function telefonoValido(telefono: string | null | undefined): boolean;
/** La búsqueda de la tabla: nombre y teléfono por subcadena, y un teléfono también por sus cifras. */
export function contactoCoincide(contacto: AgendaContact, busqueda: string | null | undefined): boolean;
/** El texto de antes (números con comas): un contacto por número, sin nombre y sin repetidos. */
export function contactosDeNumeros(numeros: string | null | undefined): AgendaContact[];
