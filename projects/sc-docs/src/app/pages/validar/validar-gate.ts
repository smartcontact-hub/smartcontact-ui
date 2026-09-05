/**
 * La puerta de la guía interna, compartida entre `/validar` (la guía) y `/validar/juego` (el
 * juego). Vive aparte para que las dos rutas lean el MISMO estado: si entras por la guía y das a
 * «Jugar», el juego no te vuelve a pedir la clave.
 *
 * La clave evita que se abra por accidente, NO es seguridad: esto es una app estática y el bundle
 * viaja al cliente. Para protección real haría falta un dominio propio + Access.
 */
export const VALIDAR_KEY = 'HalaMadrid123!';
const STORAGE = 'sc-validar-ok';

export function estaDesbloqueado(): boolean {
  try {
    return sessionStorage.getItem(STORAGE) === '1';
  } catch {
    return false;
  }
}

export function desbloquear(): void {
  try {
    sessionStorage.setItem(STORAGE, '1');
  } catch {
    /* modo privado o almacenamiento bloqueado: se pedirá otra vez, sin más */
  }
}
