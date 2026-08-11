import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ROLES } from '../../data/seed';

/**
 * Ajustes · Roles (`#/private/cuscare/settings/roles`).
 * Anchos medidos en la real: Role Name 242 · Description 545 · Last Update 242 ·
 * Permissions 242 (la de descripción se lleva el sobrante).
 */
@Component({
  selector: 'app-roles-page',
  standalone: true,
  template: `
    <section class="cc-card settings-page">
      <header class="settings-page__head"><h1 class="cc-page-title">Roles</h1></header>

      <div class="settings-page__toolbar">
        <button class="iconbtn" type="button" aria-label="Filtrar">⚗</button>
        <button class="iconbtn" type="button" aria-label="Buscar">⌕</button>
        <button class="iconbtn settings-page__spacer" type="button" aria-label="Exportar">⇩</button>
      </div>

      <table class="mattable">
        <thead>
          <tr>
            <th class="col-check"><input type="checkbox" aria-label="Seleccionar todo" /></th>
            <th style="width:242px">Role Name</th>
            <th style="width:545px">Description</th>
            <th style="width:242px">Last Update</th>
            <th style="width:242px">Permissions</th>
          </tr>
        </thead>
        <tbody>
          @for (r of roles; track r.name) {
            <tr>
              <td class="col-check">
                <input type="checkbox" [attr.aria-label]="'Seleccionar ' + r.name" />
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
