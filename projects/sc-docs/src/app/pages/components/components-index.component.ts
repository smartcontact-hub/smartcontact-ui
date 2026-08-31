import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { COMPONENT_CATALOG, groupCatalog } from './component-catalog';

/**
 * Portada de la sección Componentes.
 *
 * Cada componente es una tarjeta con su nombre y UNA línea de para qué sirve (el `blurb`
 * del catálogo), agrupadas por familia. La descripción es lo que la sidebar no da: deja
 * escanear el catálogo entero sin abrir 49 páginas, y desde cada card se profundiza. La
 * lista plana de navegación sigue viviendo en la sidebar; aquí el valor es el propósito.
 */
@Component({
  selector: 'app-components-index',
  imports: [RouterLink],
  template: `
    <p class="eyebrow">Sistema de diseño</p>
    <h1>Componentes</h1>
    <p class="lead">
      {{ total }} wrappers <code>sc-*</code> de
      <code>&#64;smartcontact-hub/components</code>, en {{ groups.length }} familias. Para qué
      sirve cada uno de un vistazo; entra en cualquiera para ver sus variantes, estados y
      código, en claro y oscuro.
    </p>

    @for (group of groups; track group.category) {
      <section class="fam">
        <h2 class="fam__title">
          {{ group.category }}
          <span class="fam__count">{{ group.items.length }}</span>
        </h2>
        <ul class="cards">
          @for (e of group.items; track e.path) {
            <li>
              <a class="card" [routerLink]="['/components', e.path]">
                <span class="card__name">{{ e.label }}</span>
                @if (e.blurb) {
                  <span class="card__blurb">{{ e.blurb }}</span>
                }
              </a>
            </li>
          }
        </ul>
      </section>
    }
  `,
  styles: `
    .eyebrow {
      margin: 0 0 var(--sc-spacing-0-5);
      font-size: var(--sc-font-size-50);
      font-weight: var(--sc-font-weight-semibold);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--sc-color-sky-600);
    }

    h1 {
      margin: 0 0 var(--sc-spacing-0-75);
      font-size: var(--sc-font-size-display-1);
      line-height: var(--sc-line-height-display-1);
      font-weight: var(--sc-font-weight-bold);
      letter-spacing: -0.01em;
      color: var(--sc-text-primary);
    }

    .lead {
      max-width: 68ch;
      margin: 0;
      font-size: var(--sc-font-size-300);
      line-height: var(--sc-line-height-300);
      color: var(--sc-text-secondary);
    }

    /* Familia: encabezado + rejilla de componentes. Ritmo por separación, no por caja. */
    .fam {
      margin-top: var(--sc-spacing-2-25);
    }

    .fam__title {
      display: flex;
      align-items: baseline;
      gap: var(--sc-spacing-0-5);
      margin: 0 0 var(--sc-spacing-0-875);
      font-size: var(--sc-font-size-100);
      font-weight: var(--sc-font-weight-bold);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--sc-text-secondary);
    }

    .fam__count {
      font-size: var(--sc-font-size-50);
      font-weight: var(--sc-font-weight-semibold);
      color: var(--sc-text-subtle);
      font-variant-numeric: tabular-nums;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(15.5rem, 1fr));
      gap: var(--sc-spacing-0-75);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .card {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-0-375);
      height: 100%;
      box-sizing: border-box;
      padding: var(--sc-spacing-0-875) var(--sc-spacing-1);
      border: 1px solid var(--sc-border-default);
      border-radius: 12px;
      background: var(--sc-bg-surface);
      text-decoration: none;
      box-shadow: var(--sc-shadow-card);
      transition:
        box-shadow 140ms ease-out,
        transform 140ms ease-out,
        border-color 140ms ease-out;
    }

    .card:hover {
      border-color: var(--sc-border-strong);
      box-shadow: var(--sc-shadow-dropdown);
      transform: translateY(-2px);
    }

    .card:focus-visible {
      outline: 2px solid var(--sc-color-sky-500);
      outline-offset: 2px;
    }

    .card__name {
      font-size: var(--sc-font-size-200);
      font-weight: var(--sc-font-weight-semibold);
      color: var(--sc-text-primary);
    }

    .card__blurb {
      font-size: var(--sc-font-size-100);
      line-height: 1.45;
      color: var(--sc-text-secondary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentsIndexComponent {
  /** Familias no vacías, en el orden del catálogo (mismo origen que la sidebar). */
  protected readonly groups = groupCatalog();
  protected readonly total = COMPONENT_CATALOG.length;
}
