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
    .hdr__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      /* Medido en el original: cada botón 21.84 x 29.12, con el glifo a 9.86. */
      width: 1.5vw;
      height: 2vw;
      border: 1px solid var(--ag-btn-line);
      border-radius: 0.412088vw;
      background: transparent;
      color: var(--ag-btn-ic);
      cursor: pointer;
    }
    .hdr__btn--power {
      color: #fff;
      background: var(--ag-red);
      border-color: var(--ag-red);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentHeaderComponent {}
