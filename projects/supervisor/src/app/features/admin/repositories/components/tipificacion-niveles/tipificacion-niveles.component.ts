import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { moveItemInArray, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ListboxModule } from 'primeng/listbox';
import { TooltipModule } from 'primeng/tooltip';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import {
  ScButtonComponent as ButtonComponent,
  ScDialogComponent as DialogComponent,
  ScInputTextComponent as InputTextComponent,
} from '@smartcontact-hub/components';

import { injectLangChange } from '@core/utils/lang-change';

import {
  NIVELES_MAXIMOS,
  nuevoIdDeOpcion,
  opcionesPorNivel,
  ramasIncompletas,
  recortarANiveles,
  totalDeOpciones,
  type TipificacionOpcion,
} from '../../state/tipificaciones.core.mjs';

/** Un hueco de la rejilla: un nivel en uso, el que se puede añadir, o nada (para que las columnas no cambien de ancho). */
type Hueco =
  | {
      readonly tipo: 'nivel';
      readonly nivel: number;
      readonly opciones: TipificacionOpcion[] | null;
      readonly elegida: TipificacionOpcion | null;
      readonly padres: readonly string[];
      readonly padre: string | null;
    }
  | { readonly tipo: 'anadir'; readonly nivel: number }
  | { readonly tipo: 'vacio'; readonly nivel: number };

type Columna = Extract<Hueco, { tipo: 'nivel' }>;

/** Las hijas de la opción a la que lleva `padres`, cambiadas con `cambio`. Devuelve el árbol nuevo. */
function cambiarHijas(
  opciones: readonly TipificacionOpcion[],
  padres: readonly string[],
  cambio: (hijas: readonly TipificacionOpcion[]) => readonly TipificacionOpcion[],
): TipificacionOpcion[] {
  if (padres.length === 0) return [...cambio(opciones)];
  const [cabeza, ...resto] = padres;
  return opciones.map((o) => (o.id === cabeza ? { ...o, children: cambiarHijas(o.children, resto, cambio) } : o));
}

/**
 * LAS CATEGORÍAS DE UNA TIPIFICACIÓN (DD-174): una columna por nivel, como la maqueta de producto, y los niveles son las propias
 * columnas. La siguiente que se puede usar sale como columna fantasma («+ Añadir segundo nivel»), y la última en uso
 * se quita con su ×. Sin categorías, la primera es la fantasma.
 *
 * Elegir una opción enseña sus hijas en la columna de al lado, así se ve siempre el camino entero. Cada columna es el
 * Listbox de primeng.dev tal cual (selección, teclado y arrastrar para ordenar, como el globo de columnas, DD-162). Debajo,
 * en la misma línea, se añade una opción o se renombra la elegida (Enter guarda, Escape cancela), y sus acciones
 * (renombrar, subir, bajar, eliminar) van siempre a la vista, apagadas sin nada elegido.
 *
 * SIN SALTOS: las tres columnas existen siempre y miden lo mismo; las listas tienen alto fijo; y cada aviso tiene su
 * línea reservada (bajo cada columna y bajo la rejilla), que cambia de texto pero no aparece ni desaparece.
 *
 * Todas las ramas llegan al último nivel (decisión de producto): una opción sin hijas por encima de él lleva su aviso.
 * No guarda nada: emite el árbol y los niveles, y la ficha los lleva en su formulario.
 */
