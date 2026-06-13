import { ChangeDetectionStrategy, Component, HostListener, inject, input } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SC_ICON_SIZE_DEFAULT, ScIconComponent } from '@smartcontact-hub/icons';

import { isTypingTarget } from '../../core/utils/is-typing-target';
import { ScCommandPaletteService } from '../command-palette/sc-command-palette.service';
import { SC_KEYBOARD_SHORTCUTS_TRANSLATIONS } from './i18n/sc-keyboard-shortcuts.translations';
import { ScKeyboardShortcutsService } from './sc-keyboard-shortcuts.service';

/** Un grupo de atajos del cheat-sheet. `title`/`label` se pasan por el pipe
 * `translate`: las claves de los grupos intrínsecos del DS resuelven por el dict
 * colocado; las strings ya traducidas del consumidor pasan tal cual. */
export interface ScShortcutGroup {
  readonly title: string;
  readonly items: ReadonlyArray<{ readonly label: string; readonly keys: readonly string[] }>;
}

/**
 * Grupos intrínsecos del DS (default colocado). El consumidor los reemplaza o
 * extiende vía el input `[groups]` (spread de esta constante + sus grupos de
 * app — ⌘S guardar, ⌘Z deshacer, etc.). Solo cubren los atajos que el propio DS
 * implementa: ⌘K/Ctrl+K, `/`, `?`, ↑↓, ↵, Esc.
 */
export const SC_KEYBOARD_SHORTCUTS_DEFAULT_GROUPS: readonly ScShortcutGroup[] = [
  {
    title: 'sc.keyboardShortcuts.navTitle',
    items: [
      { label: 'sc.keyboardShortcuts.openPalette', keys: ['⌘', 'K'] },
      { label: 'sc.keyboardShortcuts.openPaletteWin', keys: ['Ctrl', 'K'] },
      { label: 'sc.keyboardShortcuts.focusSearch', keys: ['/'] },
      { label: 'sc.keyboardShortcuts.showShortcuts', keys: ['?'] },
    ],
  },
  {
    title: 'sc.keyboardShortcuts.paletteTitle',
    items: [
      { label: 'sc.keyboardShortcuts.moveSelection', keys: ['↑', '↓'] },
      { label: 'sc.keyboardShortcuts.execute', keys: ['↵'] },
      { label: 'sc.keyboardShortcuts.close', keys: ['Esc'] },
    ],
  },
];

/**
 * Cheat-sheet de atajos de teclado, disparado por la tecla `?` desde cualquier
 * parte de la app. Renderiza un overlay modal-like que lista cada atajo agrupado
 * por propósito. Se suprime mientras el usuario tipea en un input/textarea/select
 * (o contenteditable) para que `?` escriba el carácter en vez de abrir la ayuda.
 *
 * Se monta una vez en el shell. La visibilidad la posee `ScKeyboardShortcutsService`
 * (para que el chrome la abra sin referenciar la instancia); inyecta también
 * `ScCommandPaletteService` para no solaparse con la paleta abierta. Los grupos
 * de atajos son data-driven (`[groups]`) con un default colocado intrínseco.
 */
@Component({
  selector: 'sc-keyboard-shortcuts',
  imports: [ScIconComponent, TranslateModule],
  templateUrl: './sc-keyboard-shortcuts.component.html',
  styleUrl: './sc-keyboard-shortcuts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScKeyboardShortcutsComponent {
  private readonly palette = inject(ScCommandPaletteService);
  private readonly shortcuts = inject(ScKeyboardShortcutsService);

  /** Grupos a mostrar. Default = los intrínsecos del DS; el consumidor reemplaza
   * o extiende con `[groups]="[...SC_KEYBOARD_SHORTCUTS_DEFAULT_GROUPS, miGrupo]"`. */
  readonly groups = input<readonly ScShortcutGroup[]>(SC_KEYBOARD_SHORTCUTS_DEFAULT_GROUPS);

  protected readonly closeIcon = 'close';
  protected readonly iconSizeDefault = SC_ICON_SIZE_DEFAULT;
  protected readonly visible = this.shortcuts.visible;

  constructor() {
    // Copy fijo colocado: registra solo el diccionario del componente.
    const translate = inject(TranslateService);
    for (const [language, dict] of Object.entries(SC_KEYBOARD_SHORTCUTS_TRANSLATIONS)) {
      translate.setTranslation(language, dict, true);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    /* Esc cierra si está abierto. Se maneja incluso tipeando — el usuario
     * presiona Esc para descartar paneles, eso tiene prioridad. */
    if (this.visible() && event.key === 'Escape') {
      event.preventDefault();
      this.shortcuts.close();
      return;
    }

    /* `?` abre el cheat-sheet — pero solo cuando el usuario no está tipeando en
     * un elemento editable; si no, `?` dentro de un campo robaría el carácter. */
    if (event.key === '?' && !isTypingTarget(event.target)) {
      /* No solaparse con la paleta de comandos ya abierta. */
      if (this.palette.visible()) return;
      event.preventDefault();
      this.shortcuts.toggle();
    }
  }

  protected onBackdropClick(): void {
    this.shortcuts.close();
  }

  protected onClose(): void {
    this.shortcuts.close();
  }
}
