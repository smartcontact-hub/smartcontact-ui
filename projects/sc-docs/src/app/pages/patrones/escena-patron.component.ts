import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { ScIconComponent } from '@smartcontact-hub/icons';
import {
  ScButtonComponent,
  ScInputTextComponent,
  ScMessageComponent,
  ScSkeletonComponent,
  ScTagComponent,
} from '@smartcontact-hub/components';

import { EscenaComponent } from '../../shared/escena.component';

/** Los patrones que tienen su «haz» y su «evita» dibujados: hoy, todos. */
export const PATRONES_CON_ESCENA: ReadonlySet<string> = new Set([
  'color',
  'loading',
  'copy',
  'icons',
  'density',
  'a11y',
  'motion',
  'type',
  'grouping',
  'fill',
  'blame',
]);

/**
 * El dibujo de un «haz» o un «evita» de un patrón, con componentes `sc-*` de verdad dentro de una `app-escena`. Cada
 * escena calca lo que dice su regla (`fundamentos.patterns.principles.<clave>`) y nada más. Lo que no es obvio:
 *
 * - Agrupación, «evita»: 12.25 en los dos huecos (`--sc-spacing-0-875`), lo más cerca de los 12 que cita la regla.
 * - Lo que falta: el obligatorio vacío del Supervisor. El mismo «El nombre es obligatorio» va en gris y con punto
 *   (`ayudaDeObligatorio`) en el «haz», y en rojo antes de tocar el campo en el «evita».
 * - Iconografía, «evita»: símbolos de texto (✎ ✕ ☰) junto a los iconos, que son otro juego. Emojis no: los veta
 *   `audit:screen-hygiene` en cualquier plantilla.
 * - Tipografía, «evita»: texto sin su clase, uno con su tamaño puesto a mano. La otra mitad de la regla (una
 *   `.sc-text-*` encima de un `<sc-*>`) no se dibuja porque `audit:text-styles` la veta en cualquier plantilla.
 * - Las filas de tabla y de lista son barras grises: lo que enseñan es el sitio que ocupan, no lo que dicen.
 */
