import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ENTITIES } from '../../data/seed';

/**
 * Ajustes · Groups (`#/private/cuscare/settings/**entities**`).
 *
 * El item del menú se llama "Groups" pero su ruta es `entities` — comprobado
 * clicándolo en la app real. Es la clase de detalle que se pierde si se deduce
 * la ruta del rótulo.
 *
 * Sin columna de selección (a diferencia de Users y Roles) y 6 columnas: medido.
 */
@Component({
  selector: 'app-entities-page',
  standalone: true,
  template: `
    <section class="cc-card settings-page">
      <header class="settings-page__head"><h1 class="cc-page-title">Groups</h1></header>

      <div class="settings-page__toolbar">
        <button class="iconbtn" type="button" aria-label="Filtrar"><img src="icons/general/filter.svg" width="15" height="15" alt="" aria-hidden="true" /></button>
        <button class="iconbtn" type="button" aria-label="Buscar"><img src="icons/general/buscar.svg" width="15" height="15" alt="" aria-hidden="true" /></button>
        <button class="iconbtn settings-page__spacer" type="button" aria-label="Exportar"><img src="icons/general/descarga.svg" width="15" height="15" alt="" aria-hidden="true" /></button>
      </div>

      <table class="mattable">
        <thead>
          <tr>
            <th style="width:197px">Group Name</th>
            <th style="width:190px">Products</th>
            <th style="width:190px">Rules</th>
            <th style="width:190px">Country</th>
            <th style="width:190px">Company</th>
            <th style="width:190px">Order By</th>
          </tr>
        </thead>
        <tbody>
          @for (e of entities; track e.groupName) {
            <tr>
              <td>{{ e.groupName }}</td>
              <td>{{ e.products }}</td>
              <td>{{ e.rules }}</td>
              <td>{{ e.country }}</td>
              <td>{{ e.company }}</td>
              <td>{{ e.orderBy }}</td>
            </tr>
          }
        </tbody>
      </table>
    </section>
  `,
  styleUrl: './settings-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntitiesPageComponent {
  protected readonly entities = ENTITIES;
}
