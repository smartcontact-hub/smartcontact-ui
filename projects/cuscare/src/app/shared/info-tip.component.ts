import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * El icono ⓘ con su explicación — el tooltip de la app.
 *
 * Rafa lo cazó: «en dashboard no has pillado ninguno». Y no era uno: la app
 * real tiene **23 iconos ⓘ** solo en esa pantalla, y la réplica no tenía
 * ninguno.
 *
 * Los textos NO se transcribieron de pantallazos: la app carga su diccionario
 * en `assets/i18n/cuscare/en.json` (1449 claves), así que salieron de ahí
 * exactos, con sus erratas incluidas (`QEUE` por `QUEUE`).
 *
 * El aspecto tampoco se estimó: son **tooltips de Angular Material con su tema
 * por defecto**, leído de las variables CSS de la propia app —
 * `--mat-tooltip-container-color: #424242`, texto blanco, radio 4px, Roboto
 * 12/400, interlineado 16px y `letter-spacing: .0333em`.
 *
 * Se implementa con CSS puro sobre `:hover`/`:focus-visible` en vez de traer
 * `MatTooltip`: la réplica no usa Angular Material y montarlo entero por esto
 * sería desproporcionado. Lo que se ve es lo mismo.
 */
@Component({
  selector: 'app-info-tip',
  standalone: true,
  template: `
    <span class="tip">
      <button class="tip__icon" type="button" [attr.aria-label]="text()">
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
          <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.2" />
          <circle cx="8" cy="4.6" r="0.9" fill="currentColor" />
          <path d="M8 7v5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
        </svg>
      </button>
      <span class="tip__bubble" role="tooltip">{{ text() }}</span>
    </span>
  `,
  styles: `
    .tip {
      position: relative;
      display: inline-flex;
      align-items: center;
    }

    .tip__icon {
      display: inline-flex;
      padding: 0;
      border: 0;
      background: transparent;
      color: #9aa1ac;
      cursor: pointer;
    }

    /* Material por defecto: #424242, blanco, radio 4, Roboto 12/400,
       interlineado 16 y ese letter-spacing suyo tan característico. */
    .tip__bubble {
      position: absolute;
      bottom: calc(100% + 6px);
      left: 50%;
      z-index: 60;
      width: max-content;
      max-width: 200px;
      transform: translateX(-50%);
      padding: 6px 8px;
      border-radius: 4px;
      background: #424242;
      color: #ffffff;
      font-family: Roboto, 'Helvetica Neue', sans-serif;
      font-size: 12px;
      font-weight: 400;
      line-height: 16px;
      letter-spacing: 0.0333333333em;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 0.12s ease;
    }

    .tip__icon:hover + .tip__bubble,
    .tip__icon:focus-visible + .tip__bubble {
      opacity: 1;
      visibility: visible;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoTipComponent {
  readonly text = input.required<string>();
}
