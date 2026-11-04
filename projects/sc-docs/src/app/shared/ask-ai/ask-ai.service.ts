import { Injectable, signal } from '@angular/core';

/**
 * Dónde contesta el asistente: el Worker `sc-docs-ask` (carpeta `workers/sc-docs-ask/`). En local, el que arranca
 * `npm run dev` dentro de `workers/sc-docs-ask/`; publicado, su dirección de workers.dev en la cuenta de Cloudflare de la doc.
 */
export const ASK_ENDPOINT = /^(localhost|127\.0\.0\.1)$/.test(globalThis.location?.hostname ?? '')
  ? 'http://localhost:8787/ask'
  : 'https://sc-docs-ask.rafaelareses.workers.dev/ask';

/** Abrir y cerrar el panel desde cualquier sitio (la cabecera, una ficha). La conversación vive en el panel. */
@Injectable({ providedIn: 'root' })
export class AskAiService {
  readonly abierto = signal(false);
  /**
   * ¿Se ha abierto alguna vez? El contenido del panel se monta entonces, no al cargar la página: ni pesa en cada ficha
   * ni se pinta antes de que lleguen las traducciones (sus botones de solo icono nacían sin nombre y `sc-button` lo
   * avisaba, DD-200). Al cerrar se queda montado: la conversación sigue ahí al volver.
   */
  readonly usado = signal(false);

  abrir(): void {
    this.usado.set(true);
    this.abierto.set(true);
  }
}
