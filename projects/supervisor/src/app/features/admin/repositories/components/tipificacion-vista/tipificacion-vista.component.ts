import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ListboxModule } from 'primeng/listbox';
import { PopoverModule } from 'primeng/popover';
import type { ListBoxPassThrough } from 'primeng/types/listbox';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';

import type { TipificacionOpcion } from '../../state/tipificaciones.core.mjs';

/** Lo que cabe en el comentario del agente: el `maxlength` del campo de su ventana de tipificar (réplica del agente). */
const LARGO_DEL_COMENTARIO = 255;

/**
 * LO QUE VERÁ EL AGENTE (DD-174), mientras se crea la tipificación: el teléfono de sc-agent en su sección de Tipificación, la que
 * sale al colgar, con lo que se va definiendo. Cada nivel es su píldora (con las opciones de lo elegido en la de arriba),
 * el comentario si lo pide, y Guardar, que se enciende cuando está todo. Se puede probar: así se entiende qué es un
 * nivel y qué cambia al pedir comentario sin leer una ayuda. No guarda nada.
 *
 * Su forma es la de la réplica (`agent/…/typification.component.ts` y el Comunicador que la contiene): misma
 * estructura, mismos radios y mismas piezas. Sus colores, los de la familia `--sc-agent-window-*` (05-extensions),
 * oscura en los dos temas como el teléfono de verdad.
 */
@Component({
  selector: 'sc-tipificacion-vista',
  imports: [FormsModule, IconComponent, ListboxModule, PopoverModule, TranslateModule],
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

  /** La lista de un nivel, en el globo: oscura como el panel del agente (sus tokens, `dt`). */
  protected readonly lista = {
    root: {
      background: 'transparent',
      borderColor: 'transparent',
      color: 'var(--sc-agent-window-fg)',
      shadow: 'none',
    },
    option: {
      color: 'var(--sc-agent-window-fg)',
      focusBackground: 'var(--sc-agent-window-bg)',
      focusColor: 'var(--sc-agent-window-fg)',
      selectedBackground: 'var(--sc-agent-window-header-bg)',
      selectedColor: 'var(--sc-agent-window-fg)',
      selectedFocusBackground: 'var(--sc-agent-window-header-bg)',
      selectedFocusColor: 'var(--sc-agent-window-fg)',
    },
  };

  /** El globo, oscuro como el comentario del agente, con su borde casi negro: sin él quedaba un marco blanco. */
  protected readonly globoDt = {
    root: {
      background: 'var(--sc-agent-window-field-bg)',
      borderColor: 'var(--sc-agent-window-field-border)',
      color: 'var(--sc-agent-window-fg)',
    },
  };

  /** Al abrir el globo, el foco entra en la lista (como el globo de columnas, DD-162). */
  protected readonly listaPt: ListBoxPassThrough = { list: { autofocus: true } };

  /** El nivel con el globo abierto; `null` si ninguno. */
  protected readonly abierto = signal<number | null>(null);

  protected readonly opcionesAbiertas = computed(() => {
    const n = this.abierto();
    return n === null ? [] : (this.niveles()[n]?.opciones ?? []);
  });

  protected readonly elegidaAbierta = computed(() => {
    const n = this.abierto();
    return n === null ? null : (this.niveles()[n]?.elegida?.id ?? null);
  });

  protected abrir(nivel: number, globo: { toggle: (e: Event) => void }, event: Event): void {
    this.abierto.set(nivel);
    globo.toggle(event);
  }

  protected elegirAbierta(id: unknown, globo: { hide: () => void }): void {
    const n = this.abierto();
    if (n !== null && typeof id === 'string') this.elegir(n, id);
    globo.hide();
  }

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

  /** Guardar se enciende con un camino entero; si solo pide comentario, con algo escrito. */
  protected readonly completo = computed(() =>
    this.levels() > 0 ? this.niveles().every((n) => !!n.elegida) : this.comments() && !!this.comentario().trim(),
  );

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
