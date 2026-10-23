import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent, ScSelectComponent } from '@smartcontact-hub/components';

import type { TipificacionOpcion } from '../../state/tipificaciones.core.mjs';
import { TooltipModule } from 'primeng/tooltip';

/** Lo que cabe en el comentario del agente: el `maxlength` del campo de su ventana de tipificar (réplica del agente). */
const LARGO_DEL_COMENTARIO = 255;

/**
 * LO QUE VERÁ EL AGENTE (DD-177), mientras se crea la tipificación: el teléfono de sc-agent en su sección de Tipificación, la que
 * sale al colgar, con lo que se va definiendo. Cada nivel es su píldora (con las opciones de lo elegido en la de arriba),
 * el comentario si lo pide, y Guardar, que se enciende cuando está todo. Se puede probar: así se entiende qué es un
 * nivel y qué cambia al pedir comentario sin leer una ayuda. No guarda nada.
 *
 * Los niveles son `sc-select` y Guardar es `sc-button` del DS, tal cual salen de Figma («Fuera del DS»): solo se recolorean
 * el estado apagado de los niveles y Guardar, que en la ventana del agente es de borde y texto blancos. El modo oscuro
 * de estas piezas queda pendiente.
 *
 * Su forma es la de la réplica (`agent/…/typification.component.ts` y el Comunicador que la contiene): misma
 * estructura, mismos radios y mismas piezas. Sus colores, los de la familia `--sc-agent-window-*` (05-extensions),
 * oscura en los dos temas como el teléfono de verdad.
 */
@Component({
  selector: 'sc-tipificacion-vista',
  imports: [TooltipModule, IconComponent, ScButtonComponent, ScSelectComponent, TranslateModule],
  templateUrl: './tipificacion-vista.component.html',
  styleUrl: './tipificacion-vista.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TipificacionVistaComponent {
  readonly options = input.required<readonly TipificacionOpcion[]>();
  /** Los niveles en uso: 0 si no pide categoría. */
  readonly levels = input.required<number>();
  readonly comments = input.required<boolean>();

  protected readonly largo = LARGO_DEL_COMENTARIO;

  /** Lo elegido en cada desplegable, por id. */
  private readonly elegidas = signal<readonly (string | null)[]>([]);
  protected readonly comentario = signal('');
  /** El camino guardado en la prueba, para decir cómo quedaría la conversación. */
  protected readonly guardado = signal<string | null>(null);

  /** Cambia el árbol o los niveles: la prueba vuelve a empezar, para no enseñar un camino que ya no existe. */
  private readonly reiniciar = effect(() => {
    this.options();
    this.levels();
    this.comments();
    this.elegidas.set([]);
    this.guardado.set(null);
  });

  /** Un desplegable por nivel: sus opciones son las hijas de lo elegido arriba; sin eso, apagado. */
  protected readonly niveles = computed(() => {
    const ids = this.elegidas();
    let lista: readonly TipificacionOpcion[] | null = this.options();
    return Array.from({ length: this.levels() }, (_, nivel) => {
      // Una copia: el Select de primeng.dev pide una lista que pueda tocar.
      const opciones: TipificacionOpcion[] = [...(lista ?? [])];
      const elegida = lista?.find((o) => o.id === ids[nivel]) ?? null;
      // `arriba`: lo de arriba está elegido (sus hijas son estas); si no hay opciones, es que aún no las tiene.
      const fila = { nivel, opciones, elegida, arriba: lista !== null, apagado: lista === null || opciones.length === 0 };
      lista = elegida ? elegida.children : null;
      return fila;
    });
  });

  /** Guardar se enciende con un camino que acaba en una hoja (cada rama llega hasta donde haga falta); si solo pide
   *  comentario, con algo escrito. */
  protected readonly completo = computed(() => {
    if (this.levels() === 0) return this.comments() && !!this.comentario().trim();
    for (const n of this.niveles()) {
      if (!n.elegida) return false;
      if (n.elegida.children.length === 0) return true;
    }
    return true;
  });

  protected elegir(nivel: number, id: unknown): void {
    this.elegidas.update((ids) => [...ids.slice(0, nivel), typeof id === 'string' ? id : null]);
    this.guardado.set(null);
  }

  /** Lo que diría la tabla del agente de esa conversación: el camino elegido, o «Con comentario». */
  protected guardar(): void {
    if (!this.completo()) return;
    this.guardado.set(
      this.niveles()
        .map((n) => n.elegida?.label)
        .filter(Boolean)
        .join(' › '),
    );
  }

  protected escribir(texto: string): void {
    this.comentario.set(texto);
    this.guardado.set(null);
  }
}
