import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

import { TOAST_LIFE } from '../utils/toast-life';

/**
 * Cómo se cuenta el resultado de una acción del usuario (DD-211 §5, que sustituye a DD-191 y DD-196): un toast de
 * éxito, abajo a la derecha y el mismo en toda la app, al crear, guardar, duplicar, eliminar, importar o exportar
 * («Grupo "Ventas" creado»). El aviso lleva `role="status"` (`app.component.html`): el lector lo anuncia solo.
 *
 * Un cambio en lote, además, se queda contado en su barra con «Deshacer» (`contarLote` de `sc-list-page`): el toast se
 * va y el deshacer tiene que seguir a mano. Un resultado que es de un control (copiar, probar una conexión) sigue en un
 * `sc-message` junto a él.
 */
@Injectable({ providedIn: 'root' })
export class ResultadoAccionService {
  private readonly messages = inject(MessageService);

  /** La acción ha salido bien: lo dice un toast de éxito. */
  contar(texto: string): void {
    this.messages.add({ severity: 'success', summary: texto, life: TOAST_LIFE.success });
  }
}