@Component({
  selector: 'app-escena-patron',
  imports: [
    EscenaComponent,
    ScButtonComponent,
    ScIconComponent,
    ScInputTextComponent,
    ScMessageComponent,
    ScSkeletonComponent,
    ScTagComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let t = 'fundamentos.patterns.scenes.';
    @let w = 'fundamentos.patterns.scenes.words.';
    @let haz = lado() === 'haz';
    <app-escena [descripcion]="t + clave() + '.' + lado() | translate">
      @switch (clave()) {
        @case ('color') {
          <div class="filas">
            @for (a of agentes; track a.n) {
              <div class="fila">
                <span class="sc-text-body-regular">{{ w + 'agent' | translate: { n: a.n } }}</span>
                @if (haz) {
                  <sc-tag size="sm" [severity]="a.severidad" [value]="w + a.estado | translate" />
                } @else {
                  <sc-tag size="sm" variant="label" [labelColor]="a.adorno" [value]="w + a.estado | translate" />
                }
              </div>
            }
          </div>
        }
        @case ('loading') {
          @if (haz) {
            <div class="filas">
              @for (f of [0, 1, 2]; track f) {
                <div class="fila fila--inicio">
                  <sc-skeleton shape="circle" width="1.75rem" height="1.75rem" />
                  <div class="lineas">
                    <sc-skeleton width="45%" height="0.5rem" />
                    <sc-skeleton width="75%" height="0.5rem" />
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="vacio"><sc-icon name="progress_activity" [spin]="true" [size]="28" /></div>
          }
        }
        @case ('copy') {
          <p class="titulo sc-text-subtitle-semibold">{{ w + 'agents' | translate }}</p>
          @if (!haz) {
            <p class="relleno sc-text-caption-regular">{{ w + 'filler' | translate }}</p>
          }
          <div class="barras">
            @for (b of [70, 55, 62]; track $index) {
              <span class="barra" [style.width.%]="b"></span>
            }
          </div>
        }
        @case ('icons') {
          <div class="acciones">
            @if (haz) {
              @for (i of ['edit', 'delete', 'more_vert']; track i) {
                <sc-button [icon]="i" appearance="text" variant="secondary" size="sm" [ariaLabel]="i" />
              }
            } @else {
              <span class="glifo">✎</span>
              <sc-button icon="delete" appearance="text" variant="secondary" size="sm" [ariaLabel]="'fundamentos.patterns.scenes.words.delete' | translate" />
              <span class="glifo">☰</span>
              <span class="glifo">✕</span>
            }
          </div>
          <div class="barras">
            @for (b of [70, 55]; track $index) {
              <span class="barra" [style.width.%]="b"></span>
            }
          </div>
        }
        @case ('density') {
          @if (!haz) {
            <div class="cifras">
              <div class="cifra"><span class="sc-text-caption-regular">{{ w + 'calls' | translate }}</span><strong class="sc-text-body-semibold">120</strong></div>
              <div class="cifra"><span class="sc-text-caption-regular">{{ w + 'agents' | translate }}</span><strong class="sc-text-body-semibold">14</strong></div>
            </div>
            <div class="tarjeta-vacia"><span class="sc-text-caption-regular">{{ w + 'summary' | translate }}</span></div>
          }
          <div class="filas filas--juntas">
            @for (a of agentes; track a.n) {
              <div class="fila">
                <span class="sc-text-body-regular">{{ w + 'agent' | translate: { n: a.n } }}</span>
                <span class="num sc-text-body-regular">{{ a.llamadas }}</span>
                @if (haz) {
                  <sc-button icon="more_vert" appearance="text" variant="secondary" size="sm" [ariaLabel]="'fundamentos.patterns.scenes.words.more' | translate" />
                }
              </div>
            }
          </div>
        }
        @case ('a11y') {
          <div class="fila">
            <span class="sc-text-body-regular">{{ w + 'agent' | translate: { n: 122 } }}</span>
            @if (haz) {
              <sc-tag size="sm" severity="danger" icon="error" value="Error" />
            } @else {
              <span class="punto"></span>
            }
          </div>
          <div class="campo">
            @if (haz) {
              <sc-inputtext size="sm" [fluid]="true" [label]="'fundamentos.spacing.demoName' | translate" />
            } @else {
              <sc-inputtext size="sm" [fluid]="true" [placeholder]="'fundamentos.spacing.demoName' | translate" />
            }
          </div>
        }
        @case ('motion') {
          <div class="apilado" [class.apilado--encima]="!haz">
            <sc-message class="aviso" severity="success" variant="outlined" size="sm" icon="check_circle" [text]="w + 'saved' | translate" />
            <div class="barras">
              @for (b of [70, 55, 62, 48]; track $index) {
                <span class="barra" [style.width.%]="b"></span>
              }
            </div>
          </div>
        }
        @case ('type') {
          @if (haz) {
            <p class="texto-tipo sc-text-h3-semibold">{{ w + 'record' | translate }}</p>
            <p class="texto-tipo sc-text-body-regular">{{ w + 'since' | translate }}</p>
            <p class="texto-tipo sc-text-caption-regular">{{ w + 'today' | translate }}</p>
          } @else {
            <!-- Sin su clase: el título se queda en la letra de la página y el párrafo lleva un tamaño puesto a mano, más
                 grande que el título. -->
            <p class="texto-tipo">{{ w + 'record' | translate }}</p>
            <p class="texto-tipo a-mano">{{ w + 'since' | translate }}</p>
            <p class="texto-tipo">{{ w + 'today' | translate }}</p>
          }
        }
        @case ('grouping') {
          <div class="form" [class.form--evita]="!haz">
            <sc-inputtext size="sm" [fluid]="true" [label]="'fundamentos.spacing.demoName' | translate" />
            <sc-inputtext class="form__segundo" size="sm" [fluid]="true" [label]="'fundamentos.spacing.demoPhone' | translate" />
            <sc-button class="form__boton" size="sm" [label]="'fundamentos.spacing.demoSave' | translate" />
          </div>
        }
        @case ('fill') {
          <div class="pantalla">
            <div class="tabla" [class.tabla--fija]="!haz">
              @for (f of [0, 1, 2, 3, 4, 5]; track f) {
                <span class="tabla__fila"><span class="barra" [style.width.%]="60 - f * 4"></span></span>
              }
              @if (!haz) {
                <span class="tabla__scroll"></span>
              }
            </div>
            @if (haz) {
              <span class="paginador sc-text-caption-regular">{{ w + 'page' | translate }}</span>
            }
          </div>
        }
        @case ('blame') {
          <div class="form">
            @if (haz) {
              <p class="falta sc-text-caption-regular">{{ t + 'missing' | translate }}</p>
              <sc-inputtext size="sm" [fluid]="true" [required]="true" [label]="'fundamentos.spacing.demoName' | translate"
                [helperText]="(t + 'nameRequired' | translate) + '.'" />
            } @else {
              <sc-inputtext size="sm" [fluid]="true" [required]="true" [label]="'fundamentos.spacing.demoName' | translate"
                [error]="t + 'nameRequired' | translate" />
            }
            <sc-button class="form__boton" size="sm" [disabled]="true" [label]="t + 'create' | translate" />
          </div>
        }
      }
    </app-escena>
  `,
  styles: `
    :host {
      display: block;
    }

    /* Llena la fila que le da la pareja, para que el «haz» y el «evita» midan lo mismo. */
    app-escena {
      height: 100%;
    }

    p {
      margin: 0;
    }

    /* ── Filas de lista: nombre a la izquierda, lo demás a la derecha ── */
    .filas {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-0-75);

      &--juntas {
        gap: var(--sc-spacing-0-25);
      }
    }

    .fila {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--sc-spacing-0-75);
      min-height: var(--sc-spacing-2);
      color: var(--sc-text-primary);

      &--inicio {
        justify-content: flex-start;
      }
    }

    .num {
      margin-left: auto;
      font-variant-numeric: tabular-nums;
    }

    .lineas {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: var(--sc-spacing-0-375);
    }

    /* Contenido que no se lee: barras grises del alto de una línea de texto. */
    .barras {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-0-75);
      margin-top: var(--sc-spacing-1);
    }

    .barra {
      display: block;
      height: var(--sc-spacing-0-5);
      border-radius: var(--sc-radius-full);
      background: var(--sc-border-default);
    }

    .vacio {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 8rem;
      color: var(--sc-text-subtle);
    }

    /* ── Textos ── */
    .titulo {
      color: var(--sc-text-primary);
    }

    .relleno {
      margin-top: var(--sc-spacing-0-25);
      color: var(--sc-text-secondary);
    }

    /* ── Iconografía ── */
    .acciones {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-0-25);
    }

    .glifo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--sc-spacing-2);
      height: var(--sc-spacing-2);
      color: var(--sc-text-secondary);
    }

    /* ── Densidad ── */
    .cifras {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--sc-spacing-0-5);
      margin-bottom: var(--sc-spacing-0-5);
    }

    .cifra {
      display: flex;
      flex-direction: column;
      padding: var(--sc-spacing-0-5);
      border: 1px solid var(--sc-border-default);
      border-radius: var(--sc-radius-md);
      color: var(--sc-text-secondary);

      strong {
        color: var(--sc-text-primary);
      }
    }

    .tarjeta-vacia {
      height: var(--sc-spacing-3);
      margin-bottom: var(--sc-spacing-0-75);
      padding: var(--sc-spacing-0-5);
      border: 1px solid var(--sc-border-default);
      border-radius: var(--sc-radius-md);
      color: var(--sc-text-secondary);
    }

    /* ── Accesibilidad ── */
    .punto {
      width: var(--sc-spacing-0-75);
      height: var(--sc-spacing-0-75);
      border-radius: var(--sc-radius-full);
      background: var(--sc-border-danger);
    }

    .campo {
      margin-top: var(--sc-spacing-1);
    }

    /* ── Sin saltos: el aviso en su hueco, o encima de la lista, tapándola como un toast ── */
    .apilado {
      position: relative;

      .aviso {
        display: block;
        border-radius: var(--sc-radius-md);
        background: var(--sc-bg-default);
      }

      &--encima .aviso {
        position: absolute;
        top: var(--sc-spacing-0-5);
        right: 0;
        left: 0;
        z-index: 1;
        box-shadow: var(--sc-shadow-dropdown);
      }

      &--encima .barras {
        margin-top: 0;
      }
    }

    /* ── Tipografía ── */
    .texto-tipo + .texto-tipo {
      margin-top: var(--sc-spacing-0-25);
    }

    /* El «evita»: un tamaño que no es de ninguna de las 12 clases, y que vuelca la jerarquía. */
    .a-mano {
      font-size: var(--sc-font-size-450);
    }

    /* ── Agrupación y lo que falta ── */
    .form {
      display: flex;
      flex-direction: column;
    }

    .form__segundo {
      margin-top: var(--sc-spacing-1);
    }

    .form__boton {
      align-self: flex-start;
      margin-top: var(--sc-spacing-2);
    }

    .form--evita {
      .form__segundo,
      .form__boton {
        margin-top: var(--sc-spacing-0-875);
      }
    }

    .falta {
      margin-bottom: var(--sc-spacing-1);
      color: var(--sc-text-secondary);
    }

    /* ── Tablas a toda altura: la ventana es la pantalla; la tabla llega al pie o se queda corta ── */
    .pantalla {
      display: flex;
      flex-direction: column;
      height: 11rem;
    }

    .tabla {
      position: relative;
      display: flex;
      flex: 1;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid var(--sc-border-default);
      border-radius: var(--sc-radius-md);

      &--fija {
        flex: 0 0 auto;
        height: 5.5rem;
      }

      &__fila {
        display: flex;
        align-items: center;
        flex: 0 0 auto;
        height: var(--sc-spacing-2);
        padding: 0 var(--sc-spacing-0-5);
        border-bottom: 1px solid var(--sc-border-default);
      }

      &__fila .barra {
        flex: 0 0 auto;
      }

      &__scroll {
        position: absolute;
        top: var(--sc-spacing-0-25);
        right: var(--sc-spacing-0-25);
        width: var(--sc-spacing-0-25);
        height: 40%;
        border-radius: var(--sc-radius-full);
        background: var(--sc-border-strong);
      }
    }

    .paginador {
      margin-top: var(--sc-spacing-0-5);
      color: var(--sc-text-secondary);
      text-align: right;
    }
  `,
})
export class EscenaPatronComponent {
  readonly clave = input.required<string>();
  readonly lado = input.required<'haz' | 'evita'>();

  /** Dos agentes de muestra: su estado (con el color que lo dice, o con uno de adorno) y sus llamadas. */
  protected readonly agentes = [
    { n: 122, estado: 'available', severidad: 'success', adorno: 'purple', llamadas: 48 },
    { n: 87, estado: 'away', severidad: 'warn', adorno: 'teal', llamadas: 31 },
  ] as const;
}
