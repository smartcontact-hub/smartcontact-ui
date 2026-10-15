import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDropList, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CheckboxModule } from 'primeng/checkbox';
import { PopoverModule } from 'primeng/popover';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent, ScSearchComponent } from '@smartcontact-hub/components';

import { escapeSearch } from '@core/utils/escape-search';
import { injectLangChange } from '@core/utils/lang-change';

/** Una columna en el globo: su clave, su nombre y si es la fija (la que nombra la fila: ni se quita ni se mueve). */
export interface ColumnToggleOption {
  readonly key: string;
  readonly label: string;
  readonly locked: boolean;
}

/** Con más columnas que estas, el globo lleva buscador: las 34 de un contacto no se recorren a ojo. */
const BUSCADOR_DESDE = 12;

/**
 * ELEGIR Y ORDENAR COLUMNAS: el «Column Toggle» de primeng.dev/table, tal cual (DD-176, sustituye el Listbox de DD-162).
 * El botón con su icono (outlined, secondary), a la altura del buscador de su barra; el Popover sin relleno; arriba, el
 * título y «Restablecer»; una fila por columna con su asa, su casilla nativa y su nombre, que se arrastra para ordenar.
 *
 * Lo único que el ejemplo no trae es ordenar sin arrastrar (WCAG 2.1.1 y 2.5.7, que DD-162 ya pedía): la lista es una
 * sola parada del tabulador, las flechas van de una columna a otra, Alt+↑/↓ mueve la enfocada. Y, con muchas columnas,
 * un buscador encima de la lista (revisión de producto del 2026-10-15, los contactos de una agenda): mientras busca, se
 * marcan y desmarcan, pero no se ordenan, porque el puesto de una columna es el de la lista entera.
 *
 * Solo pinta y avisa. Lo que se guarda (qué se ve, en qué orden) es de quien lo usa: `sc-list-page` en las listas, la
 * tabla de contactos en una agenda.
 */
