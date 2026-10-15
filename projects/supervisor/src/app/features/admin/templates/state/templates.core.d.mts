/** Tipos de lo que una plantilla hace con su contenido (la lógica vive en `templates.core.mjs`). */
export type CanalDePlantilla = 'chat' | 'email' | 'whatsapp';
export const CANALES_DE_PLANTILLA: readonly CanalDePlantilla[];
export const TOPE_DE_PLANTILLAS: number;

/** El texto de un contenido, en una línea: sin etiquetas. */
export function textoPlano(contenido: string | null | undefined): string;
/** ¿No hay nada escrito? (el editor vacío deja `<p><br></p>`). */
export function contenidoVacio(contenido: string | null | undefined): boolean;
/** El HTML que se guarda: solo las etiquetas del editor, sin atributos salvo el `href` seguro de un enlace. */
export function sanearHtml(html: string | null | undefined): string;
export function htmlAWhatsApp(html: string | null | undefined): string;
export function whatsAppAHtml(texto: string | null | undefined): string;
/** Lo que se enseña en el editor, según su canal. */
export function contenidoParaEditor(contenido: string | null | undefined, canal: CanalDePlantilla): string;
/** Lo que se guarda desde el editor, según su canal. */
export function contenidoParaGuardar(html: string | null | undefined, canal: CanalDePlantilla): string;

export interface ImportacionDePlantillas {
  readonly nuevas: readonly { readonly title: string; readonly type: CanalDePlantilla; readonly body: string }[];
  readonly errores: readonly { readonly linea: number; readonly motivo: 'titulo' | 'canal' | 'contenido' }[];
  readonly repetidas: number;
  readonly sobran: number;
}
export function parsearPlantillasCsv(
  texto: string | null | undefined,
  existentes: readonly { readonly title: string }[],
  tope?: number,
): ImportacionDePlantillas;
export function plantillaDePlantillasCsv(cabecera: readonly string[]): string;
