import { ChangeDetectionStrategy, Component } from '@angular/core';

import { USERS } from '../../data/seed';

/**
 * Ajustes · Users (`#/private/cuscare/settings/users`).
 * Tabla Angular Material (no PrimeNG) — ver `settings-table.scss` para el porqué
 * y la tabla comparativa de métrica. La real trae 86 filas sin paginador.
 */
@Component({
  selector: 'app-users-page',
  standalone: true,
  template: `
    <section class="cc-card settings-page">
      <header class="settings-page__head"><h1 class="cc-page-title">Users</h1></header>

      <div class="settings-page__toolbar">
        <button class="iconbtn" type="button" aria-label="Filtrar">⚗</button>
        <button class="iconbtn" type="button" aria-label="Buscar">⌕</button>
        <button class="iconbtn settings-page__spacer" type="button" aria-label="Exportar">⇩</button>
      </div>

      <table class="mattable">
        <thead>
          <tr>
            <th class="col-check"><input class="cc-check" type="checkbox" aria-label="Seleccionar todo" /></th>
            <th>User Name</th>
            <th>Default Role</th>
            <th>Acd Groups</th>
          </tr>
        </thead>
        <tbody>
          @for (u of users; track u.name) {
            <tr>
              <td class="col-check">
                <input class="cc-check" type="checkbox" [attr.aria-label]="'Seleccionar ' + u.name" />
              </td>
              <td>{{ u.name }}</td>
              <td>{{ u.role }}</td>
              <td>{{ u.acdGroups }}</td>
            </tr>
          }
        </tbody>
      </table>
    </section>
  `,
  styleUrl: './settings-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPageComponent {
  protected readonly users = USERS;
}