@Component({
  selector: 'sc-column-toggle',
  imports: [
    CdkDrag,
    CdkDropList,
    CheckboxModule,
    FormsModule,
    PopoverModule,
    ScButtonComponent,
    ScIconComponent,
    ScSearchComponent,
    TranslateModule,
  ],
  templateUrl: './column-toggle.component.html',
  styleUrl: './column-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnToggleComponent {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  private readonly document = inject(DOCUMENT);

  /** Las columnas, en el orden de la tabla (también las ocultas). */
  readonly options = input.required<readonly ColumnToggleOption[]>();
  /** Las que se ven. */
  readonly visible = input.required<readonly string[]>();
  /** Tamaño del botón: el de la barra donde va (`sm` junto a botones pequeños). */
  readonly size = input<'sm' | 'md'>('md');

  readonly visibleChange = output<readonly string[]>();
  /** Mover una columna de un puesto a otro de la lista entera (arrastrando o con Alt+↑/↓). */
  readonly reorder = output<{ readonly from: number; readonly to: number }>();
  /** «Restablecer»: las columnas y el orden de partida. */
  readonly restore = output<void>();

  protected readonly ariaLabel = computed(() => {
    this.lang();
    return this.translate.instant('common.columns_visible', {
      visible: this.visible().length,
      total: this.options().length,
    });
  });

  /** El globo abierto: su botón lo dice (`aria-expanded`). */
  protected readonly open = signal(false);
  /** El icono de columnas: al cerrar el globo con el foco dentro, vuelve aquí. */
  private readonly button = viewChild('button', { read: ElementRef });
  /** Del título del globo cuelgan su nombre y los ids de sus casillas. */
  protected readonly titleId = `columnas-${Math.random().toString(36).slice(2, 8)}`;

  /** El ancho del globo: el paso del Kit más cercano a los 18rem del ejemplo (`w-72`). */
  protected readonly popoverStyle = { width: 'var(--sc-spacing-18)' };
  /** El contenido del globo sin relleno, como el ejemplo (`[pt]="{ content: 'p-0!' }"`): lo ponen su cabecera y su lista. */
  protected readonly popoverPt = { content: { style: { padding: '0' } } };

  /* ── El buscador, con muchas columnas ─────────────────────────────────────────────────────────────────────────── */

  protected readonly searchable = computed(() => this.options().length > BUSCADOR_DESDE);
  protected readonly query = signal('');
  /** Las filas que se ven en el globo: todas, o las que casan con lo buscado. */
  protected readonly shown = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q ? this.options().filter((o) => o.label.toLowerCase().includes(q)) : this.options();
  });
  /** Mientras se busca no se ordena: el puesto de una columna es el de la lista entera. */
  protected readonly sortable = computed(() => !this.query().trim());

  protected onSearchKey(event: KeyboardEvent): void {
    escapeSearch(event, this.query(), () => this.query.set(''));
  }

  /* ── Marcar, ordenar y moverse con el teclado ─────────────────────────────────────────────────────────────────── */

  /**
   * La columna en curso: la última enfocada en la lista, la que mueve Alt+↑/↓, y la que lleva el foco al volver a la
   * lista. Ordenar con el teclado (WCAG 2.1.1, DD-162); sin «Subir» y «Bajar» en la fila (DD-203).
   */
  protected readonly current = signal<string | null>(null);

  /** Las columnas que se pueden enfocar: las que se ven y no son fijas (la fija va con su casilla apagada). */
  private readonly movable = computed(() => this.shown().filter((o) => !o.locked));

  /** La lista es una sola parada del tabulador: solo la columna en curso (o la primera movible) lleva `tabindex` 0. */
  protected tabindexOf(key: string): number {
    const keys = this.movable().map((o) => o.key);
    const active = this.current() && keys.includes(this.current()!) ? this.current() : keys[0];
    return key === active ? 0 : -1;
  }

  protected inputIdOf(key: string): string {
    return `${this.titleId}-${key}`;
  }

  /** El globo: qué columnas se ven. Lo marcado fuera de lo buscado se queda como estaba. */
  protected onVisibleChange(keys: readonly unknown[]): void {
    const chosen = new Set(keys.filter((k): k is string => typeof k === 'string'));
    const shown = new Set(this.shown().map((o) => o.key));
    for (const k of this.visible()) if (!shown.has(k)) chosen.add(k);
    for (const o of this.options()) if (o.locked) chosen.add(o.key);
    this.visibleChange.emit(this.options().filter((o) => chosen.has(o.key)).map((o) => o.key));
  }

  /** Las flechas van de una columna a otra (y Inicio y Fin, a la primera y la última); con Alt, la mueven. Espacio la
   *  marca, el nativo. */
  protected onListKeydown(event: KeyboardEvent): void {
    if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      this.move(event.key === 'ArrowUp' ? -1 : 1);
      return;
    }
    const keys = this.movable().map((o) => o.key);
    if (!keys.length) return;
    const from = Math.max(0, keys.indexOf(this.current() ?? keys[0]!));
    const to =
      event.key === 'ArrowDown' ? Math.min(keys.length - 1, from + 1)
      : event.key === 'ArrowUp' ? Math.max(0, from - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? keys.length - 1
      : -1;
    if (to < 0) return;
    event.preventDefault();
    this.focus(keys[to]!);
  }

  private focus(key: string): void {
    this.current.set(key);
    this.document.getElementById(this.inputIdOf(key))?.focus();
  }

  /**
   * Al abrir, el foco entra en la lista, en la columna en curso: el globo cuelga de `<body>` y, sin esto, con el teclado
   * no se llegaba (medido el 2026-10-05, DD-162). Se enfoca aquí y no con `focusOnShow`, que iría a «Restablecer».
   */
  protected onShow(): void {
    this.open.set(true);
    const key = this.current() ?? this.movable()[0]?.key;
    if (key) setTimeout(() => this.focus(key));
  }

  /** El globo se ha cerrado. Con el foco dentro (Escape, o el botón que lo tenía), el foco vuelve al icono; si se cerró
   *  pulsando fuera, el foco es de lo pulsado y no se toca. Lo buscado se olvida. */
  protected onHide(): void {
    this.open.set(false);
    this.announcement.set('');
    this.query.set('');
    const active = this.document.activeElement;
    if (!active || active === this.document.body) {
      (this.button()?.nativeElement as HTMLElement | undefined)?.querySelector('button')?.focus();
    }
  }

  protected onReset(): void {
    this.announcement.set('');
    this.restore.emit();
  }

  /** Lo que dice el lector tras mover: la columna y su puesto («Email, 3 de 10»). */
  protected readonly announcement = signal('');

  /** Si la columna en curso sube o baja: sin salir de la lista ni pasar por encima de una fija. `null` si es fija o no hay. */
  private readonly currentMove = computed(() => {
    const options = this.options();
    const index = options.findIndex((o) => o.key === this.current());
    const opt = options[index];
    if (!opt || opt.locked) return null;
    return {
      index,
      label: opt.label,
      up: index > 0 && !options[index - 1]!.locked,
      down: index < options.length - 1 && !options[index + 1]!.locked,
    };
  });

  /**
   * Mueve la columna en curso un puesto (Alt+↑/↓). La fila cambia de sitio en el DOM y con ella se iría el foco: vuelve a
   * su casilla, para poder repetir sin buscarla.
   */
  private move(delta: -1 | 1): void {
    const key = this.current();
    const move = this.currentMove();
    if (!this.sortable() || !key || !move || !(delta < 0 ? move.up : move.down)) return;
    this.reorder.emit({ from: move.index, to: move.index + delta });
    this.announcement.set(
      this.translate.instant('common.columns_position', {
        column: move.label,
        position: move.index + delta + 1,
        total: this.options().length,
      }),
    );
    setTimeout(() => this.document.getElementById(this.inputIdOf(key))?.focus());
  }

  /**
   * Se ha soltado una fila en el globo (DD-176, `cdkDropList` como el ejemplo). Las visibles se quedan las mismas; el
   * orden es el de la lista. Las fijas vuelven a su sitio aunque se suelten encima (lo resuelve quien guarda).
   */
  protected onDrop(event: Pick<CdkDragDrop<unknown>, 'previousIndex' | 'currentIndex'>): void {
    if (event.previousIndex !== event.currentIndex) this.reorder.emit({ from: event.previousIndex, to: event.currentIndex });
  }
}
