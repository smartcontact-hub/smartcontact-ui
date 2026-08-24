import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { isTypingTarget } from '../../core/utils/is-typing-target';
import { SC_COMMAND_PALETTE_TRANSLATIONS } from './i18n/sc-command-palette.translations';
import { ScCommandPaletteService, ScPaletteCommand } from './sc-command-palette.service';

interface GroupedCommands {
  readonly category: string;
  readonly items: readonly ScPaletteCommand[];
}

/**
 * Command palette overlay (`⌘K` / `Ctrl+K`). Se monta una vez en el shell de la
 * app, escucha el atajo global, y renderiza la lista de comandos buscable que
 * provee `ScCommandPaletteService` (data-driven — los comandos los publica el
 * consumidor con `setCommands`).
 *
 * Keyboard model:
 *   ⌘K / Ctrl+K  toggle open/close
 *   /            enfoca el primer `<sc-search>` visible (cuando la paleta está
 *                cerrada y el foco no está en un campo editable)
 *   Esc          close
 *   ↑ / ↓        mueve el comando resaltado
 *   Enter        ejecuta el comando resaltado
 *
 * Click en el backdrop cierra; click en un comando lo ejecuta.
 */
@Component({
  selector: 'sc-command-palette',
  imports: [ScIconComponent, TranslateModule],
  templateUrl: './sc-command-palette.component.html',
  styleUrl: './sc-command-palette.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScCommandPaletteComponent {
  protected readonly host = inject(ScCommandPaletteService);

  protected readonly searchIcon = 'search';
  protected readonly query = signal('');
  protected readonly highlighted = signal(0);

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly itemEls = viewChildren<ElementRef<HTMLButtonElement>>('itemEl');

  protected readonly filtered = computed<readonly ScPaletteCommand[]>(() => {
    const q = this.query().toLowerCase().trim();
    const all = this.host.commands();
    if (!q) return all;
    return all.filter((c) => {
      if (c.label.toLowerCase().includes(q)) return true;
      return c.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false;
    });
  });

  protected readonly grouped = computed<readonly GroupedCommands[]>(() => {
    const list = this.filtered();
    const map = new Map<string, ScPaletteCommand[]>();
    for (const cmd of list) {
      if (!map.has(cmd.category)) map.set(cmd.category, []);
      map.get(cmd.category)!.push(cmd);
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  });

  constructor() {
    // Copy fijo colocado: registra solo el diccionario del componente.
    const translate = inject(TranslateService);
    for (const [language, dict] of Object.entries(SC_COMMAND_PALETTE_TRANSLATIONS)) {
      translate.setTranslation(language, dict, true);
    }

    /* Reset palette state every time it opens, and focus the search input. */
    effect(() => {
      if (this.host.visible()) {
        this.query.set('');
        this.highlighted.set(0);
        queueMicrotask(() => this.searchInput()?.nativeElement.focus());
      }
    });

    /* Reset highlight when query changes (keep cursor at the top). */
    effect(() => {
      this.query();
      this.highlighted.set(0);
    });
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    /* Toggle on Cmd+K (Mac) / Ctrl+K (Win/Linux). */
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.host.toggle();
      return;
    }
    /* `/` enfoca el primer <sc-search> visible de la página (patrón GitHub /
     * Linear / Slack). Se suprime cuando el usuario está tipeando para no
     * robar la barra. Cuando la paleta ya está abierta tampoco aplica:
     * Esc/Enter/Arrows manejan la paleta. */
    if (event.key === '/' && !isTypingTarget(event.target) && !this.host.visible()) {
      const searchInput = document.querySelector<HTMLInputElement>('sc-search input');
      if (searchInput && searchInput.offsetParent !== null) {
        event.preventDefault();
        searchInput.focus();
        return;
      }
    }
    if (!this.host.visible()) return;
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.host.close();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.move(-1);
        break;
      case 'Enter':
        event.preventDefault();
        this.runHighlighted();
        break;
    }
  }

  protected indexOf(cmd: ScPaletteCommand): number {
    return this.filtered().findIndex((c) => c.id === cmd.id);
  }

  /**
   * Resaltado por ratón. Lo dispara `(mousemove)` y **no** `(mouseenter)`, a
   * propósito: el hover solo cuenta cuando el ratón se MUEVE de verdad.
   *
   * Con `mouseenter`, abrir la paleta debajo de un puntero parado movía el
   * resaltado al ítem que cayera bajo el cursor, sin que el usuario tocara
   * nada — y la paleta se abre sobre todo por atajo de teclado, así que la
   * primera flecha partía de un sitio que él no eligió. Medido el 2026-08-24
   * en `/#/components/commandpalette` (1280x720): al aparecer el overlay bajo
   * un puntero quieto el navegador dispara `mouseover` + `mouseenter` pero
   * **no** `mousemove` ni `pointermove`, así que este cambio deja el resaltado
   * donde lo puso el `effect` de apertura (índice 0) y el hover sigue
   * funcionando en cuanto el ratón se mueve. Es lo que hacen cmdk/VS Code.
   *
   * Corolario que también arregla: con la lista scrolleada por teclado
   * (`.palette__body` tiene `overflow-y:auto`), los ítems que pasaban bajo un
   * cursor parado robaban el resaltado a las flechas.
   */
  protected onItemHover(cmd: ScPaletteCommand): void {
    const idx = this.indexOf(cmd);
    if (idx >= 0) this.highlighted.set(idx);
  }

  protected onBackdropClick(): void {
    this.host.close();
  }

  protected run(cmd: ScPaletteCommand): void {
    cmd.action();
    this.host.close();
  }

  private move(delta: number): void {
    const len = this.filtered().length;
    if (len === 0) return;
    this.highlighted.update((i) => (i + delta + len) % len);
    this.scrollHighlightedIntoView();
  }

  /**
   * Las flechas tienen que ARRASTRAR la vista, no solo el resaltado.
   *
   * `.palette__body` es `overflow-y:auto` dentro de un panel `max-height:70vh`, y
   * en supervisor la lista sale del árbol de navegación entera, así que no cabe.
   * Medido el 2026-08-24 con la ventana a 1280x400: sin esto `scrollTop` se
   * quedaba en 0 las cinco pulsaciones y a partir de la tercera el ítem activo
   * caía 3, 78 y 112 px por DEBAJO del borde visible — o sea que ↓ + Enter
   * ejecutaba un comando que el usuario no llegaba a ver.
   *
   * `block:'nearest'` mueve lo mínimo (y no arrastra la página cuando la paleta
   * ya se ve entera), que es lo que se espera navegando una lista.
   *
   * ⚠️ El índice se traduce a propósito. `highlighted` indexa `filtered()`, pero
   * el DOM se pinta desde `grouped()`: si un consumidor publicase sus comandos
   * con las categorías INTERCALADAS (A, B, A), los dos órdenes dejarían de
   * coincidir e indexar los elementos a pelo scrollearía al ítem equivocado. Por
   * eso se casa por `id`. (Ninguno de los dos consumidores de hoy intercala.)
   */
  private scrollHighlightedIntoView(): void {
    const cmd = this.filtered()[this.highlighted()];
    if (!cmd) return;
    const domIndex = this.grouped()
      .flatMap((g) => g.items)
      .findIndex((c) => c.id === cmd.id);
    this.itemEls()[domIndex]?.nativeElement.scrollIntoView({ block: 'nearest' });
  }

  private runHighlighted(): void {
    const cmd = this.filtered()[this.highlighted()];
    if (cmd) this.run(cmd);
  }
}
