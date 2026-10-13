import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
  totalDeOpciones,
  type TipificacionOpcion,
} from '../../state/tipificaciones.core.mjs';

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

/** Las hermanas que comparten nombre (sin mayúsculas ni espacios de los lados), por id: todas menos la primera. */
function repetidasPorId(opciones: readonly TipificacionOpcion[], out = new Set<string>()): Set<string> {
  const vistas = new Set<string>();
  for (const o of opciones) {
    const clave = o.label.trim().toLowerCase();
    if (clave && vistas.has(clave)) out.add(o.id);
    vistas.add(clave);
    repetidasPorId(o.children, out);
  }
  return out;
}

/**
 * LAS CATEGORÍAS DE UNA TIPIFICACIÓN: EL ÁRBOL ENTERO A LA VISTA (revisión de tipificaciones del 2026-10-09). Una
 * columna por nivel, con su título arriba, y cada opción en su columna junto a las suyas, como en Voice: se ve el mapa de
 * todas las ramas a la vez, no solo el camino elegido. Hasta ese día era un Listbox por nivel que enseñaba las hijas de
 * la opción elegida (DD-174), y para ver la rama de otra había que ir eligiendo.
 *
 *   Primer nivel [+ Añadir categoría]   Segundo nivel          Tercer nivel
 *   ─────────────────────────────────────────────────────────────────────
 *   ⠿ Consulta   (↳) 🗑                ⠿ Facturación  (↳) 🗑   ⠿ Importe      🗑
 *                                                           ⠿ Fecha        🗑
 *
 * Cada opción se escribe en su sitio. Dos formas de añadir, y que no se confundan (DD-187): «Añadir categoría», con su
 * nombre escrito, en el título del primer nivel; y en la fila de cada opción, la flecha que baja hacia la columna de al
 * lado («Añadir subcategoría a…»), a la talla del campo. La nueva sale la primera, junto al botón. Enter en una opción abre otra justo detrás, para escribirlas seguidas. Se
 * ordena con el tirador, que aparece al pasar por la fila: arrastrándolo, o con el foco en él y las flechas.
 *
 * Las tres columnas siempre, y cada rama llega hasta donde haga falta (revisión del 2026-10-09): sin selector de niveles
 * ni avisos de rama corta; los niveles de la tipificación son los de su rama más larga (`profundidad`). Una opción sin
 * nombre, o con el de una hermana, marca su campo.
 *
 * No guarda nada: emite el árbol y los niveles, y la ficha los lleva en su formulario.
 */
