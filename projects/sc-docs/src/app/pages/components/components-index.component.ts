import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { COMPONENT_CATALOG, groupCatalog } from './component-catalog';
import { LanguageService } from '../../shared/language.service';
import { ComponentApiService, trozosDeCuando } from '../../storybook/component-api.service';
import { EstadoComponenteComponent } from '../../storybook/estado-componente.component';

/**
 * Portada de la sección Componentes.
 *
 * Cada componente es una tarjeta con su miniatura, su nombre y CUÁNDO se usa (la línea del
 * contrato, la misma que encabeza su ficha), agrupadas por familia. Es lo que la sidebar no
 * da: deja elegir entre parecidos (Tag, Badge, Chip) sin abrir 59 páginas, y desde cada card
 * se profundiza. La lista plana de navegación sigue viviendo en la sidebar.
 */
@Component({
  selector: 'app-components-index',
  imports: [EstadoComponenteComponent, RouterLink, TranslatePipe],
  template: `
    <header class="cabecera">
      <h1>{{ 'componentsIndex.title' | translate }}</h1>
      <p
        class="lead sc-text-h3-regular"
        [innerHTML]="'componentsIndex.lead' | translate: { total: total, families: groups.length }"
      ></p>
    </header>

    @for (group of groups; track group.category) {
      <section class="fam">
        <h2 class="fam__title sc-text-h2-semibold">
          {{ 'categories.' + group.category | translate }}
          <span class="fam__count sc-text-body-regular">{{ group.items.length }}</span>
        </h2>
        <ul class="cards">
          @for (e of group.items; track e.path) {
            <li>
              <a class="card" [routerLink]="['/components', e.path]">
                <!-- La miniatura: su primera story (el Playground) recortada a lo que pinta, en el tema de la página.
                     La toma el robot de capturas (docs-capturas); sin ella, el selector, para que la rejilla no cojee. -->
                <span class="card__vista" aria-hidden="true">
                  @let mini = miniaturas()?.[e.path];
                  @if (mini) {
                    <img
                      class="card__img card__img--claro"
                      [src]="CAPTURAS + mini.claro"
                      [attr.srcset]="CAPTURAS + mini.claro + ' 2x'"
                      [width]="mini.ancho"
                      [height]="mini.alto"
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                    <img
                      class="card__img card__img--oscuro"
                      [src]="CAPTURAS + mini.oscuro"
                      [attr.srcset]="CAPTURAS + mini.oscuro + ' 2x'"
                      [width]="mini.ancho"
                      [height]="mini.alto"
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  } @else if (miniaturas()) {
                    @let selector = api.selectorDeRuta(e.path);
                    @if (selector) {
                      <code class="card__tag">&lt;{{ selector }}&gt;</code>
                    }
                  }
                </span>
                <span class="card__cuerpo">
                  <span class="card__name sc-text-title-semibold">
                    {{ e.label }}
                    <!-- Solo la excepción (DD-190): lo listo no lleva etiqueta, para no llenar de verde el índice. -->
                    @let est = api.estadoDeRuta(e.path);
                    @if (est && est.estado !== 'ready') {
                      <app-estado-componente [estado]="est" />
                    }
                  </span>
                  <!-- Cuándo se usa, no qué es: el índice sirve para elegir. El «cuándo» sale del contrato y está en
                       español; en inglés va el «para qué» traducido, y si falta, el «cuándo». -->
                  @let blurbKey = 'components.blurb.' + e.path;
                  @let blurb = blurbKey | translate;
                  @let cuando = api.cuandoDeRuta(e.path);
                  @if (cuando && (!lang.isEnglish() || blurb === blurbKey)) {
                    <!-- Cada trozo en su elemento: un texto suelto entre bloques arrastra el salto de línea de la plantilla
                         y pintaba «sc-select .» con un espacio antes del punto. -->
                    <span class="card__blurb sc-text-body-regular">
                      @for (t of trozos(cuando); track $index) {
                        @if (t.codigo) {
                          <code>{{ t.texto }}</code>
                        } @else {
                          <span>{{ t.texto }}</span>
                        }
                      }
                    </span>
                  } @else if (blurb !== blurbKey) {
                    <span class="card__blurb sc-text-body-regular">{{ blurb }}</span>
                  }
                </span>
              </a>
            </li>
          }
        </ul>
      </section>
    }
  `,
  styles: `
    /* Cabecera como la de las docs de referencia: título y entradilla a 18, sin foto ni caja. */
    .cabecera {
      max-width: 52rem;
    }

    h1 {
      margin: 0 0 var(--sc-spacing-1);
    }

    .lead {
      margin: 0;
      color: var(--sc-text-secondary);
    }

    /* Familia: encabezado + rejilla de componentes. Ritmo por separación, no por caja. */
    .fam {
      margin-top: var(--sc-spacing-3);
    }

    .fam__title {
      display: flex;
      align-items: baseline;
      gap: var(--sc-spacing-0-5);
      margin: 0 0 var(--sc-spacing-1-25);
      padding-bottom: var(--sc-spacing-0-5);
      border-bottom: 1px solid var(--sc-border-default);
      color: var(--sc-text-primary);
    }

    .fam__count {
      color: var(--sc-text-secondary);
      font-variant-numeric: tabular-nums;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
      gap: var(--sc-spacing-1-5);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .card {
      display: flex;
      flex-direction: column;
      height: 100%;
      box-sizing: border-box;
      overflow: hidden;
      padding: var(--sc-spacing-1-5);
      border: 1px solid var(--sc-border-default);
      border-radius: var(--sc-radius-lg);
      background: var(--sc-bg-surface);
      text-decoration: none;
      transition:
        box-shadow 140ms ease-out,
        border-color 140ms ease-out;
    }

    .card:hover {
      border-color: var(--sc-border-strong);
      box-shadow: var(--sc-shadow-card);
    }

    .card:focus-visible {
      outline: 2px solid var(--sc-color-sky-500);
      outline-offset: 2px;
    }

    /* La miniatura, sobre el fondo sutil: la captura (con el fondo del lienzo) se lee como una hoja encima. Alto fijo,
       así la rejilla no salta al cargar; la imagen nunca crece por encima de su tamaño real (va a 2x, por el srcset). */
    .card__vista {
      display: grid;
      /* Pistas de tamaño fijo: sin ellas el max-height en % de la imagen no tiene contra qué medirse y se salía. */
      grid-template: minmax(0, 1fr) / minmax(0, 1fr);
      place-items: center;
      overflow: hidden;
      height: 9.5rem;
      padding: var(--sc-spacing-1);
      box-sizing: border-box;
      border: 1px solid var(--sc-border-default);
      border-radius: var(--sc-radius-md);
      background: var(--sc-bg-default);
    }

    .card__img {
      grid-area: 1 / 1;
      width: auto;
      height: auto;
      max-width: 100%;
      max-height: 100%;
      border-radius: var(--sc-radius-sm);
      box-shadow: var(--sc-shadow-xs);
    }

    .card__img--oscuro {
      display: none;
    }

    :host-context(.sc-dark) .card__img--claro {
      display: none;
    }

    :host-context(.sc-dark) .card__img--oscuro {
      display: block;
    }

    .card__tag {
      font-family: var(--sc-font-family-mono);
      font-size: var(--sc-font-size-100);
      color: var(--sc-text-subtle);
    }

    .card__cuerpo {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-0-375);
      padding-top: var(--sc-spacing-1-25);
    }

    .card__name {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--sc-spacing-0-5);
      color: var(--sc-text-primary);
    }

    /* Hasta cuatro líneas: el «cuándo» entero vive arriba de su ficha. */
    .card__blurb {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 4;
      line-clamp: 4;
      overflow: hidden;
      color: var(--sc-text-secondary);
    }

    /* Sin partir por el guion, como en la ficha. */
    .card__blurb code {
      font-family: var(--sc-font-family-mono);
      white-space: nowrap;
      color: var(--sc-text-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentsIndexComponent {
  /** Familias no vacías, en el orden del catálogo (mismo origen que la sidebar). */
  protected readonly groups = groupCatalog();
  protected readonly total = COMPONENT_CATALOG.length;
  protected readonly api = inject(ComponentApiService);
  protected readonly lang = inject(LanguageService);
  protected readonly trozos = trozosDeCuando;
  protected readonly CAPTURAS = '/ia/capturas/';

  /** Las miniaturas por ficha, del índice que escribe `docs:capturas`; `null` mientras carga. Sin él, ninguna. */
  protected readonly miniaturas = signal<Readonly<Record<string, Miniatura>> | null>(null);

  constructor() {
    fetch(`${this.CAPTURAS}_indice.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { fichas?: Record<string, { miniatura?: Miniatura }> }) => {
        const porFicha: Record<string, Miniatura> = {};
        for (const [ficha, f] of Object.entries(d.fichas ?? {})) if (f.miniatura) porFicha[ficha] = f.miniatura;
        this.miniaturas.set(porFicha);
      })
      .catch(() => this.miniaturas.set({}));
  }
}

/** La miniatura de una ficha, tal como la apunta `docs:capturas`: rutas y tamaño en px CSS (el PNG va a 2x). */
interface Miniatura {
  readonly claro: string;
  readonly oscuro: string;
  readonly ancho: number;
  readonly alto: number;
}
