import { Injectable, signal, type TemplateRef, type Type } from '@angular/core';

/**
 * Slot compartido de la barra superior (experiment S59).
 *
 * Permite que una página (lazy) inyecte chrome propio en la TopBar sin que el
 * shell la importe. Dos huecos — el `lead` que hubo aquí murió en la Ola 1: la
 * identidad de TODA página la da el breadcrumb, sin excepciones, y una página
 * que se lo saltaba obligaba al usuario a leer dos gramáticas distintas:
 *
 *  - `component` → `NgComponentOutlet` (componente standalone que lee estado
 *    root, p.ej. el selector de datos demo de Memory). Cero coste de bundle.
 *  - `actions` → `TemplateRef` con las acciones primarias de la página (CTA
 *    "Nuevo X" en listas, Guardar/Cancelar en formularios). Va por template
 *    para que los handlers sigan ligados al componente que lo declara.
 *    Modelo "todo arriba" estilo BeyondUI: la identidad vive en el breadcrumb
 *    y las acciones en la barra → se elimina la banda de page-header.
 *
 * Contrato: la página registra en `ngOnInit`/`afterNextRender` y limpia en
 * `ngOnDestroy`.
 */
@Injectable({ providedIn: 'root' })
export class TopBarSlotService {
  /** Componente a renderizar en el slot de la TopBar, o `null` si vacío. */
  readonly component = signal<Type<unknown> | null>(null);

  /** Acciones primarias (template) a renderizar a la derecha de la TopBar. */
  readonly actions = signal<TemplateRef<unknown> | null>(null);

  set(component: Type<unknown>): void {
    this.component.set(component);
  }

  clear(): void {
    this.component.set(null);
  }

  setActions(tpl: TemplateRef<unknown>): void {
    this.actions.set(tpl);
  }

  clearActions(): void {
    this.actions.set(null);
  }
}
