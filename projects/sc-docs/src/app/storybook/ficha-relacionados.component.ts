import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { fichaDe } from '../pages/components/fichas';
import { ComponentApiService, ComponenteContrato } from './component-api.service';

/**
 * «Relacionados» al pie de una ficha, derivado del contrato (`audit:components`): con qué se confunde (lo que nombra
 * su «cuándo»), de qué está hecho y dónde aparece. Cada uno lleva a su ficha si la tiene; si no, va su selector solo,
 * con el borde discontinuo. Sin ninguna relación no pinta nada, ni el título: la ficha no gana una sección vacía.
 */
@Component({
  selector: 'app-ficha-relacionados',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (g of grupos(); track g.titulo) {
      <div class="grupo">
        <p class="grupo__titulo sc-text-caption-semibold">{{ g.titulo }}</p>
        <ul class="grupo__lista">
          @for (e of g.enlaces; track e.selector) {
            <li>
              @if (e.ruta) {
                <a class="rel sc-text-body-regular" [routerLink]="e.ruta">{{ e.label }} <code>{{ e.selector }}</code></a>
              } @else {
                <span class="rel rel--sin-ficha sc-text-body-regular"><code>{{ e.selector }}</code></span>
              }
            </li>
          }
        </ul>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .grupo + .grupo {
      margin-top: var(--sc-spacing-1);
    }

    .grupo__titulo {
      margin: 0 0 var(--sc-spacing-0-5);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--sc-text-secondary);
    }

    .grupo__lista {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sc-spacing-0-5);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .rel {
      display: inline-flex;
      align-items: baseline;
      gap: var(--sc-spacing-0-375);
      padding: var(--sc-spacing-0-375) var(--sc-spacing-0-75);
      border: 1px solid var(--sc-border-default);
      border-radius: var(--sc-radius-full);
      color: var(--sc-text-primary);
      text-decoration: none;
      transition:
        background-color var(--sc-transition-fast) ease-out,
        border-color var(--sc-transition-fast) ease-out;
    }

    .rel code {
      font-family: var(--sc-font-family-mono);
      color: var(--sc-text-secondary);
    }

    a.rel:hover {
      border-color: var(--sc-border-accent);
      background: var(--sc-bg-secondary-hover);
    }

    a.rel:focus-visible {
      outline: 2px solid var(--sc-border-focus);
      outline-offset: 2px;
    }

    .rel--sin-ficha {
      border-style: dashed;
    }

    @media (prefers-reduced-motion: reduce) {
      .rel {
        transition: none;
      }
    }
  `,
})
export class FichaRelacionadosComponent {
  readonly componente = input.required<ComponenteContrato>();
  private readonly api = inject(ComponentApiService);

  /** Los grupos con algo dentro, cada enlace con su ficha si la tiene. */
  readonly grupos = computed(() => {
    const r = this.componente().relaciones;
    const enlace = (selector: string) => {
      const ficha = fichaDe(selector, this.api.componente(selector)?.name);
      return { selector, label: ficha?.label ?? selector, ruta: ficha ? ['/components', ficha.path] : null };
    };
    return [
      { titulo: 'Se elige frente a', selectores: r.alternativas },
      { titulo: 'Usa', selectores: r.usa },
      { titulo: 'Aparece en', selectores: r.usadoEn },
    ]
      .filter((g) => g.selectores.length)
      .map((g) => ({ titulo: g.titulo, enlaces: g.selectores.map(enlace) }));
  });
}