@Component({
  selector: 'sc-tipificacion-niveles',
  imports: [ButtonComponent, DialogComponent, FormsModule, IconComponent, InputTextComponent, ListboxModule, TooltipModule, TranslateModule],
  templateUrl: './tipificacion-niveles.component.html',
  styleUrl: './tipificacion-niveles.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TipificacionNivelesComponent {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  readonly options = input.required<readonly TipificacionOpcion[]>();
  /** Los niveles en uso: 0 si no pide categoría. */
  readonly levels = input.required<number>();
  /** Si pide comentario: sin categorías ni comentario, no pide nada, y la línea de estado lo dice. */
  readonly comments = input(true);
  readonly optionsChange = output<readonly TipificacionOpcion[]>();
  readonly levelsChange = output<number>();

  /**
   * El árbol con el que se trabaja: el de la ficha, puesto al día en el acto con cada cambio de aquí. Sin él, dos
   * «Añadir» seguidos partían los dos del árbol de antes (la ficha aún no lo había devuelto) y el segundo pisaba al
   * primero: lo cazó el alta de la prueba, añadiendo tres opciones seguidas. Cuando la ficha manda otro (Deshacer),
   * vuelve a ser el suyo.
   */
  private readonly arbol = linkedSignal(() => this.options());

  /** Aplica un árbol nuevo aquí mismo y se lo da a la ficha. */
  private cambiar(nuevo: readonly TipificacionOpcion[]): void {
    this.arbol.set(nuevo);
    this.optionsChange.emit(nuevo);
  }

  /** Los ids elegidos, columna a columna. Lo que falta se rellena con la primera opción, como en la maqueta. */
  private readonly elegidas = signal<readonly string[]>([]);

  protected readonly huecos = computed<readonly Hueco[]>(() => {
    const ids = this.elegidas();
    const huecos: Hueco[] = [];
    let lista: readonly TipificacionOpcion[] | null = this.arbol();
    const padres: string[] = [];
    let padre: string | null = null;
    for (let nivel = 0; nivel < NIVELES_MAXIMOS; nivel++) {
      if (nivel >= this.levels()) {
        huecos.push({ tipo: nivel === this.levels() ? 'anadir' : 'vacio', nivel });
        continue;
      }
      const elegida: TipificacionOpcion | null = lista ? (lista.find((o) => o.id === ids[nivel]) ?? lista[0] ?? null) : null;
      // Una copia: el Listbox reordena la suya al soltar, y el orden de verdad es el del formulario.
      huecos.push({ tipo: 'nivel', nivel, opciones: lista ? [...lista] : null, elegida, padres: [...padres], padre });
      lista = elegida ? elegida.children : null;
      if (elegida) {
        padres.push(elegida.id);
        padre = elegida.label;
      }
    }
    return huecos;
  });

  protected titulo(nivel: number): string {
    return `repositories.tipificaciones.level_title.${nivel + 1}`;
  }

  /** ¿Le faltan hijas a esta opción? Solo por encima del último nivel. */
  protected incompleta(opcion: TipificacionOpcion, nivel: number): boolean {
    return nivel < this.levels() - 1 && opcion.children.length === 0;
  }

  protected elegir(nivel: number, id: unknown): void {
    // El Listbox suelta la elegida si se vuelve a pulsar: aquí siempre hay una, la que se ve a la derecha.
    if (typeof id !== 'string') return;
    this.elegidas.update((ids) => [...ids.slice(0, nivel), id]);
    if (this.editando()?.nivel === nivel) this.cancelarEdicion();
  }

  /* ── La línea de estado, bajo la rejilla ──────────────────────────────── */

  /** Una sola línea, siempre presente: qué falta, o que está completo. `tono` decide su color y su icono. */
  protected readonly estado = computed<{ readonly texto: string; readonly tono: 'ok' | 'falta' | 'info' }>(() => {
    this.lang();
    const t = (k: string, p?: object) => this.translate.instant(`repositories.tipificaciones.tree_status.${k}`, p);
    const n = this.levels();
    if (n === 0) return this.comments() ? { texto: t('none'), tono: 'info' } : { texto: t('nothing'), tono: 'falta' };
    const ramas = ramasIncompletas(this.arbol(), n);
    if (ramas.length === 1 && ramas[0]!.length === 0) return { texto: t('empty'), tono: 'falta' };
    if (ramas.length > 0) return { texto: t('missing', { paths: ramas.map((r) => r.join(' › ')).join(', ') }), tono: 'falta' };
    const porNivel = opcionesPorNivel(this.arbol(), n);
    return { texto: t(n === 1 ? 'ok_one' : 'ok', { count: n, last: porNivel[n - 1] }), tono: 'ok' };
  });

  /* ── Añadir y renombrar, en la línea de debajo de cada columna ─────────── */

  /** Lo que se escribe en la línea de cada nivel. */
  protected readonly borradores = signal<readonly string[]>(['', '', '']);
  /** La opción que se está renombrando en su línea; `null` si la línea añade. */
  protected readonly editando = signal<{ readonly nivel: number; readonly id: string } | null>(null);

  protected escribir(nivel: number, texto: string): void {
    this.borradores.update((b) => b.map((v, i) => (i === nivel ? texto : v)));
  }

  /** La hermana que ya tiene ese nombre (sin contar la que se renombra), o `null`. */
  private repetida(columna: Columna): TipificacionOpcion | null {
    const texto = this.borradores()[columna.nivel]?.trim().toLowerCase() ?? '';
    if (!texto || !columna.opciones) return null;
    const propia = this.editando()?.nivel === columna.nivel ? this.editando()!.id : null;
    return columna.opciones.find((o) => o.id !== propia && o.label.trim().toLowerCase() === texto) ?? null;
  }

  /** La línea reservada de cada columna: el error de lo escrito, qué se está renombrando, o lo que le falta. */
  protected mensaje(columna: Columna): { readonly texto: string; readonly error: boolean } {
    this.lang();
    const t = (k: string, p?: object) => this.translate.instant(`repositories.tipificaciones.${k}`, p);
    const repetida = this.repetida(columna);
    if (repetida) return { texto: t('errors.option_taken', { name: repetida.label }), error: true };
    const editando = this.editando();
    if (editando?.nivel === columna.nivel) return { texto: t('renaming_hint'), error: false };
    if (columna.opciones && columna.opciones.length === 0 && columna.padre) {
      return { texto: t('level_needs', { name: columna.padre }), error: true };
    }
    return { texto: '', error: false };
  }

  protected puedeGuardarLinea(columna: Columna): boolean {
    return !!columna.opciones && !!this.borradores()[columna.nivel]?.trim() && !this.repetida(columna);
  }

  /** Enter, o el botón de la línea: añade, o guarda el nombre nuevo si se estaba renombrando. */
  protected guardarLinea(columna: Columna, event?: Event): void {
    event?.preventDefault();
    if (!this.puedeGuardarLinea(columna)) return;
    const label = this.borradores()[columna.nivel]!.trim();
    const editando = this.editando();
    if (editando?.nivel === columna.nivel) {
      this.cambiar(
        cambiarHijas(this.arbol(), columna.padres, (hijas) => hijas.map((o) => (o.id === editando.id ? { ...o, label } : o))),
      );
      this.editando.set(null);
    } else {
      const id = nuevoIdDeOpcion(this.arbol());
      this.cambiar(cambiarHijas(this.arbol(), columna.padres, (hijas) => [...hijas, { id, label, children: [] }]));
      // La nueva queda elegida: sus hijas, si las pide, se añaden en la columna de al lado sin más pasos.
      this.elegidas.update((ids) => [...ids.slice(0, columna.nivel), id]);
    }
    this.escribir(columna.nivel, '');
  }

  protected renombrar(columna: Columna): void {
    if (!columna.elegida) return;
    this.editando.set({ nivel: columna.nivel, id: columna.elegida.id });
    this.escribir(columna.nivel, columna.elegida.label);
    queueMicrotask(() => (document.getElementById(`tip-linea-${columna.nivel}`) as HTMLInputElement | null)?.select());
  }

  protected cancelarEdicion(): void {
    const e = this.editando();
    if (!e) return;
    this.escribir(e.nivel, '');
    this.editando.set(null);
  }

  protected teclaEnLinea(columna: Columna, event: KeyboardEvent): void {
    if (event.key === 'Enter') this.guardarLinea(columna, event);
    else if (event.key === 'Escape' && this.editando()?.nivel === columna.nivel) this.cancelarEdicion();
  }

  /* ── Ordenar y eliminar la elegida ────────────────────────────────────── */

  /** Lo que el lector oye tras mover: la opción y su puesto. */
  protected readonly anuncio = signal('');

  protected posicion(columna: Columna): number {
    return columna.opciones && columna.elegida ? columna.opciones.findIndex((o) => o.id === columna.elegida!.id) : -1;
  }

  protected mover(columna: Columna, salto: -1 | 1): void {
    const de = this.posicion(columna);
    this.moverDeA(columna, de, de + salto);
  }

  private moverDeA(columna: Columna, de: number, a: number): void {
    if (!columna.opciones || de < 0 || a < 0 || a >= columna.opciones.length) return;
    const nombre = columna.opciones[de]!.label;
    this.cambiar(
      cambiarHijas(this.arbol(), columna.padres, (hijas) => {
        const copia = [...hijas];
        moveItemInArray(copia, de, a);
        return copia;
      }),
    );
    this.anuncio.set(this.translate.instant('common.columns_position', { column: nombre, position: a + 1, total: columna.opciones.length }));
  }

  protected soltar(columna: Columna, event: CdkDragDrop<string[]>): void {
    if (event.previousIndex !== event.currentIndex) this.moverDeA(columna, event.previousIndex, event.currentIndex);
  }

  /** La opción que se va a eliminar con lo que cuelga de ella: solo se pregunta si se lleva algo más. */
  protected readonly eliminando = signal<{ columna: Columna; opcion: TipificacionOpcion; debajo: number } | null>(null);

  protected pedirEliminar(columna: Columna): void {
    const opcion = columna.elegida;
    if (!opcion) return;
    const debajo = totalDeOpciones(opcion.children);
    if (debajo === 0) this.eliminar(columna, opcion);
    else this.eliminando.set({ columna, opcion, debajo });
  }

  protected confirmarEliminar(): void {
    const e = this.eliminando();
    if (e) this.eliminar(e.columna, e.opcion);
    this.eliminando.set(null);
  }

  private eliminar(columna: Columna, opcion: TipificacionOpcion): void {
    this.cambiar(cambiarHijas(this.arbol(), columna.padres, (hijas) => hijas.filter((o) => o.id !== opcion.id)));
    this.elegidas.update((ids) => ids.slice(0, columna.nivel));
    if (this.editando()?.id === opcion.id) this.cancelarEdicion();
  }

  /** El nombre de cada acción dice sobre qué opción actúa. */
  protected accion(clave: string, columna: Columna): string {
    this.lang();
    return this.translate.instant(clave, { name: columna.elegida?.label ?? '' });
  }

  /* ── Añadir y quitar niveles ──────────────────────────────────────────── */

  protected anadirNivel(): void {
    if (this.levels() < NIVELES_MAXIMOS) this.levelsChange.emit(this.levels() + 1);
  }

  /** Quitar el último nivel: si tiene opciones, se pregunta antes cuántas se pierden. */
  protected readonly quitando = signal<{ readonly nivel: number; readonly quitadas: number } | null>(null);

  protected pedirQuitarNivel(): void {
    const n = this.levels();
    const quitadas = n === 1 ? totalDeOpciones(this.arbol()) : recortarANiveles(this.arbol(), n - 1).quitadas;
    if (quitadas === 0) this.quitarNivel();
    else this.quitando.set({ nivel: n - 1, quitadas });
  }

  protected quitarNivel(): void {
    const n = this.levels();
    this.cambiar(n === 1 ? [] : recortarANiveles(this.arbol(), n - 1).opciones);
    this.levelsChange.emit(n - 1);
    this.quitando.set(null);
    this.cancelarEdicion();
  }
}
