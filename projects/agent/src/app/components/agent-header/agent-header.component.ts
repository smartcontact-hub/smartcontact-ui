import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AgIconComponent } from '../ui/app-icon.component';

/** Barra superior real: marca SmartContact·Agent + botones ayuda / logout. */
@Component({
  selector: 'app-agent-header',
  standalone: true,
  imports: [AgIconComponent],
  template: `
    <header class="hdr">
      <div class="hdr__brand">
        <img class="hdr__logo" src="icons/logo.svg" alt="SmartContact Agent" />
      </div>
      <div class="hdr__actions">
        <button class="hdr__btn" type="button" aria-label="Help">
          <app-icon name="help" [size]="9.86" />
        </button>
        <button
          class="hdr__btn hdr__btn--power"
          type="button"
          aria-label="Log out"
        >
          <app-icon name="power" [size]="9.86" />
        </button>
      </div>
    </header>
  `,
  styles: `
    .hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      /*
       * Medido en el original: su fila de cabecera (.main) mide 29.12 de alto con 16.85
       * por encima, y de ahí a los KPIs hay 15.18. La réplica la tenía al doble de alta,
       * y por eso todo el bloque bajaba.
       */
      height: 2vw;
      padding: 1.157005vw 2.541209vw 0;
      box-sizing: content-box;
    }
    .hdr__brand {
      display: flex;
      align-items: center;
    }
    /* Logo oficial: 239 x 42 en el fichero, servido a escala (ratio 5.69:1). */
    .hdr__logo {
      display: block;
      filter: var(--ag-logo-filter);
      width: 11.353vw;
      height: 2vw;
    }
    .hdr__actions {
      display: inline-flex;
      gap: 0.618132vw;
    }
    /*
     * Medido en el original (.help y .logout): cada botón es CUADRADO de 18.96, radio 5.3,
     * con borde de 0.55px y el glifo a 9.86. Antes estaban a 21.84 x 29.12 (que era el
     * ancho del CONTENEDOR, no del botón) y por eso salían rectangulares.
     */
    .hdr__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.302vw;
      height: 1.302vw;
      border: 0.038462vw solid var(--ag-btn-line);
      border-radius: 0.363736vw;
      background: transparent;
      color: var(--ag-btn-ic);
      cursor: pointer;
    }
    /*
     * El power es el rojo de LOGOUT (--modeButtonsLogout = #f75454), NO el del avatar
     * (--ag-red = #e74c3c). Son dos rojos distintos en el original y estaban conflados.
     */
    .hdr__btn--power {
      color: #fff;
      background: var(--ag-logout);
      border-color: var(--ag-logout);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentHeaderComponent {}
