import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PopoverModule } from 'primeng/popover';
import { ScButtonComponent, ScCheckboxComponent, ScTagComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

export interface FiltroItem {
  readonly clave: string;
  readonly etiqueta: string;
  readonly activo: boolean;
  /** Un color del DS: punto (o, con `tag`, etiqueta de color). */
  readonly color?: string | null;
  readonly tag?: boolean;
}

export interface FiltroGrupo {
  readonly clave: string;
  readonly titulo: string;
  readonly items: readonly FiltroItem[];
}

/**
 * El botón de filtros con su lista, como el filtro de un calendario de equipo: cada bloque es una fila con su casilla (marca
 * o quita todo el bloque) y una flecha que abre al lado la lista de lo suyo, con «Deseleccionar todo». Pieza propia del
 * experimento: el DS no tiene aún un menú de filtros con submenús.
 */
@Component({
  selector: 'sc-horario-filtro-menu',
  imports: [PopoverModule, ScButtonComponent, ScCheckboxComponent, ScIconComponent, ScTagComponent, TranslateModule],
  templateUrl: './horario-filtro-menu.component.html',
  styleUrl: './horario-filtro-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioFiltroMenuComponent {
  readonly etiqueta = input.required<string>();
  readonly borrarEtiqueta = input.required<string>();
  readonly seleccionarTodo = input.required<string>();
  readonly deseleccionarTodo = input.required<string>();
  readonly grupos = input.required<readonly FiltroGrupo[]>();
  readonly ariaLabel = input<string>('');
  /** Hacia dónde se abre la lista de un bloque: a la izquierda si el botón está al borde derecho de la pantalla. */
  readonly lado = input<'izquierda' | 'derecha'>('izquierda');

  readonly alternar = output<string>();
  /** Marca (`true`) o quita (`false`) todo un bloque. */
  readonly ponerGrupo = output<{ readonly clave: string; readonly activo: boolean }>();
  readonly borrar = output<void>();

  protected readonly abierto = signal<string | null>(null);
  protected readonly apagados = computed(() => this.grupos().reduce((n, g) => n + g.items.filter((i) => !i.activo).length, 0));
  protected readonly textoDelBoton = computed(() => (this.apagados() > 0 ? `${this.etiqueta()} · ${this.apagados()}` : this.etiqueta()));

  protected estado(g: FiltroGrupo): 'all' | 'some' | 'none' {
    const n = g.items.filter((i) => i.activo).length;
    return n === 0 ? 'none' : n === g.items.length ? 'all' : 'some';
  }

  protected alternarBloque(g: FiltroGrupo): void {
    this.ponerGrupo.emit({ clave: g.clave, activo: this.estado(g) !== 'all' });
  }

  protected abrir(clave: string): void {
    this.abierto.update((a) => (a === clave ? null : clave));
  }
}
