import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type PestanaFicha = 'resumen' | 'pautas' | 'accesibilidad';

export const PESTANAS_FICHA: readonly { readonly id: PestanaFicha; readonly texto: string }[] = [
  { id: 'resumen', texto: 'Resumen' },
  { id: 'pautas', texto: 'Pautas' },
  { id: 'accesibilidad', texto: 'Accesibilidad' },
];

/**
 * Las pestañas de una ficha, como las de Primer bajo el título (Overview, Guidelines, Accessibility). Son enlaces y no un
 * `tablist`: cada una es una dirección (`?pestana=pautas`), se comparte y el «atrás» del navegador vuelve a la anterior.
 * «Resumen» es la ficha de siempre y no lleva parámetro, así que los enlaces de antes siguen llevando a lo mismo.
 */
@Component({
  selector: 'app-ficha-pestanas',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="pestanas" aria-label="Partes de la ficha">
      @for (p of pestanas; track p.id) {
        <a
          class="pestana sc-text-body-regular"
          [routerLink]="[]"
          [queryParams]="{ pestana: p.id === 'resumen' ? null : p.id, historia: null, args: null }"
          queryParamsHandling="merge"
          [class.is-activa]="activa() === p.id"
          [attr.aria-current]="activa() === p.id ? 'page' : null"
          >{{ p.texto }}</a
        >
      }
    </nav>
  `,
  styles: `
    .pestanas {
      display: flex;
      gap: var(--sc-spacing-0-25);
      border-bottom: 1px solid var(--sc-border-default);
    }

    /* El subrayado de la activa, como el de Primer: una barra de acento pegada a la línea de abajo. */
    .pestana {
      position: relative;
      padding: var(--sc-spacing-0-5) var(--sc-spacing-0-75);
      border-radius: var(--sc-radius-md) var(--sc-radius-md) 0 0;
      color: var(--sc-text-secondary);
      text-decoration: none;
      transition:
        color var(--sc-transition-fast) ease-out,
        background-color var(--sc-transition-fast) ease-out;

      &::after {
        content: '';
        position: absolute;
        right: var(--sc-spacing-0-5);
        bottom: -1px;
        left: var(--sc-spacing-0-5);
        height: 2px;
        border-radius: var(--sc-radius-full);
        background: var(--sc-border-accent);
        transform: scaleX(0);
        transition: transform var(--sc-transition-base) var(--demo-ease-salida);
      }

      &:hover {
        background: var(--sc-bg-secondary-hover);
        color: var(--sc-text-primary);
      }

      &:focus-visible {
        outline: 2px solid var(--sc-border-focus);
        outline-offset: -2px;
      }

      &.is-activa {
        color: var(--sc-text-primary);
        font-weight: var(--sc-font-weight-semibold);

        &::after {
          transform: scaleX(1);
        }
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .pestana,
      .pestana::after {
        transition: none;
      }
    }
  `,
})
export class FichaPestanasComponent {
  readonly activa = input.required<PestanaFicha>();
  protected readonly pestanas = PESTANAS_FICHA;
}
