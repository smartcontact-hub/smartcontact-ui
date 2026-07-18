import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import {
  SC_KEYBOARD_SHORTCUTS_DEFAULT_GROUPS,
  ScCommandPaletteComponent,
  ScCommandPaletteService,
  ScKeyboardShortcutsComponent,
  type ScShortcutGroup,
} from '@smartcontact-hub/components';

import {
  CommandPaletteService,
  LanguageService,
  ThemeService,
  UndoStackService,
} from '@core/services';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { NAV_ICONS } from '@core/icons/nav-icons';
// El confirm ya NO es local: la copia de la app era verbatim del DS (misma
// lógica de botones, mismo `<p-confirmdialog />`, mismo SCSS) y el resolver del
// DS produce exactamente la misma clase de icono que la app hardcodeaba
// (`exclamation-triangle` → `sc-icon-font sc-icon-font--warning`).
import { ScConfirmDialogComponent } from '@smartcontact-hub/components';

type ToastSeverity = 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast';

/**
 * Atajos globales propios de AED (⌘S guardar, ⌘Z deshacer, Esc cerrar) — no los
 * implementa el DS, así que se añaden a los grupos intrínsecos del paquete vía
 * `[groups]`. Strings en español (el cheat-sheet nunca fue i18n-reactivo).
 */
const APP_SHORTCUT_GROUP: ScShortcutGroup = {
  title: 'En cualquier parte',
  items: [
    { label: 'Guardar formulario', keys: ['⌘', 'S'] },
    { label: 'Deshacer última acción', keys: ['⌘', 'Z'] },
    { label: 'Cerrar diálogo / panel', keys: ['Esc'] },
  ],
};

@Component({
  selector: 'sc-root',
  imports: [
    ScCommandPaletteComponent,
    ScConfirmDialogComponent,
    IconComponent,
    ScKeyboardShortcutsComponent,
    RouterOutlet,
    ToastModule,
    TranslateModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly messages = inject(MessageService);
  protected readonly undoStack = inject(UndoStackService);
  /*
   * `ThemeService` runs its DOM-application effect inside the
   * constructor — without an injection somewhere in the running app,
   * the service is never instantiated and `.sc-dark` is never
   * applied. Inject here as a side-effect dependency; the field is
   * unused by the template, but the bootstrap is the goal.
   */
   
  private readonly _theme = inject(ThemeService);
  /*
   * `LanguageService` mismo patrón que ThemeService: el constructor del
   * service llama `translate.use(persistedLang)` para aplicar el idioma
   * al arranque. Inject como side-effect dependency para garantizar
   * instanciación temprana.
   */
   
  private readonly _language = inject(LanguageService);

  private readonly translate = inject(TranslateService);
  private readonly cmdPalette = inject(CommandPaletteService);
  private readonly scPalette = inject(ScCommandPaletteService);

  /** Grupos del cheat-sheet (`?`): los intrínsecos del DS + el grupo global AED. */
  protected readonly shortcutGroups: readonly ScShortcutGroup[] = [
    ...SC_KEYBOARD_SHORTCUTS_DEFAULT_GROUPS,
    APP_SHORTCUT_GROUP,
  ];

  protected readonly closeIcon = 'close';

  constructor() {
    // Alimenta el renderer publicado `<sc-command-palette>` con los comandos
    // derivados de la nav (servicio de la app, mapeando el icono nav→Material).
    // Re-publica en `onLangChange` para que los labels reflejen el idioma
    // cargado (`snapshot()` es un build fresco, no cacheado).
    const publish = (): void =>
      this.scPalette.setCommands(
        this.cmdPalette.snapshot().map((c) => ({
          id: c.id,
          label: c.label,
          category: c.category,
          icon: c.icon ? NAV_ICONS[c.icon] : undefined,
          keywords: c.keywords,
          action: c.action,
        })),
      );
    this.translate.onLangChange.subscribe(publish);
    publish();
  }

  /**
   * Global Ctrl/Cmd+Z — run the most recent undoable action. Skip when the
   * focus is in a text field so we don't shadow the browser's native input
   * undo (DD#2680).
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return;
    if (event.shiftKey) return; // leave Ctrl+Shift+Z (redo) for the browser
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }
    if (!this.undoStack.hasUndo()) return;
    event.preventDefault();
    this.undoStack.popLatest();
  }

  protected onUndoClick(entryId: string): void {
    this.undoStack.runById(entryId);
  }

  /**
   * Map a PrimeNG severity to a Lucide icon. Falls back to Info so an
   * unrecognised severity still renders an icon square. The `secondary`
   * severity is the violet "neutral notice" variant — same Info glyph as
   * `info`, the colour palette is what distinguishes them.
   */
  protected iconFor(severity: ToastSeverity | undefined): string {
    switch (severity) {
      case 'success':
        return 'check_circle';
      case 'warn':
        return 'warning';
      case 'error':
        return 'error';
      case 'info':
      case 'secondary':
      default:
        return 'info';
    }
  }

  /**
   * Manual dismiss on the toast's close X. PrimeNG `MessageService.clear()`
   * with no key clears every active toast — acceptable here because the
   * app rarely shows two simultaneous toasts.
   */
  protected onClose(): void {
    this.messages.clear();
  }
}
