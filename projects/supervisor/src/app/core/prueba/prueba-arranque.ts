/**
 * EL ARRANQUE DEL MODO PRUEBA (DD-256): lee la sesión del enlace antes de que arranque la app.
 *
 * La página de la prueba en el Lab de sc-docs manda a cada persona a la primera versión con su sesión en el enlace
 * (`…/admin/calendarios#prueba=<sesión>`). Aquí se guarda en la pestaña (`sessionStorage`) y se quita de la dirección,
 * antes de que el router la lea, para que la app no vea nada raro y recargar no la pierda. Fuera de un preview de rama
 * o de local no hace nada: en producción no hay modo prueba aunque alguien abra el enlace.
 *
 * Lo llama `main.ts` antes del arranque, como la migración de claves. La capa que se ve solo se descarga si hay sesión
 * (`@defer` en `app.component.html`).
 */
import { CLAVE_ENLACE, decodificar, pruebaPermitida } from './prueba-enlace.core.mjs';

/** La clave de la pestaña donde vive la sesión en curso. */
export const CLAVE_SESION_PRUEBA = 'sc-prueba';

/** Un paso de la sesión: una misión en una versión. */
export interface PasoDePrueba {
  readonly version: string;
  readonly url: string;
  readonly mision: string;
  readonly titulo: string;
  readonly enunciado: string;
  readonly nota?: string;
}

/** Lo que se mide de un paso. El mismo formato lee el veredicto en sc-docs (`prueba.core.mjs`). */
export interface ResultadoDePaso {
  readonly version: string;
  readonly mision: string;
  readonly ms: number;
  readonly clics: number;
  readonly primerClic: string | null;
  readonly enVacio: readonly string[];
  readonly pantallas: readonly string[];
  readonly ayudas: readonly { readonly ms: number; readonly pantalla: string }[];
  readonly comprobacion: { readonly bien: number; readonly total: number; readonly titular?: string } | null;
  readonly moderador: 'si' | 'medias' | 'no' | null;
  readonly facilidad: number | null;
}

/** El paso en marcha, para que recargar la página no lo pierda. */
export interface PasoEnCurso {
  readonly fase: 'leer' | 'trabajando' | 'valorar';
  readonly inicio: number;
  readonly ms: number;
  readonly clics: number;
  readonly primerClic: string | null;
  readonly enVacio: readonly string[];
  readonly pantallas: readonly string[];
  readonly ayudas: readonly { readonly ms: number; readonly pantalla: string }[];
  readonly comprobacion: ResultadoDePaso['comprobacion'];
}

export interface SesionDePrueba {
  readonly v: 1;
  readonly prueba: string;
  readonly participante: string;
  readonly orden: readonly string[];
  readonly pasos: readonly PasoDePrueba[];
  readonly paso: number;
  readonly resultados: readonly ResultadoDePaso[];
  /** A dónde vuelve al acabar: la pantalla de fin de sc-docs. */
  readonly fin: string;
  readonly actual?: PasoEnCurso | null;
}

const esSesion = (s: unknown): s is SesionDePrueba => {
  if (!s || typeof s !== 'object') return false;
  const o = s as Record<string, unknown>;
  return o['v'] === 1 && typeof o['prueba'] === 'string' && Array.isArray(o['pasos']) && typeof o['paso'] === 'number';
};

/** La sesión guardada en la pestaña, si la hay. */
export function sesionGuardada(): SesionDePrueba | null {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_SESION_PRUEBA);
    const s: unknown = crudo ? JSON.parse(crudo) : null;
    return esSesion(s) ? s : null;
  } catch {
    return null;
  }
}

export function guardarSesion(s: SesionDePrueba | null): void {
  try {
    if (s) window.sessionStorage.setItem(CLAVE_SESION_PRUEBA, JSON.stringify(s));
    else window.sessionStorage.removeItem(CLAVE_SESION_PRUEBA);
  } catch {
    // almacenamiento bloqueado: la prueba sigue en memoria hasta recargar
  }
}

/** Lee el enlace de prueba (si lo hay y aquí se permite), lo guarda en la pestaña y lo quita de la dirección. */
export function leerEnlaceDePrueba(): void {
  if (typeof window === 'undefined' || !pruebaPermitida(window.location.hostname)) return;
  const hash = window.location.hash;
  const i = hash.indexOf(CLAVE_ENLACE);
  if (i < 0) return;
  try {
    const s = decodificar(hash.slice(i + CLAVE_ENLACE.length));
    if (esSesion(s)) guardarSesion({ ...s, actual: null });
  } catch {
    // un enlace cortado al copiarlo: la app arranca como siempre
  }
  window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
}

/** ¿Hay una prueba en marcha en esta pestaña? Solo entonces se descarga la capa del modo prueba. */
export function pruebaEnCurso(): boolean {
  return typeof window !== 'undefined' && pruebaPermitida(window.location.hostname) && sesionGuardada() !== null;
}
