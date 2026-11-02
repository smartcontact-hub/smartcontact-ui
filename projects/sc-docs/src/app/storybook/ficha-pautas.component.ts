import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ScSkeletonComponent } from '@smartcontact-hub/components';

import { ComponenteContrato, REPO_BLOB } from './component-api.service';
import { FichaDatosService } from './ficha-datos.service';
import { FichaRelacionadosComponent } from './ficha-relacionados.component';
import { TextoFichaComponent } from './texto-ficha.component';

/**
 * La pestaña «Pautas» de una ficha, como la «Guidelines» de Primer, con lo que el repo ya sabe del componente: con qué
 * se relaciona (lo que nombra su «cuándo», lo que usa, dónde aparece) y las decisiones (DD) que lo nombran, de la más
 * nueva a la más vieja, cada una enlazada a su sitio en `DECISIONS.md`. Nada escrito a mano aquí: todo sale del
 * contrato y de `DECISIONS.md`, así que una DD nueva aparece sola en el siguiente build.
 *
 * Los `h2` llevan `sb-host__h2` para que «En esta página» los recoja como los de la pestaña «Resumen».
 */
@Component({
  selector: 'app-ficha-pautas',
  imports: [FichaRelacionadosComponent, ScSkeletonComponent, TextoFichaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let c = componente();
    @if (hayRelaciones()) {
      <section class="seccion">
        <h2 class="sb-host__h2 titulo sc-text-h2-semibold">Relacionados</h2>
        <app-ficha-relacionados [componente]="c" />
      </section>
    }
    <section class="seccion">
      <h2 class="sb-host__h2 titulo sc-text-h2-semibold">Decisiones</h2>
      @if (datos.error()) {
        <p class="nota sc-text-body-regular">No se pudieron cargar las decisiones. Están en <a [href]="repo + 'docs/DECISIONS.md'" target="_blank" rel="noopener">DECISIONS.md</a>.</p>
      } @else if (decisiones(); as dd) {
        @if (dd.length) {
          <p class="nota sc-text-body-regular">
            {{ dd.length === 1 ? 'La decisión' : 'Las ' + dd.length + ' decisiones' }} que nombran
            <code>{{ c.selector }}</code>, de la más nueva a la más vieja.
          </p>
          <ul class="lista">
            @for (d of dd; track d.id) {
              <li class="dd">
                <a class="dd__id sc-text-body-semibold" [href]="enlace(d.linea)" target="_blank" rel="noopener"
                  >{{ d.id }}<span class="oculto"> (en otra pestaña)</span></a
                >
                <app-texto-ficha class="dd__titulo sc-text-body-regular" [texto]="d.titulo" />
                <span class="dd__fecha sc-text-caption-regular">{{ fecha(d.fecha) }}</span>
              </li>
            }
          </ul>
        } @else {
          <p class="nota sc-text-body-regular">Ninguna decisión nombra todavía <code>{{ c.selector }}</code>.</p>
        }
      } @else {
        <sc-skeleton height="160px" />
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .titulo {
      margin: var(--sc-spacing-1-5) 0 var(--sc-spacing-1);
      padding-bottom: var(--sc-spacing-0-5);
      border-bottom: 1px solid var(--sc-border-default);
      color: var(--sc-text-primary);
    }

    .nota {
      margin: 0 0 var(--sc-spacing-1);
      max-width: 68ch;
      color: var(--sc-text-secondary);
    }

    code {
      font-family: var(--sc-font-family-mono);
    }

    .lista {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    /* Una fila por decisión: el número, el título y la fecha, como una línea de historial. */
    .dd {
      display: grid;
      grid-template-columns: 5rem minmax(0, 1fr) auto;
      gap: var(--sc-spacing-1);
      align-items: baseline;
      padding: var(--sc-spacing-0-5) 0;
      border-bottom: 1px solid var(--sc-border-default);
    }

    .dd__id {
      color: var(--sc-text-link);
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .dd__titulo {
      color: var(--sc-text-primary);
    }

    .dd__fecha {
      color: var(--sc-text-subtle);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .oculto {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `,
})
export class FichaPautasComponent {
  readonly componente = input.required<ComponenteContrato>();
  protected readonly datos = inject(FichaDatosService);
  protected readonly repo = REPO_BLOB;

  protected readonly decisiones = computed(() => this.datos.decisionesDe(this.componente().selector));

  protected readonly hayRelaciones = computed(() => {
    const r = this.componente().relaciones;
    return r.alternativas.length + r.usa.length + r.usadoEn.length > 0;
  });

  /** La DD en `DECISIONS.md`, por su línea: el fichero pesa casi 1 MB y su vista de texto sí llega a la línea. */
  protected enlace(linea: number): string {
    return `${REPO_BLOB}docs/DECISIONS.md?plain=1#L${linea}`;
  }

  /** «2026-10-29» → «29/10/2026». */
  protected fecha(iso: string): string {
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
  }
}
