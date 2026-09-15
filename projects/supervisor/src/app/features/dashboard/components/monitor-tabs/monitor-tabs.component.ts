import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MenuModule } from 'primeng/menu';
import { Popover, PopoverModule } from 'primeng/popover';
import { TabsModule } from 'primeng/tabs';
import type { MenuItem } from 'primeng/api';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';
import { ScInlineRenameCellComponent as InlineRenameCellComponent } from '@smartcontact-hub/components';

import { injectLangChange } from '@core/utils/lang-change';

import type { DashboardMonitor } from '../../data/dashboard.types';

/**
 * Pestañas de monitores, con las `p-tabs` de primeng.dev y el tema del DS (aspecto Aura: todas en
 * semibold, la activa en color primario con barra de 1 px, flechas cuando no caben).
 *
 * El original las pone ABAJO y a 780 de alto se cortaban (medido el 2026-09-14); aquí van arriba.
 * Se conserva lo que el original hace: renombrar (doble clic, F2 o el ⋮), duplicar, borrar (nunca el
 * último) y reordenar arrastrando.
 *
 * Dos cosas quedan FUERA de cada `p-tab` a propósito, porque PrimeNG mueve el foco con las flechas al
 * elemento hermano y escucha las teclas de la pestaña: el ⋮ (uno, el del monitor activo, detrás de la
 * tira) y el campo de renombrar (en un popover anclado a la pestaña). Dentro de la pestaña habrían
 * capturado las flechas y el espacio.
 */
@Component({
  selector: 'sc-dashboard-monitor-tabs',
  imports: [
    TranslateModule,
    MenuModule,
    PopoverModule,
    TabsModule,
    CdkDropList,
    CdkDrag,
    ButtonComponent,
    InlineRenameCellComponent,
  ],
  templateUrl: './monitor-tabs.component.html',
  styleUrl: './monitor-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorTabsComponent {
  /** La tira sin el fondo de contenido de `p-tabs`: sobre el suelo de la página, como el resto de la cabecera. */
  protected readonly tabsDt = { tablist: { background: 'transparent' } };

  private readonly translate = inject(TranslateService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly lang = injectLangChange();

  readonly monitors = input.required<readonly DashboardMonitor[]>();
  readonly activeId = input.required<string>();

  readonly activate = output<string>();
  readonly add = output<void>();
  readonly rename = output<{ id: string; name: string }>();
  readonly duplicate = output<string>();
  readonly remove = output<string>();
  readonly move = output<{ from: number; to: number }>();

  private readonly renamePopover = viewChild.required<Popover>('renamePopover');

  protected readonly activeName = computed(() => this.monitors().find((m) => m.id === this.activeId())?.name ?? '');

  protected readonly menuItems = computed<MenuItem[]>(() => {
    this.lang();
    const id = this.activeId();
    const single = this.monitors().length === 1;
    return [
      { label: this.translate.instant('dashboard.tabs.rename'), icon: 'sc-icon-font sc-icon-font--edit', command: () => this.openRename() },
      { label: this.translate.instant('dashboard.tabs.duplicate'), icon: 'sc-icon-font sc-icon-font--content_copy', command: () => this.duplicate.emit(id) },
      { separator: true },
      {
        label: this.translate.instant('dashboard.tabs.remove'),
        icon: 'sc-icon-font sc-icon-font--delete',
        styleClass: 'sc-menu-item--danger',
        // Un monitor siempre tiene que quedar: el original también lo impide.
        disabled: single,
        command: () => this.remove.emit(id),
      },
    ];
  });

  protected onValueChange(value: string | number | undefined): void {
    if (typeof value === 'string') this.activate.emit(value);
  }

  /** Abre el campo de renombrar junto a la pestaña activa (doble clic, F2 o el ⋮). */
  protected openRename(event?: Event): void {
    const tab = this.host.nativeElement.querySelector<HTMLElement>('[role=tab][aria-selected=true]');
    if (!tab) return;
    // Un evento cuyo `currentTarget` es la pestaña, para que el popover se ancle a ella.
    const anchor = event ?? new MouseEvent('click');
    queueMicrotask(() => this.renamePopover().show(anchor, tab));
  }

  /**
   * El campo se enfoca solo al montarse, pero eso ocurre ANTES de que el popover sea visible y el foco
   * se quedaba en la pestaña (lo tecleado no llegaba al campo; medido con Playwright). Se enfoca y se
   * selecciona cuando el popover ya se ha mostrado.
   */
  protected focusRename(): void {
    const input = document.querySelector<HTMLInputElement>('.p-popover sc-inline-rename-cell input');
    input?.focus();
    input?.select();
  }

  protected commitRename(name: string): void {
    this.renamePopover().hide();
    this.rename.emit({ id: this.activeId(), name });
  }

  protected onTabKeydown(event: KeyboardEvent, id: string): void {
    if (event.key !== 'F2' || id !== this.activeId()) return;
    event.preventDefault();
    this.openRename(event);
  }

  protected dropped(event: CdkDragDrop<readonly DashboardMonitor[]>): void {
    this.move.emit({ from: event.previousIndex, to: event.currentIndex });
  }
}
