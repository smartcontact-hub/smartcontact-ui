import { Injectable, signal } from '@angular/core';

/**
 * Dueño de la visibilidad del overlay de atajos de teclado. Vive como servicio
 * (`providedIn: 'root'`) para que cualquier parte del chrome (un botón de la
 * top-bar, la entrada "Atajos" de la paleta de comandos, un menú de ayuda…)
 * pueda abrir el cheat-sheet sin tener una referencia a la instancia del
 * componente. El overlay (`<sc-keyboard-shortcuts>`) solo lee `visible` y lo
 * togglea en `?` / `Escape` — el host-listener vive en el componente.
 */
@Injectable({ providedIn: 'root' })
export class ScKeyboardShortcutsService {
  readonly visible = signal(false);

  open(): void {
    this.visible.set(true);
  }

  close(): void {
    this.visible.set(false);
  }

  toggle(): void {
    this.visible.update((v) => !v);
  }
}
