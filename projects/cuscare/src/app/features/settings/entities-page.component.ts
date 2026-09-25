import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TrPipe } from '../../core/i18n/i18n';

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
  imports: [TrPipe],
  template: `
    <section class="cc-card settings-page">
      <header class="settings-page__head"><h1 class="cc-page-title">{{ 'Groups' | tr }}</h1></header>

      <div class="settings-page__toolbar">
        <button class="iconbtn" type="button" [attr.aria-label]="'Filter' | tr"><img src="icons/general/filter.svg" width="15" height="15" alt="" aria-hidden="true" /></button>
        <button class="iconbtn" type="button" [attr.aria-label]="'action::Search' | tr"><img src="icons/general/buscar.svg" width="15" height="15" alt="" aria-hidden="true" /></button>
        <button class="iconbtn settings-page__spacer" type="button" [attr.aria-label]="'Export' | tr"><img src="icons/general/descarga.svg" width="15" height="15" alt="" aria-hidden="true" /></button>
      </div>

      <table class="mattable">
        <thead>
          <tr>
            <th style="width:197px">{{ 'Group Name' | tr }}</th>
            <th style="width:190px">{{ 'Products' | tr }}</th>
            <th style="width:190px">{{ 'Rules' | tr }}</th>
            <th style="width:190px">{{ 'Country' | tr }}</th>
            <th style="width:190px">{{ 'Company' | tr }}</th>
            <th style="width:190px">{{ 'Order By' | tr }}</th>
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
