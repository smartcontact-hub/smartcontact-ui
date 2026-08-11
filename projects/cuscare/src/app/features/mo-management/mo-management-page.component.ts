import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * "Manage MO in error" (`#/private/cuscare/mo-management`).
 *
 * Tabla con **buscador por columna** (cada cabecera lleva su propio input +
 * lupa, en vez de la fila de filtros de Tickets) y estado VACÍO: la real muestra
 * "No data to show" y un paginador que dice "Page 1 of 0 total results 0".
 * Se replica vacía a propósito — es su estado real, no un hueco por hacer.
 */
@Component({
  selector: 'app-mo-management-page',
  standalone: true,
  template: `
    <section class="cc-card mo">
      <div class="mo__toolbar">
        <button class="iconbtn" type="button" aria-label="Buscar"><img src="icons/general/buscar.svg" width="15" height="15" alt="" aria-hidden="true" /></button>
        <button class="iconbtn mo__spacer" type="button" aria-label="Exportar"><img src="icons/general/descarga.svg" width="15" height="15" alt="" aria-hidden="true" /></button>
      </div>

      <table class="mo__table">
        <thead>
          <tr>
            @for (c of cols; track c) {
              <th>
                <span class="mo__label">{{ c }}</span>
                <span class="mo__search">
                  <span class="mo__field"></span>
                  <button class="mo__mag" type="button" [attr.aria-label]="'Buscar en ' + c">
                    <img src="icons/general/buscar.svg" width="12" height="12" alt="" aria-hidden="true" />
                  </button>
                </span>
              </th>
            }
          </tr>
        </thead>
      </table>

      <p class="mo__empty">No data to show</p>

      <footer class="mo__foot">
        <span>Rows per page <span class="mo__sel">10</span></span>
        <span>Page <span class="mo__sel">1</span></span>
        <button class="mo__pg" type="button" aria-label="Anterior">‹</button>
        <span>Page 1 of 0 total results 0</span>
        <button class="mo__pg" type="button" aria-label="Siguiente">›</button>
      </footer>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    .mo {
      display: flex;
      flex-direction: column;
      min-height: calc(100vh - 120px);
    }
    .mo__toolbar {
      display: flex;
      align-items: center;
      padding-bottom: 14px;
    }
    .mo__spacer {
      margin-left: auto;
    }
    .iconbtn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 1px solid #d7dbe3;
      background: #ffffff;
      color: var(--cc-text);
      cursor: pointer;
    }
    .mo__table {
      width: 100%;
      border-collapse: collapse;
    }
    .mo__table th {
      padding: 0 8px 10px;
      border-bottom: 1px solid var(--cc-line);
      text-align: left;
      vertical-align: top;
      font-weight: 400;
    }
    .mo__label {
      display: block;
      margin-bottom: 6px;
      font-family: var(--cc-font-head);
      font-size: 11.68px;
      color: var(--cc-text);
    }
    .mo__search {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .mo__field {
      display: inline-block;
      width: 68px;
      height: 22px;
      border: 1px solid #d7dbe3;
      border-radius: 3px;
      background: #ffffff;
    }
    .mo__mag {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border: 0;
      background: transparent;
      color: var(--cc-text);
      font-size: 13px;
      cursor: pointer;
    }
    .mo__empty {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      font-size: 11.68px;
      color: var(--cc-text-body);
    }
    .mo__foot {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      padding-top: 14px;
      font-size: 11.68px;
      color: var(--cc-text-body);
    }
    .mo__sel {
      color: var(--cc-text);
    }
    .mo__pg {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border: 1px solid #d7dbe3;
      border-radius: 50%;
      background: #ffffff;
      color: var(--cc-text-body);
      cursor: pointer;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoManagementPageComponent {
  /** Columnas medidas en la real, en orden. */
  protected readonly cols = [
    'Source',
    'Short Code',
    'Carrier',
    'MO Content',
    'Country',
    'Local Creation Date',
    'Ticket',
  ];
}
