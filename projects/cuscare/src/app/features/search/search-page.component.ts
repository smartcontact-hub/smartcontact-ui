import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * "Search" del nav → ruta `#/private/cuscare/**customer**` (comprobado
 * navegando; el rótulo y la ruta no coinciden).
 *
 * Es una pantalla de BÚSQUEDA VACÍA: una fila centrada con dos desplegables
 * ("Select country", "Msisdn") + campo de texto con botón de lupa, y debajo una
 * ilustración grande que ocupa el resto. Sin resultados hasta buscar.
 */
@Component({
  selector: 'app-search-page',
  standalone: true,
  template: `
    <div class="search">
      <div class="search__row">
        <span class="field">Select country <span class="field__caret" aria-hidden="true">▾</span></span>
        <span class="field">Msisdn <span class="field__caret" aria-hidden="true">▾</span></span>
        <span class="search__input">
          <span class="search__ph">Search</span>
          <button class="search__btn" type="button" aria-label="Buscar">⌕</button>
        </span>
      </div>

      <!-- Ilustración: el original sirve un SVG decorativo grande (pantalla,
           lupa, nube, gráficas). Aquí va una versión reducida con la misma
           silueta y paleta; NO es el asset original. -->
      <div class="search__art" aria-hidden="true">
        <svg viewBox="0 0 640 300" width="640" height="300">
          <rect x="150" y="60" width="250" height="150" rx="8" fill="#eef1f6" />
          <rect x="170" y="80" width="120" height="8" rx="4" fill="#dfe4ec" />
          <rect x="170" y="98" width="90" height="8" rx="4" fill="#dfe4ec" />
          <rect x="170" y="116" width="140" height="8" rx="4" fill="#dfe4ec" />
          <rect x="300" y="140" width="80" height="55" rx="6" fill="#ffffff" stroke="#dfe4ec" />
          <circle cx="120" cy="205" r="34" fill="none" stroke="#1c283d" stroke-width="4" />
          <path d="M144 229l26 26" stroke="#1c283d" stroke-width="5" stroke-linecap="round" />
          <ellipse cx="470" cy="120" rx="52" ry="30" fill="#eef1f6" />
          <rect x="430" y="60" width="34" height="26" rx="5" fill="#dfe4ec" />
          <rect x="486" y="60" width="34" height="26" rx="5" fill="#dfe4ec" />
          <rect x="500" y="170" width="34" height="26" rx="5" fill="#dfe4ec" />
          <path d="M410 175l60 0M410 200l40 0" stroke="#dfe4ec" stroke-width="3" stroke-dasharray="5 5" />
        </svg>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .search {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 120px;
    }
    .search__row {
      display: flex;
      align-items: center;
      gap: 34px;
    }
    .field {
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      width: 242px;
      height: 34px;
      padding: 0 14px;
      border: 1px solid #d7dbe3;
      border-radius: 6px;
      background: #ffffff;
      font-size: 11.68px;
      color: var(--cc-text-body);
    }
    .field__caret {
      font-size: 9px;
      opacity: 0.7;
    }
    .search__input {
      display: inline-flex;
      align-items: center;
    }
    .search__ph {
      display: inline-flex;
      align-items: center;
      width: 232px;
      height: 34px;
      padding: 0 14px;
      border: 1px solid #d7dbe3;
      border-right: 0;
      border-radius: 6px 0 0 6px;
      background: #ffffff;
      font-size: 11.68px;
      color: #9aa1ac;
    }
    .search__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 34px;
      border: 0;
      border-radius: 0 6px 6px 0;
      background: #1c283d;
      color: #ffffff;
      font-size: 14px;
      cursor: pointer;
    }
    .search__art {
      margin-top: 60px;
      line-height: 0;
      max-width: 100%;
    }
    .search__art svg {
      max-width: 100%;
      height: auto;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPageComponent {}
