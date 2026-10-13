import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  model,
  signal,
  viewChild,
} from '@angular/core';

import { ScButtonComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { StoryControlsComponent } from './story-controls.component';
import { ArgType, ScArgs } from './story.types';

/**
 * Hasta qué ancho de ventana el panel va POR ENCIMA de la página y no a su lado. La misma cifra está en
 * `storybook.scss` (`.sb-host--con-panel`): por debajo, la columna de la página no deja sitio a los dos.
 */
export const PANEL_ESTRECHO = '(max-width: 75rem)';

/** Lo que recuerda el navegador de quien mira: si dejó el panel plegado. Solo una comodidad. */
const CLAVE = 'sc-docs.controles-plegados';

const leerPlegado = (): boolean => {
  try {
    return localStorage.getItem(CLAVE) === '1';
  } catch {
    return false;
  }
};

/**
 * El PANEL DE CONTROLES de una ficha: los knobs del Playground a la derecha de la página, y FIJOS al bajar, así se ve
 * qué cambia en el Playground, en «Todas las combinaciones» y en el código mientras se tocan. Antes vivían en una
 * columna dentro del Playground y se quedaban arriba en cuanto se bajaba a la rejilla.
 *
 * Modular: no sabe de stories; recibe los controles, sus valores y los de la ficha, y devuelve los valores nuevos.
 *
 * Responsive, por el ancho de la VENTANA (`PANEL_ESTRECHO`):
 *   - ancho: acoplado a la derecha, `sticky`, con su altura y su propio scroll. Se pliega a una pestaña.
 *   - estrecho: plegado en un botón flotante («Controles» y cuántos van cambiados); al abrirlo va por encima de la página,
 *     a la derecha, y se cierra con su botón o con Escape.
 * Recuerda en este navegador si se dejó plegado (en ancho).
 */
@Component({
  selector: 'app-story-panel',
  imports: [ScButtonComponent, ScIconComponent, StoryControlsComponent],
  styleUrl: './storybook.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sb-panel',
    '[class.sb-panel--abierto]': 'abierto()',
    '[class.sb-panel--encima]': 'estrecho()',
    '(document:keydown.escape)': 'alEscape()',
  },
  template: `
    @if (abierto()) {
      <aside
        id="sb-panel-controles"
        class="sb-panel__caja"
        [class.sb-panel__caja--encima]="estrecho()"
        aria-label="Controles del Playground"
        data-testid="sb-panel"
      >
        <header class="sb-panel__cabecera">
          <p class="sb-panel__titulo sc-text-body-semibold">Controles</p>
          @if (cambiados() > 0) {
            <span class="sb-panel__cuenta sc-text-caption-regular" data-testid="sb-panel-cuenta">
              {{ cambiados() }} {{ cambiados() === 1 ? 'cambiado' : 'cambiados' }}
            </span>
            <sc-button
              size="sm"
              variant="secondary"
              appearance="text"
              label="Restablecer"
              (clicked)="args.set({ ...base() })"
            />
          }
          <button
            #cerrar
            type="button"
            class="sb-seg sb-seg--icono sb-panel__cerrar"
            data-testid="sb-panel-plegar"
            [attr.aria-label]="estrecho() ? 'Cerrar los controles' : 'Plegar los controles'"
            [attr.title]="estrecho() ? 'Cerrar los controles' : 'Plegar los controles'"
            (click)="plegar()"
          >
            <sc-icon [name]="estrecho() ? 'close' : 'right_panel_close'" [size]="16" />
          </button>
        </header>
        <div class="sb-panel__cuerpo">
          <app-story-controls [argTypes]="argTypes()" [args]="args()" [base]="base()" (argsChange)="args.set($event)" />
        </div>
      </aside>
    } @else {
      <button
        #abrir
        type="button"
        class="sb-panel__abrir"
        data-testid="sb-panel-abrir"
        aria-controls="sb-panel-controles"
        [attr.aria-expanded]="false"
        (click)="desplegar()"
      >
        <sc-icon name="tune" [size]="16" />
        <span class="sc-text-caption-semibold">Controles</span>
        @if (cambiados() > 0) {
          <span class="sb-panel__insignia sc-text-caption-semibold">{{ cambiados() }}</span>
        }
      </button>
    }
  `,
})
export class StoryPanelComponent {
  readonly argTypes = input.required<readonly ArgType[]>();
  readonly args = model.required<ScArgs>();
  /** Los de la ficha: «Restablecer» vuelve a ellos, y contra ellos se cuenta lo cambiado. */
  readonly base = input.required<ScArgs>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly botonCerrar = viewChild<ElementRef<HTMLButtonElement>>('cerrar');
  private readonly botonAbrir = viewChild<ElementRef<HTMLButtonElement>>('abrir');
  /** Al cerrarlo, el foco vuelve al botón que lo abre: si no, se queda en `body` y el teclado empieza de cero. */
  private devolverFoco = false;

  private readonly mq = typeof matchMedia === 'function' ? matchMedia(PANEL_ESTRECHO) : null;
  protected readonly estrecho = signal(this.mq?.matches ?? false);
  private readonly plegadoEnAncho = signal(leerPlegado());

  /** En ancho, lo que dejó quien mira (abierto por defecto); en estrecho, cerrado hasta que se pide. */
  protected readonly abierto = linkedSignal(() => (this.estrecho() ? false : !this.plegadoEnAncho()));

  protected readonly cambiados = computed(() => {
    const a = this.args();
    const b = this.base();
    const vacio = (v: unknown): boolean => v === '' || v === null || v === undefined;
    return this.argTypes().filter((t) => !(Object.is(a[t.name], b[t.name]) || (vacio(a[t.name]) && vacio(b[t.name]))))
      .length;
  });

  constructor() {
    const cambio = (e: MediaQueryListEvent): void => this.estrecho.set(e.matches);
    this.mq?.addEventListener('change', cambio);
    this.destroyRef.onDestroy(() => this.mq?.removeEventListener('change', cambio));

    // Por encima de la página, el foco entra en el panel al abrirlo: quien abre con teclado sigue donde mira.
    effect(() => {
      if (this.abierto() && this.estrecho()) queueMicrotask(() => this.botonCerrar()?.nativeElement.focus());
    });
    effect(() => {
      const boton = this.botonAbrir();
      if (boton && this.devolverFoco) {
        this.devolverFoco = false;
        boton.nativeElement.focus();
      }
    });
  }

  protected desplegar(): void {
    this.abierto.set(true);
    if (!this.estrecho()) this.recordar(false);
  }

  protected plegar(): void {
    this.devolverFoco = true;
    this.abierto.set(false);
    if (!this.estrecho()) this.recordar(true);
  }

  protected alEscape(): void {
    if (!this.estrecho() || !this.abierto()) return;
    this.devolverFoco = true;
    this.abierto.set(false);
  }

  private recordar(plegado: boolean): void {
    this.plegadoEnAncho.set(plegado);
    try {
      localStorage.setItem(CLAVE, plegado ? '1' : '0');
    } catch {
      // sin almacenamiento (ventana privada): se olvida al recargar, nada más
    }
  }
}
