import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Una escena: componentes `sc-*` de verdad dentro de una ventana, sobre un panel gris. Es la ilustración de la portada
 * (`.ini-ilus__ventana`: borde, esquina redondeada y los tres puntos de la barra) llevada a las páginas de dentro, que
 * es como Primer ilustra sus pautas: cada «haz» y «evita» con su dibujo encima. Aquí el dibujo no es una captura sino
 * los componentes mismos, así que no se queda viejo y el modo oscuro sale solo.
 *
 * La escena se mira, no se usa: la ventana va `inert` (ni foco ni clic) y el conjunto se anuncia como una imagen con
 * su `descripcion`, que dice lo que enseña.
 */
@Component({
  selector: 'app-escena',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="escena" role="img" [attr.aria-label]="descripcion()">
      <div class="escena__ventana" inert>
        <span class="escena__puntos"><i></i><i></i><i></i></span>
        <div class="escena__contenido"><ng-content /></div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .escena {
      box-sizing: border-box;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 13rem;
      padding: var(--sc-spacing-1-5);
      border-radius: var(--sc-radius-lg);
      background: var(--sc-bg-subtle);
    }

    /* La ventana de la portada: superficie de la app, borde fino, sombra mínima y la barra con sus tres puntos. */
    .escena__ventana {
      width: 100%;
      max-width: 18rem;
      overflow: hidden;
      border: 1px solid var(--sc-border-default);
      border-radius: var(--sc-radius-lg);
      background: var(--sc-bg-default);
      box-shadow: var(--sc-shadow-xs);
      pointer-events: none;
      user-select: none;
    }

    .escena__puntos {
      display: flex;
      gap: var(--sc-spacing-0-25);
      padding: var(--sc-spacing-0-5) var(--sc-spacing-0-75);
      border-bottom: 1px solid var(--sc-border-default);

      i {
        width: 6px;
        height: 6px;
        border-radius: var(--sc-radius-full);
        background: var(--sc-border-strong);
      }
    }

    .escena__contenido {
      padding: var(--sc-spacing-1);
    }
  `,
})
export class EscenaComponent {
  /** Lo que enseña la escena, para quien no la ve. */
  readonly descripcion = input.required<string>();
}
