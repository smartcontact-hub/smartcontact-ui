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

/** Los contactos que caben en una agenda (DD-166). */
export const TOPE_DE_CONTACTOS: number;
/** La plantilla de importar: la cabecera, con `;` y BOM. */
export function plantillaCsv(nombre: string, telefono: string): string;
/** Un CSV en bytes, como texto: UTF-8 o, si no lo es, windows-1252. */
export function decodificarCsv(bytes: Uint8Array): string;

/** Lo que dice un CSV de contactos antes de añadirlo a la agenda. */
export interface ImportacionDeContactos {
  readonly nuevos: readonly { readonly name: string; readonly phone: string }[];
  /** Cada línea que no entra por error, con su número en el archivo. */
  readonly errores: readonly { readonly linea: number; readonly motivo: 'nombre' | 'telefono' }[];
  /** Los que ya estaban en la agenda o se repiten en el archivo. */
  readonly repetidos: number;
  /** Los que pasarían la agenda del tope. */
  readonly sobran: number;
}
export function parsearContactosCsv(
  texto: string | null | undefined,
  existentes: readonly { readonly phone: string }[],
  tope?: number,
): ImportacionDeContactos;

