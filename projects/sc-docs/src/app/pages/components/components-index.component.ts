import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SC_DEMO_COMPONENT_PAGES } from './component-pages';

/** Índice de componentes portados — una entrada por página de componente. */
@Component({
  selector: 'app-components-index',
  imports: [RouterLink],
  template: `
    <h1>Componentes</h1>
    <p>Wrappers portados al repo unificado. Cada página renderiza variantes y estados.</p>
    <ul class="index">
      @for (page of pages; track page.path) {
        <li><a [routerLink]="'/components/' + page.path">{{ page.label }}</a></li>
      }
    </ul>
  `,
  styles: `
    h1 {
      font-size: var(--sc-font-size-h1);
      line-height: var(--sc-line-height-h1);
      font-weight: var(--sc-font-weight-h1);
    }
    .index {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
      gap: var(--sc-spacing-0-5);
      padding: 0;
      list-style: none;
    }
    a {
      color: var(--sc-text-link);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentsIndexComponent {
  readonly pages = SC_DEMO_COMPONENT_PAGES;
}
