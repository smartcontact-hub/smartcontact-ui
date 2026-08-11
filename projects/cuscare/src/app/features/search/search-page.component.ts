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
          <input class="search__ph" type="text" placeholder="Search" aria-label="Buscar cliente" />
          <button class="search__btn" type="button" aria-label="Buscar">
            <img src="icons/general/search.svg" width="15" height="15" alt="" aria-hidden="true" />
          </button>
        </span>
      </div>

      <!-- Ilustración REAL de la app (media/ilustracion-customer, 903×401). -->
      <div class="search__art">
        <img src="images/ilustracion-customer.png" width="903" height="401" alt="" aria-hidden="true" />
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
    .search__art img {
      max-width: 100%;
      height: auto;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPageComponent {}
