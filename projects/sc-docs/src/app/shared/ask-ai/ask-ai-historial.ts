/**
 * Las conversaciones de «Pregunta a la IA», guardadas en el NAVEGADOR de quien pregunta (`localStorage`): no viajan a
 * ningún servidor ni las ve nadie más, y no gastan cupo. «Nueva conversación» ya no borra la anterior: la deja en la
 * lista. Al recargar, el panel vuelve con la conversación que tenías abierta.
 *
 * Todo va en try/catch: en una ventana privada o con los datos del sitio bloqueados, `localStorage` puede fallar o venir
 * vacío, y entonces el panel funciona igual, solo que sin recordar.
 */

export interface Conversacion<M> {
  readonly id: string;
  /** La primera pregunta, recortada: es lo que se lee en la lista. */
  readonly titulo: string;
  readonly mensajes: readonly M[];
  /** Cuándo se tocó por última vez (ms): ordena la lista y da el «hace 5 min». */
  readonly actualizada: number;
}

export interface Historial<M> {
  readonly activa: string | null;
  readonly conversaciones: readonly Conversacion<M>[];
}

const CLAVE = 'sc-docs.pregunta-ia.v1';
/** Tope de la lista y de cada conversación: lo que cabe de sobra en el `localStorage` y se recorre de un vistazo. */
export const MAX_CONVERSACIONES = 20;
export const MAX_MENSAJES = 40;

const VACIO: Historial<never> = { activa: null, conversaciones: [] };

export function leerHistorial<M>(): Historial<M> {
  try {
    const crudo = globalThis.localStorage?.getItem(CLAVE);
    if (!crudo) return VACIO;
    const datos = JSON.parse(crudo) as Partial<Historial<M>>;
    const conversaciones = Array.isArray(datos.conversaciones)
      ? datos.conversaciones.filter(
          (c): c is Conversacion<M> =>
            !!c && typeof c.id === 'string' && typeof c.titulo === 'string' && Array.isArray(c.mensajes),
        )
      : [];
    const activa = typeof datos.activa === 'string' && conversaciones.some((c) => c.id === datos.activa) ? datos.activa : null;
    return { activa, conversaciones };
  } catch {
    return VACIO;
  }
}

export function escribirHistorial<M>(historial: Historial<M>): void {
  try {
    globalThis.localStorage?.setItem(
      CLAVE,
      JSON.stringify({ activa: historial.activa, conversaciones: historial.conversaciones.slice(0, MAX_CONVERSACIONES) }),
    );
  } catch {
    // Sin sitio o sin permiso: se sigue sin recordar.
  }
}

export function nuevoId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * «hace 5 minutos», «ayer», «hace 3 días»: en el idioma de la doc. `null` si fue hace menos de un minuto: ahí el
 * navegador dice «este minuto», que suena raro, y el panel pone su propio «ahora mismo».
 */
export function haceCuanto(momento: number, idioma: string, ahora = Date.now()): string | null {
  const formato = new Intl.RelativeTimeFormat(idioma, { numeric: 'auto' });
  const segundos = Math.round((momento - ahora) / 1000);
  const minutos = Math.round(segundos / 60);
  const horas = Math.round(minutos / 60);
  const dias = Math.round(horas / 24);
  if (Math.abs(segundos) < 60) return null;
  if (Math.abs(minutos) < 60) return formato.format(minutos, 'minute');
  if (Math.abs(horas) < 24) return formato.format(horas, 'hour');
  return formato.format(dias, 'day');
}
