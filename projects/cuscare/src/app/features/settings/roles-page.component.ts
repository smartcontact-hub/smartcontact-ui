import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TrPipe } from '../../core/i18n/i18n';

import { ROLES } from '../../data/seed';

/**
 * Ajustes · Roles (`#/private/cuscare/settings/roles`).
 * Anchos medidos en la real: Role Name 242 · Description 545 · Last Update 242 ·
 * Permissions 242 (la de descripción se lleva el sobrante).
 */
@Component({
  selector: 'app-roles-page',
  standalone: true,
  imports: [TrPipe],
  template: `
    <section class="cc-card settings-page">
      <header class="settings-page__head"><h1 class="cc-page-title">{{ 'Roles' | tr }}</h1></header>

      <div class="settings-page__toolbar">
        <button class="iconbtn" type="button" [attr.aria-label]="'Filter' | tr"><img src="icons/general/filter.svg" width="15" height="15" alt="" aria-hidden="true" /></button>
        <button class="iconbtn" type="button" [attr.aria-label]="'action::Search' | tr"><img src="icons/general/buscar.svg" width="15" height="15" alt="" aria-hidden="true" /></button>
        <button class="iconbtn settings-page__spacer" type="button" [attr.aria-label]="'Export' | tr"><img src="icons/general/descarga.svg" width="15" height="15" alt="" aria-hidden="true" /></button>
      </div>

      <table class="mattable">
        <thead>
          <tr>
            <th class="col-check"><input class="cc-check" type="checkbox" [attr.aria-label]="'Select all' | tr" /></th>
            <th style="width:242px">{{ 'Role Name' | tr }}</th>
            <th style="width:545px">{{ 'Description' | tr }}</th>
            <th style="width:242px">{{ 'Last Update' | tr }}</th>
            <th style="width:242px">{{ 'Permissions' | tr }}</th>
          </tr>
        </thead>
        <tbody>
          @for (r of roles; track r.name) {
            <tr>
              <td class="col-check">
                <input class="cc-check" type="checkbox" [attr.aria-label]="('Select' | tr) + ' ' + r.name" />
              </td>
              <td>{{ r.name }}</td>
              <td>{{ r.description }}</td>
              <td>{{ r.lastUpdate }}</td>
              <td>{{ r.permissions }}</td>
            </tr>
          }
        </tbody>
      </table>
    </section>
  `,
  styleUrl: './settings-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesPageComponent {
  protected readonly roles = ROLES;
}
