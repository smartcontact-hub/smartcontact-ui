import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { ComponenteContrato, REPO_BLOB } from './component-api.service';
import { EstadoComponenteComponent } from './estado-componente.component';

/**
 * Dónde está cada pieza de un componente, como las tarjetas de Primer bajo el título de cada ficha: una por
 * implementación. La de Angular lleva su estado (DD-190) y sus enlaces (código, base de PrimeNG, qué significa cada
 * estado); la de Figma, su maestro. Todo del contrato generado: el enlace a Figma es el de su plantilla de Code Connect,
 * así que no hay nodo escrito a mano que se quede atrás.
 */
@Component({
  selector: 'app-ficha-piezas',
  imports: [EstadoComponenteComponent, RouterLink, ScIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let c = componente();
    <div class="pieza">
      <p class="pieza__titulo sc-text-body-semibold">Angular <sc-icon name="code" [size]="20" /></p>
      <!-- El motivo solo cuando dice algo que hacer: «Listo» ya lo cuentan la etiqueta y la tarjeta de Figma. -->
      <app-estado-componente [estado]="c" [explicado]="c.estado !== 'ready'" />
      <p class="pieza__enlaces sc-text-body-regular">
        @if (c.fuente) {
          <a [href]="repo + c.fuente" target="_blank" rel="noopener">Código<span class="oculto"> (en otra pestaña)</span></a>
          <span aria-hidden="true">|</span>
        }
        @if (moduloPrimeng(); as m) {
          <a [href]="'https://primeng.dev/' + m" target="_blank" rel="noopener"
            >PrimeNG<span class="oculto"> (primeng.dev, en otra pestaña)</span></a
          >
          <span aria-hidden="true">|</span>
        }
        <a routerLink="/components/estado">Estados</a>
      </p>
    </div>
    <div class="pieza">
      <p class="pieza__titulo sc-text-body-semibold">Figma <sc-icon name="design_services" [size]="20" /></p>
      @if (c.figma) {
        <p class="pieza__enlaces sc-text-body-regular">
          <a [href]="c.figma" target="_blank" rel="noopener">Ver en Figma<span class="oculto"> (en otra pestaña)</span></a>
        </p>
      } @else {
        <p class="pieza__nada sc-text-body-regular">
          {{ c.faltas.includes('kit') ? 'Sin maestro en el Kit.' : 'Tiene maestro en el Kit, sin enlace todavía.' }}
        </p>
      }
    </div>
  `,
  styles: `
    /* Del ancho de su contenido y en fila; en una ventana estrecha bajan una bajo otra. */
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sc-spacing-1);
    }

    .pieza {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-0-5);
      flex: 0 1 20rem;
      min-width: 14rem;
      padding: var(--sc-spacing-1);
      border: 1px solid var(--sc-border-default);
      border-radius: var(--sc-radius-lg);
      background: var(--sc-bg-surface);
    }

    .pieza__titulo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 0;
      color: var(--sc-text-primary);
    }

    .pieza__titulo sc-icon {
      color: var(--sc-text-secondary);
    }

    /* Los enlaces van al pie de la tarjeta, separados por una barra, como en Primer. */
    .pieza__enlaces {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sc-spacing-0-5);
      margin: auto 0 0;
      color: var(--sc-text-subtle);
    }

    .pieza__enlaces a {
      color: var(--sc-text-link);
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .pieza__nada {
      margin: auto 0 0;
      color: var(--sc-text-secondary);
    }

    /* Solo para el lector de pantalla: el aviso de que un enlace abre otra pestaña. */
    .oculto {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `,
})
export class FichaPiezasComponent {
  readonly componente = input.required<ComponenteContrato>();
  protected readonly repo = REPO_BLOB;

  /** El módulo de PrimeNG que envuelve de verdad (`primengPrincipal`, de `audit:components`), o `null`. */
  protected moduloPrimeng(): string | null {
    return this.componente().primengPrincipal;
  }
}
