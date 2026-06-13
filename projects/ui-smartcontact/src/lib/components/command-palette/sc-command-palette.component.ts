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
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SC_ICON_SIZE_DEFAULT, SC_ICON_SIZE_LG, ScIconComponent } from '@smartcontact-hub/icons';

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
  protected readonly iconSizeDefault = SC_ICON_SIZE_DEFAULT;
  protected readonly iconSizeLg = SC_ICON_SIZE_LG;
  protected readonly query = signal('');
  protected readonly highlighted = signal(0);

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

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
  }

  private runHighlighted(): void {
    const cmd = this.filtered()[this.highlighted()];
    if (cmd) this.run(cmd);
  }
}
