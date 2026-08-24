import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { COMPONENT_CATALOG, groupCatalog } from './component-catalog';

/**
 * Portada de la sección Componentes.
 *
 * NO repite la lista completa: eso ya lo hace la sidebar, y tenerlo dos veces era la
 * tercera copia de la misma navegación en la misma pantalla. Aquí va lo que la sidebar
 * no dice — cuántos hay, en qué familias y de dónde salen — y un salto por familia.
 */
@Component({
  selector: 'app-components-index',
  imports: [RouterLink],
  template: `
    <h1>Componentes</h1>
    <p class="lead">
      {{ total }} wrappers <code>sc-*</code> de
      <code>&#64;smartcontact-hub/components</code>, en {{ groups.length }} familias. Cada
      página renderiza sus variantes y estados sobre el lienzo aislado, en claro y oscuro.
      <strong>La lista completa está en la barra lateral</strong>; abajo, un salto por familia.
    </p>

    <ul class="families">
      @for (group of groups; track group.category) {
        <li>
          <a [routerLink]="['/components', group.items[0].path]">
            <span class="families__name">{{ group.category }}</span>
            <span class="families__count">{{ group.items.length }}</span>
          </a>
        </li>
      }
    </ul>
  `,
  styles: `
    h1 {
      font-size: var(--sc-font-size-h1);
      line-height: var(--sc-line-height-h1);
      font-weight: var(--sc-font-weight-h1);
    }

    .lead {
      max-width: 60ch;
      color: var(--sc-text-secondary);
    }

    .families {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
      gap: var(--sc-spacing-0-5);
      margin-top: var(--sc-spacing-1-75);
      padding: 0;
      list-style: none;
    }

    .families a {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--sc-spacing-0-5);
      padding: var(--sc-spacing-0-75);
      border: 1px solid var(--sc-border-default);
      border-radius: var(--sc-radius-300);
      background: var(--sc-bg-surface);
      color: var(--sc-text-primary);
      text-decoration: none;
      transition: background-color 120ms ease-out;
    }

    .families a:hover {
      background: var(--sc-bg-subtle);
    }

    .families a:focus-visible {
      outline: 2px solid var(--sc-color-sky-500);
      outline-offset: 1px;
    }

    .families__name {
      font-weight: var(--sc-font-weight-semibold);
    }

    .families__count {
      color: var(--sc-text-subtle);
      font-size: var(--sc-font-size-100);
      font-variant-numeric: tabular-nums;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentsIndexComponent {
  /** Familias no vacías, en el orden del catálogo (mismo origen que la sidebar). */
  protected readonly groups = groupCatalog();
  protected readonly total = COMPONENT_CATALOG.length;
}
