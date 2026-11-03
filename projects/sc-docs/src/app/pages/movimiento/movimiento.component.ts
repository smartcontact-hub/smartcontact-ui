import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { ScButtonComponent } from '@smartcontact-hub/components';
import { CabeceraComponent } from '../../shared/cabecera.component';

/** Una fila de la página: el token, su valor resuelto y con qué duración y curva corre su ejemplo. */
interface FilaMovimiento {
  readonly token: string;
  /** `fundamentos.motion.uses.<clave>`. */
  readonly clave: string;
  readonly duracion: string;
  readonly curva: string;
}

/**
 * Fundamentos → Movimiento: las tres duraciones (`--sc-transition-*`) y las dos curvas (`--sc-easing-*`) del DS, cada
 * una con un ejemplo que se mueve con ella, y las tres reglas que valen para todo movimiento.
 *
 * Los valores se leen del navegador (`getComputedStyle`), no se copian: si el token cambia, la página cambia con él.
 * Los ejemplos mueven `transform` y nada más, y con «reducir movimiento» saltan al final sin animarse: la página
 * cumple lo que enseña.
 */
@Component({
  selector: 'app-movimiento',
  standalone: true,
  imports: [CabeceraComponent, RouterLink, ScButtonComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-cabecera
      arte="movimiento"
      [titulo]="'fundamentos.motion.title' | translate"
      [entradilla]="'fundamentos.motion.lead' | translate"
      [nota]="'fundamentos.motion.note' | translate"
    />

    <sc-button
      class="reproducir"
      [label]="(alFinal() ? 'fundamentos.motion.back' : 'fundamentos.motion.play') | translate"
      [icon]="alFinal() ? 'undo' : 'play_arrow'"
      variant="secondary"
      appearance="outlined"
      size="sm"
      (clicked)="alFinal.set(!alFinal())"
    />

    @for (grupo of grupos; track grupo.titulo) {
      <h2>{{ grupo.titulo | translate }}</h2>
      <ul class="filas">
        @for (f of grupo.filas; track f.token) {
          <li class="fila">
            <div class="fila__dato">
              <code class="sc-text-body-semibold">{{ f.token }}</code>
              <span class="fila__valor sc-text-caption-regular">{{ valor(f.token) }}</span>
              <span class="fila__uso sc-text-body-regular">{{ 'fundamentos.motion.uses.' + f.clave | translate }}</span>
            </div>
            <div class="pista" aria-hidden="true">
              <span
                class="pista__carro"
                [class.is-final]="alFinal()"
                [style.transition-duration]="'var(' + f.duracion + ')'"
                [style.transition-timing-function]="'var(' + f.curva + ')'"
                ><span class="pista__bola"></span
              ></span>
            </div>
          </li>
        }
      </ul>
    }

    <h2>{{ 'fundamentos.motion.rulesTitle' | translate }}</h2>
    <ul class="reglas sc-text-body-regular">
      @for (r of reglas; track r) {
        <li [innerHTML]="'fundamentos.motion.rules.' + r | translate"></li>
      }
    </ul>
    <p class="texto sc-text-body-regular">
      <a routerLink="/fundamentos/patrones/sin-saltos">{{ 'fundamentos.motion.more' | translate }}</a>
    </p>
  `,
  styles: `
    :host {
      display: block;
      max-width: 720px;
      padding-bottom: var(--sc-spacing-5);
    }

    h2 {
      margin: var(--sc-spacing-2) 0 var(--sc-spacing-0-75);
      font-size: var(--sc-font-size-h3);
      line-height: var(--sc-line-height-h3);
      font-weight: var(--sc-font-weight-h3);
      color: var(--sc-text-primary);
    }

    code {
      font-family: var(--sc-font-family-mono);
    }

    .texto {
      margin: var(--sc-spacing-1) 0 0;

      a {
        color: var(--sc-text-link);
      }
    }

    .filas {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    /* Una fila por token: el dato a la izquierda y su ejemplo a la derecha; en estrecho, uno debajo de otro. */
    .fila {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: var(--sc-spacing-0-75) var(--sc-spacing-1-5);
      align-items: center;
      padding: var(--sc-spacing-1) 0;
      border-bottom: 1px solid var(--sc-border-default);

      &__dato {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: var(--sc-spacing-0-25) var(--sc-spacing-0-75);
      }

      &__valor {
        color: var(--sc-text-subtle);
        font-variant-numeric: tabular-nums;
      }

      &__uso {
        flex-basis: 100%;
        color: var(--sc-text-secondary);
      }
    }

    @media (max-width: 34rem) {
      .fila {
        grid-template-columns: minmax(0, 1fr);
      }
    }

    /* La pista: el carro ocupa todo menos el ancho de la bola, y moverlo su propio ancho deja la bola en el otro
       extremo. Así se anima solo \`transform\`, sin medir nada. */
    .pista {
      padding: var(--sc-spacing-0-25) var(--sc-spacing-1) var(--sc-spacing-0-25) 0;
      border-radius: var(--sc-radius-full);
      background: var(--sc-bg-subtle);

      &__carro {
        display: block;
        transition-property: transform;

        &.is-final {
          transform: translateX(100%);
        }
      }

      &__bola {
        display: block;
        width: var(--sc-spacing-1);
        height: var(--sc-spacing-1);
        border-radius: var(--sc-radius-full);
        background: var(--sc-bg-primary);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .pista__carro {
        transition: none;
      }
    }

    .reproducir {
      display: inline-block;
    }

    .reglas {
      margin: 0;
      padding-left: var(--sc-spacing-1-25);
      color: var(--sc-text-primary);

      li + li {
        margin-top: var(--sc-spacing-0-5);
      }
    }
  `,
})
export class MovimientoComponent {
  /** `true` con las bolas al otro lado. El botón las lleva y las trae. */
  protected readonly alFinal = signal(false);

  protected readonly grupos: readonly { titulo: string; filas: readonly FilaMovimiento[] }[] = [
    {
      titulo: 'fundamentos.motion.durationsTitle',
      filas: [
        { token: '--sc-transition-fast', clave: 'fast', duracion: '--sc-transition-fast', curva: '--sc-easing-default' },
        { token: '--sc-transition-base', clave: 'base', duracion: '--sc-transition-base', curva: '--sc-easing-default' },
        { token: '--sc-transition-slow', clave: 'slow', duracion: '--sc-transition-slow', curva: '--sc-easing-default' },
      ],
    },
    {
      // Las curvas se enseñan a la duración lenta: a 120 ms no se distinguen.
      titulo: 'fundamentos.motion.curvesTitle',
      filas: [
        { token: '--sc-easing-default', clave: 'default', duracion: '--sc-transition-slow', curva: '--sc-easing-default' },
        { token: '--sc-easing-emphasized', clave: 'emphasized', duracion: '--sc-transition-slow', curva: '--sc-easing-emphasized' },
      ],
    },
  ];

  protected readonly reglas = ['only', 'reduced', 'nobounce'] as const;

  /**
   * El valor que resuelve el navegador, leído y no copiado. Llega como lo deja el CSS minificado (`.12s`,
   * `cubic-bezier(.4, 0, .2, 1)`): se enseña en milisegundos y con el cero delante, que es como se lee.
   */
  protected valor(token: string): string {
    const crudo = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    const segundos = /^(\d*\.?\d+)s$/.exec(crudo);
    if (segundos) return `${Math.round(Number(segundos[1]) * 1000)} ms`;
    const ms = /^(\d+)ms$/.exec(crudo);
    if (ms) return `${ms[1]} ms`;
    return crudo.replace(/(^|[(\s,])\.(\d)/g, (_, antes: string, cifra: string) => `${antes}0.${cifra}`);
  }
}