@Component({
  selector: 'sc-tipificacion-niveles',
  imports: [
    ButtonComponent,
    DialogComponent,
    IconComponent,
    InputTextComponent,
    NgTemplateOutlet,
    TooltipModule,
    TranslateModule,
  ],
  templateUrl: './tipificacion-niveles.component.html',
  styleUrl: './tipificacion-niveles.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TipificacionNivelesComponent {
  private readonly translate = inject(TranslateService);
  private readonly injector = inject(Injector);
  private readonly lang = injectLangChange();

  readonly options = input.required<readonly TipificacionOpcion[]>();
  readonly optionsChange = output<readonly TipificacionOpcion[]>();

  /**
   * El árbol con el que se trabaja: el de la ficha, puesto al día en el acto con cada cambio de aquí. Sin él, dos
   * cambios seguidos partían los dos del árbol de antes (la ficha aún no lo había devuelto) y el segundo pisaba al
   * primero. Cuando la ficha manda otro (Deshacer), vuelve a ser el suyo.
   */
  private readonly arbol = linkedSignal(() => this.options());
  protected readonly ramas = computed(() => this.arbol());

  private cambiar(nuevo: readonly TipificacionOpcion[]): void {
    this.arbol.set(nuevo);
    this.optionsChange.emit(nuevo);
  }

  protected readonly niveles = NIVELES_MAXIMOS;
  protected readonly columnas = Array.from({ length: NIVELES_MAXIMOS }, (_, i) => i);

  protected titulo(nivel: number): string {
    return `repositories.tipificaciones.level_title.${nivel + 1}`;
  }

  /* ── Lo que está mal: sin nombre, repetida o rama corta ──────────────────── */

  private readonly repetidas = computed(() => repetidasPorId(this.arbol()));

  protected invalida(opcion: TipificacionOpcion): boolean {
    return !opcion.label.trim() || this.repetidas().has(opcion.id);
  }

  /** La línea bajo el árbol, solo cuando falta algo (una hermana repetida, una opción sin nombre). Completo, calla: el
   *  árbol ya se ve entero, y el resumen («33 opciones en 3 niveles») no decía nada nuevo (DD-187). */
  protected readonly estado = computed<string | null>(() => {
    this.lang();
    const t = (k: string) => this.translate.instant(`repositories.tipificaciones.tree_status.${k}`);
    if (this.repetidas().size > 0) return t('repeated');
    if (this.sinNombre(this.arbol())) return t('unnamed');
    return null;
  });

  private sinNombre(opciones: readonly TipificacionOpcion[]): boolean {
    return opciones.some((o) => !o.label.trim() || this.sinNombre(o.children));
  }

  /* ── Escribir, añadir y quitar ───────────────────────────────────────────── */

  protected renombrar(padres: readonly string[], id: string, label: string): void {
    this.cambiar(cambiarHijas(this.arbol(), padres, (hijas) => hijas.map((o) => (o.id === id ? { ...o, label } : o))));
  }

  /** «Añadir categoría», en la esquina de la sección: una opción más del primer nivel, la primera y con el foco. */
  anadirCategoria(): void {
    this.anadir([], 'inicio');
  }

  /**
   * Una opción nueva, vacía y con el foco: en el primer nivel, la primera (su «Añadir categoría» está arriba); debajo
   * de una opción, la primera de la columna de al lado; con Enter, justo detrás de la que se escribía.
   */
  protected anadir(padres: readonly string[], donde: 'inicio' | 'fin' | { readonly tras: string } = 'fin'): void {
    const id = nuevoIdDeOpcion(this.arbol());
    const nueva: TipificacionOpcion = { id, label: '', children: [] };
    this.cambiar(
      cambiarHijas(this.arbol(), padres, (hijas) => {
        if (donde === 'inicio') return [nueva, ...hijas];
        if (donde === 'fin') return [...hijas, nueva];
        const i = hijas.findIndex((o) => o.id === donde.tras);
        return [...hijas.slice(0, i + 1), nueva, ...hijas.slice(i + 1)];
      }),
    );
    this.enfocar(id);
  }

  private enfocar(id: string): void {
    afterNextRender(() => document.getElementById(`tip-op-${id}`)?.focus(), { injector: this.injector });
  }

  /** Enter abre otra detrás; Escape en una vacía la quita. */
  protected tecla(event: KeyboardEvent, padres: readonly string[], opcion: TipificacionOpcion): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (opcion.label.trim()) this.anadir(padres, { tras: opcion.id });
    } else if (event.key === 'Escape' && !opcion.label.trim()) {
      this.eliminar(padres, opcion);
    }
  }

  /** Al salir de una opción que se ha quedado vacía y no tiene nada debajo, se va: no deja huecos. */
  protected alSalir(padres: readonly string[], opcion: TipificacionOpcion): void {
    const actual = this.buscar(padres, opcion.id);
    if (actual && !actual.label.trim() && actual.children.length === 0) this.eliminar(padres, actual);
  }

  private buscar(padres: readonly string[], id: string): TipificacionOpcion | undefined {
    let lista: readonly TipificacionOpcion[] = this.arbol();
    for (const p of padres) lista = lista.find((o) => o.id === p)?.children ?? [];
    return lista.find((o) => o.id === id);
  }

  /** La opción que se va a eliminar con lo que cuelga de ella: solo se pregunta si se lleva algo más. */
  protected readonly eliminando = signal<{ padres: readonly string[]; opcion: TipificacionOpcion; debajo: number } | null>(null);

  protected pedirEliminar(padres: readonly string[], opcion: TipificacionOpcion): void {
    const debajo = totalDeOpciones(opcion.children);
    if (debajo === 0) this.eliminar(padres, opcion);
    else this.eliminando.set({ padres, opcion, debajo });
  }

  protected confirmarEliminar(): void {
    const e = this.eliminando();
    if (e) this.eliminar(e.padres, e.opcion);
    this.eliminando.set(null);
  }

  private eliminar(padres: readonly string[], opcion: TipificacionOpcion): void {
    this.cambiar(cambiarHijas(this.arbol(), padres, (hijas) => hijas.filter((o) => o.id !== opcion.id)));
  }

  /* ── Ordenar con el tirador ──────────────────────────────────────────────── */

  /** Lo que el lector oye tras mover: la opción y su puesto. */
  protected readonly anuncio = signal('');
  /** La que se arrastra, por su id, y su lista. */
  private arrastrando: { readonly padres: readonly string[]; readonly id: string } | null = null;

  protected mover(padres: readonly string[], id: string, salto: -1 | 1): void {
    let nombre = '';
    let puesto = 0;
    let total = 0;
    this.cambiar(
      cambiarHijas(this.arbol(), padres, (hijas) => {
        const de = hijas.findIndex((o) => o.id === id);
        const a = de + salto;
        if (de < 0 || a < 0 || a >= hijas.length) return hijas;
        const copia = [...hijas];
        const [o] = copia.splice(de, 1);
        copia.splice(a, 0, o!);
        nombre = o!.label;
        puesto = a + 1;
        total = copia.length;
        return copia;
      }),
    );
    if (total) {
      this.anuncio.set(this.translate.instant('common.columns_position', { column: nombre, position: puesto, total }));
      this.enfocarTirador(id);
    }
  }

  private enfocarTirador(id: string): void {
    afterNextRender(() => document.getElementById(`tip-mover-${id}`)?.focus(), { injector: this.injector });
  }

  protected teclaTirador(event: KeyboardEvent, padres: readonly string[], id: string): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.mover(padres, id, event.key === 'ArrowUp' ? -1 : 1);
    }
  }

  protected empezarArrastre(event: DragEvent, padres: readonly string[], id: string): void {
    this.arrastrando = { padres, id };
    event.dataTransfer?.setData('text/plain', id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  /** Solo se suelta entre hermanas: arrastrar no cambia una opción de rama ni de nivel. */
  protected sobre(event: DragEvent, padres: readonly string[]): void {
    if (this.arrastrando && this.mismaLista(this.arrastrando.padres, padres)) event.preventDefault();
  }

  protected soltar(event: DragEvent, padres: readonly string[], destino: string): void {
    const a = this.arrastrando;
    this.arrastrando = null;
    if (!a || !this.mismaLista(a.padres, padres) || a.id === destino) return;
    event.preventDefault();
    // Queda en el puesto de la que estaba debajo: detrás de ella si baja, delante si sube.
    this.cambiar(
      cambiarHijas(this.arbol(), padres, (hijas) => {
        const de = hijas.findIndex((o) => o.id === a.id);
        const puesto = hijas.findIndex((o) => o.id === destino);
        if (de < 0 || puesto < 0) return hijas;
        const copia = [...hijas];
        const [o] = copia.splice(de, 1);
        copia.splice(puesto, 0, o!);
        return copia;
      }),
    );
  }

  protected terminarArrastre(): void {
    this.arrastrando = null;
  }

  private mismaLista(a: readonly string[], b: readonly string[]): boolean {
    return a.length === b.length && a.every((x, i) => x === b[i]);
  }

  /** El nombre de cada acción dice sobre qué opción actúa. */
  protected accion(clave: string, opcion: TipificacionOpcion): string {
    this.lang();
    return this.translate.instant(clave, { name: opcion.label.trim() || this.translate.instant('repositories.tipificaciones.unnamed') });
  }
}
