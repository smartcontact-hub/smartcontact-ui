import { Injectable, signal } from '@angular/core';

/**
 * Comando de la paleta. Contrato **data-driven**: el consumidor construye los
 * comandos (traduce el `label` y la `category`, elige el nombre de `icon`
 * Material, y cablea `action`) y los entrega con `setCommands`. El DS no conoce
 * rutas ni el árbol de navegación de la app.
 */
export interface ScPaletteCommand {
  /** Id estable, usado para el tracking del highlight por teclado. */
  readonly id: string;
  /** Etiqueta YA traducida por el consumidor. */
  readonly label: string;
  /** Categoría de agrupación — string libre, ya en formato de display. */
  readonly category: string;
  /** Nombre de icono Material (lo resuelve `sc-icon` directo). */
  readonly icon?: string;
  readonly keywords?: readonly string[];
  /** El consumidor cablea la navegación / la acción que corresponda. */
  readonly action: () => void;
}

/**
 * Fuente de verdad de la paleta de comandos (`⌘K` / `Ctrl+K`).
 *
 * Versión **invertida / data-driven** (Mitad B, lote 6): a diferencia del molde
 * (que inyectaba `Router` + `TranslateService` y derivaba los comandos del árbol
 * `NAV_SECTIONS` con rutas `/admin/*` y categorías en español hardcodeadas), aquí
 * el servicio NO conoce nada de la app — el consumidor entrega los comandos vía
 * `setCommands`. El servicio posee solo la visibilidad y la lista; el renderer
 * (`<sc-command-palette>`, montado una vez en el shell) reacciona a `visible()`.
 */
@Injectable({ providedIn: 'root' })
export class ScCommandPaletteService {
  private readonly _visible = signal(false);
  readonly visible = this._visible.asReadonly();

  private readonly _commands = signal<readonly ScPaletteCommand[]>([]);
  readonly commands = this._commands.asReadonly();

  /** El consumidor publica aquí los comandos (ya traducidos, con `action`). */
  setCommands(commands: readonly ScPaletteCommand[]): void {
    this._commands.set(commands);
  }

  open(): void {
    this._visible.set(true);
  }

  close(): void {
    this._visible.set(false);
  }

  toggle(): void {
    this._visible.update((v) => !v);
  }
}
