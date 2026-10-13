import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { ScIconComponent } from '@smartcontact-hub/icons';

/** Una entrada del sidebar. Independiente: sin hijos ni desplegables. */
export interface SidebarItem {
  /** Identificador estable; es lo que `activeKey` y `(itemSelect)` comparan. */
  readonly key: string;
  readonly label: string;
  /** Nombre de Material Symbols (Outlined). */
  readonly icon: string;
}

/**
 * Sidebar de CusCare: franja plegada a 80px que se despliega a 240px con el ratón o el
 * teclado y se pliega 300ms después de salir (el comportamiento y los tokens `--sc-sidebar-*` del tablero
 * de Figma 14912:6324). Vive en esta app, no en el DS: es de CusCare y no toca ningún componente común.
 *
 * Es una versión SIN router y SIN categorías: el consumidor pasa las entradas, dice cuál
 * está activa (`activeKey`) y navega al recibir `(itemSelect)`. Así no arrastra ninguna
 * dependencia de enrutado ni de traducción: las etiquetas llegan ya resueltas.
 *
 * Slot `[appSidebarBrand]`: el logo. Va siempre visible a la izquierda de la franja; si trae
 * un segundo elemento con la clase `sidebar__reveal`, ese aparece al desplegar.
 */
@Component({
  selector: 'app-sidebar',
  imports: [ScIconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.sidebar--expanded]': 'hovered() || focusWithin()',
  },
})
export class SidebarComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Las entradas, en orden. Las etiquetas llegan ya traducidas. */
  readonly items = input.required<readonly SidebarItem[]>();
  /** La entrada de la página actual (`aria-current="page"`). */
  readonly activeKey = input<string | null>(null);
  /** Nombre accesible de la navegación. */
  readonly ariaLabel = input<string>('Navegación principal');

  /** Emite la `key` de la entrada pulsada; el consumidor navega. */
  readonly itemSelect = output<string>();

  protected readonly hovered = signal(false);
  protected readonly focusWithin = signal(false);

  private static readonly COLLAPSE_AFTER_LEAVE_MS = 300;
  private leaveTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.leaveTimer));
  }

  protected onEnter(): void {
    clearTimeout(this.leaveTimer);
    this.hovered.set(true);
  }

  protected onLeave(): void {
    clearTimeout(this.leaveTimer);
    this.leaveTimer = setTimeout(() => this.hovered.set(false), SidebarComponent.COLLAPSE_AFTER_LEAVE_MS);
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.host.nativeElement.contains(next)) this.focusWithin.set(false);
  }

  protected select(item: SidebarItem): void {
    this.itemSelect.emit(item.key);
    // Tras navegar, quita el foco: `:focus-within` mantendría el sidebar abierto para siempre.
    const active = document.activeElement;
    if (active instanceof HTMLElement && this.host.nativeElement.contains(active)) active.blur();
    this.focusWithin.set(false);
  }
}
