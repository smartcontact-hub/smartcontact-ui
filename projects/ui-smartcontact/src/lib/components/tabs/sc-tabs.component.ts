import { ChangeDetectionStrategy, Component, computed, input, model, ViewEncapsulation } from '@angular/core';
import { TabsModule } from 'primeng/tabs';

import { ScIconComponent } from '@smartcontact-hub/icons';

/** Una pestaña de `sc-tabs`. */
export interface ScTab {
  /** Lo que identifica la pestaña; es lo que llega por `value`. */
  readonly value: string | number;
  /** El texto de la pestaña, ya traducido. */
  readonly label: string;
  /** Un icono del DS delante del texto (opcional). */
  readonly icon?: string;
  /** La pestaña se ve pero no se elige. */
  readonly disabled?: boolean;
}

/**
 * Una tira de pestañas que cambia lo que se ve debajo. Wrapper Standard sobre `<p-tabs>` + `<p-tablist>` de
 * primeng.dev (DD-194): la tira, la raya que se desliza, la activa y el teclado (flechas, Inicio, Fin) son los nativos,
 * con los tokens del tema.
 *
 * **Cuándo sí y cuándo no**: vistas hermanas de una misma cosa (Chat y Email de Plantillas, Transcripción y Análisis de
 * una conversación). Para elegir un valor de un campo, `sc-selectbutton`; para filtrar una tabla, su filtro.
 *
 * Qué añade el wrapper, y por qué:
 *   - **La tira tiene nombre, siempre** (`ariaLabel`, obligatorio). El nombre tiene que ir al nodo con
 *     `role="tablist"`, que es el `content` de dentro de `p-tablist`, no su host: con `[attr.aria-label]` en el host la
 *     tira se queda sin nombre (medido 2026-09-15). Va por su entrada `pt`, y cada uso lo repetía.
 *   - **Las pestañas, como datos** (`tabs`), con su icono del DS si lo llevan.
 *   - **Sin paneles.** El cuerpo de cada pestaña lo pinta quien la usa, debajo, según `value`: es lo que hacían los
 *     tres usos, y un `p-tabpanel` proyectado desde fuera no encuentra su `p-tabs` (su inyección sigue a la plantilla
 *     donde se escribe, no a donde se proyecta).
 *
 * Fuera de él, y por qué: las pestañas del Monitor (`monitor-tabs`) se arrastran para ordenarse y se renombran con
 * doble clic; eso necesita sus directivas sobre cada `p-tab`, así que usan el nativo directamente (DD-113).
 *
 * Uso:
 * ```html
 * <sc-tabs
 *   ariaLabel="Canal"
 *   [tabs]="[{ value: 'chat', label: 'Chat' }, { value: 'email', label: 'Email' }]"
 *   [(value)]="canal"
 * />
 * ```
 *
 * Figma: `❖ Tabs` del Smart Contact Prime kit.
 */
@Component({
  selector: 'sc-tabs',
  standalone: true,
  imports: [TabsModule, ScIconComponent],
  template: `
    <p-tabs [value]="value()" (valueChange)="value.set($event)">
      <p-tablist [pt]="tablistPt()">
        @for (tab of tabs(); track tab.value) {
          <p-tab [value]="tab.value" [disabled]="!!tab.disabled" [class.sc-tabs__tab--icon]="!!tab.icon">
            @if (tab.icon) {
              <sc-icon class="sc-tabs__icon" [name]="tab.icon" size="inherit" [weight]="600" [opticalSize]="20" aria-hidden="true" />
            }
            {{ tab.label }}
          </p-tab>
        }
      </p-tablist>
    </p-tabs>
  `,
  styleUrl: './sc-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'sc-tabs' },
})
export class ScTabsComponent {
  /** Las pestañas, en orden. */
  readonly tabs = input.required<readonly ScTab[]>();
  /** El nombre de la tira para el lector de pantalla («Canal», «Vistas de la conversación»). */
  readonly ariaLabel = input.required<string>();
  /** La pestaña elegida (su `value`). */
  readonly value = model<string | number | undefined>();

  protected readonly tablistPt = computed(() => ({ content: { 'aria-label': this.ariaLabel() } }));
}
