/** Tipos de los contactos de una agenda (la lógica vive en `agenda-contacts.core.mjs`, DD-163). */
export interface AgendaContact {
  readonly id: number;
  readonly name: string;
  readonly phone: string;
  readonly surname?: string;
  readonly company?: string;
  readonly position?: string;
  readonly website?: string;
  readonly phoneHome?: string;
  readonly phonePersonal?: string;
  readonly phoneOther?: string;
  readonly fax?: string;
  readonly emailWork?: string;
  readonly emailPersonal?: string;
  readonly emailOther?: string;
  readonly workAddress?: string;
  readonly workZip?: string;
  readonly workCity?: string;
  readonly workProvince?: string;
  readonly workCountry?: string;
  readonly homeAddress?: string;
  readonly homeZip?: string;
  readonly homeCity?: string;
  readonly homeProvince?: string;
  readonly homeCountry?: string;
  readonly chat?: string;
  readonly twitter?: string;
  readonly facebook?: string;
  readonly linkedin?: string;
  readonly date?: string;
  readonly notes?: string;
  readonly custom1?: string;
  readonly custom2?: string;
  readonly custom3?: string;
  readonly custom4?: string;
  readonly custom5?: string;
}

/** La clave de un campo de un contacto distinto de nombre y teléfono. */
export type CampoOpcional = Exclude<keyof AgendaContact, 'id' | 'name' | 'phone'>;
/** Los campos del formulario agrupados por sección, en su orden (nombre y teléfono incluidos). */
export const SECCIONES_DE_CONTACTO: readonly { readonly seccion: string; readonly campos: readonly string[] }[];
/** Los campos opcionales, en el orden del formulario. */
export const CAMPOS_OPCIONALES: readonly CampoOpcional[];
/** Las columnas de la plantilla y del CSV: nombre, teléfono y el resto. */
export const CAMPOS_DEL_CSV: readonly string[];
/** Los cinco campos personalizados, cuya etiqueta se edita en cada agenda. */
export const CAMPOS_PERSONALIZADOS: readonly string[];
/** Un contacto (sin id) a partir de lo escrito: nombre y teléfono, y de los demás solo los que llevan algo. */
export function contactoDeValores(valores: Readonly<Record<string, string | undefined>>): Omit<AgendaContact, 'id'>;
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
export function plantillaCsv(cabecera: readonly string[]): string;
/** Un CSV en bytes, como texto: UTF-8 o, si no lo es, windows-1252. */
export function decodificarCsv(bytes: Uint8Array): string;

/** Lo que dice un CSV de contactos antes de añadirlo a la agenda. */
export interface ImportacionDeContactos {
  readonly nuevos: readonly Omit<AgendaContact, 'id'>[];
  /** Cada línea que no entra por error, con su número en el archivo. */
  readonly errores: readonly { readonly linea: number; readonly motivo: 'telefono' }[];
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


/** Los campos de una línea de CSV: un campo entre comillas puede llevar el separador. */
export function campos(linea: string, separador: string): string[];
