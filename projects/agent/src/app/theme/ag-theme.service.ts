import { effect, Injectable, signal } from '@angular/core';

/**
 * Tema del cartón pluma del Agent: dark por defecto (fiel a la web real).
 * El toggle luna/sol del perfil alterna `dark`; el efecto pone/quita la clase
 * `.ag-light` en <html>, que reescribe las variables --ag-* (ver main.scss).
 */
@Injectable({ providedIn: 'root' })
export class AgThemeService {
  readonly dark = signal(true);

  constructor() {
    effect(() => {
      document.documentElement.classList.toggle('ag-light', !this.dark());
    });
  }

  toggle(): void {
    this.dark.update((d) => !d);
  }
}
