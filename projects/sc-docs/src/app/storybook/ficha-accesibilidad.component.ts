import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ScSkeletonComponent } from '@smartcontact-hub/components';

import { ComponenteContrato } from './component-api.service';
import { FichaDatosService } from './ficha-datos.service';
import { TextoFichaComponent } from './texto-ficha.component';

/** «Screen Reader» → «Lector de pantalla»; «Popup Keyboard Support» → «Teclado (Popup)». Lo demás, tal cual. */
function tituloEs(titulo: string): string {
  if (/^screen reader$/i.test(titulo)) return 'Lector de pantalla';
  const teclado = /^(.*?)\s*keyboard support$/i.exec(titulo);
  if (teclado) return teclado[1] ? `Teclado (${teclado[1]})` : 'Teclado';
  return titulo;
}

/**
 * La pestaña «Accesibilidad» de una ficha, como la de Primer. Arriba, lo nuestro: las propiedades ARIA que el componente
 * expone (de su contrato) y que axe revisa cada ejemplo. Debajo, lo que hereda de PrimeNG: lector de pantalla y teclado,
 * tal como lo documenta PrimeNG (`scripts/primeng-a11y.mjs`), en inglés y atribuido. Un componente propio, sin PrimeNG
 * debajo, lo dice: no se inventa una tabla de teclas que nadie ha escrito.
 *
 * Los `h2` llevan `sb-host__h2` para que «En esta página» los recoja como los de la pestaña «Resumen».
 */
@Component({
  selector: 'app-ficha-accesibilidad',
  imports: [ScSkeletonComponent, TextoFichaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let c = componente();
    <section class="seccion">
      <h2 class="sb-host__h2 titulo sc-text-h2-semibold">En este DS</h2>
      <p class="nota sc-text-body-regular">
        Cada ejemplo de la pestaña Resumen pasa axe (WCAG 2.2 A y AA) al verse: el botón «Accesibilidad» de su barra dice
        cuántos fallos tiene y cuáles.
      </p>
      @if (aria().length) {
        <dl class="props">
          @for (m of aria(); track m.nombre) {
            <dt><code>{{ m.nombre }}</code></dt>
            <dd><app-texto-ficha class="sc-text-body-regular" [texto]="m.descripcion" /></dd>
          }
        </dl>
      } @else {
        <p class="nota sc-text-body-regular">No expone propiedades ARIA propias: su nombre accesible sale de su texto.</p>
      }
    </section>

    @if (datos.error()) {
      <p class="nota sc-text-body-regular">No se pudo cargar lo que documenta PrimeNG.</p>
    } @else if (secciones(); as ss) {
      @for (s of ss; track s.titulo) {
        <section class="seccion">
          <h2 class="sb-host__h2 titulo sc-text-h2-semibold">{{ tituloEs(s.titulo) }}</h2>
          @for (p of s.parrafos; track $index) {
            <p class="texto sc-text-body-regular" lang="en">{{ p }}</p>
          }
          @if (s.teclas.length) {
            <table class="teclas sc-text-body-regular" lang="en">
              <thead>
                <tr>
                  <th scope="col">Tecla</th>
                  <th scope="col">Qué hace</th>
                </tr>
              </thead>
              <tbody>
                @for (t of s.teclas; track $index) {
                  <tr>
                    <td><kbd>{{ t.tecla }}</kbd></td>
                    <td>{{ t.funcion }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </section>
      }
      @if (ss.length) {
        <p class="fuente sc-text-caption-regular">
          Texto de PrimeNG (licencia MIT), en inglés, de
          <a [href]="'https://primeng.dev/' + c.primengPrincipal" target="_blank" rel="noopener">primeng.dev/{{ c.primengPrincipal }}</a>.
        </p>
      } @else if (c.primengPrincipal) {
        <p class="nota sc-text-body-regular">PrimeNG no documenta la accesibilidad de <code>{{ c.primengPrincipal }}</code>.</p>
      } @else {
        <p class="nota sc-text-body-regular">
          Componente propio, sin PrimeNG debajo: no hereda una tabla de teclas, y la suya aún no está escrita.
        </p>
      }
    } @else {
      <sc-skeleton height="200px" />
    }
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

    .nota,
    .texto {
      margin: 0 0 var(--sc-spacing-1);
      max-width: 68ch;
      color: var(--sc-text-secondary);
    }

    .texto {
      color: var(--sc-text-primary);
    }

    code,
    kbd {
      font-family: var(--sc-font-family-mono);
    }

    .props {
      display: grid;
      grid-template-columns: max-content minmax(0, 1fr);
      gap: var(--sc-spacing-0-5) var(--sc-spacing-1);
      margin: 0;

      dd {
        margin: 0;
        color: var(--sc-text-secondary);
      }
    }

    .teclas {
      width: 100%;
      max-width: 52rem;
      border-collapse: collapse;

      th,
      td {
        padding: var(--sc-spacing-0-5);
        border-bottom: 1px solid var(--sc-border-default);
        text-align: left;
        vertical-align: top;
      }

      th {
        color: var(--sc-text-subtle);
        font-weight: var(--sc-font-weight-semibold);
      }

      td:first-child {
        width: 12rem;
        white-space: nowrap;
      }

      kbd {
        padding: 0 var(--sc-spacing-0-375);
        border: 1px solid var(--sc-border-default);
        border-radius: var(--sc-radius-sm);
        background: var(--sc-bg-subtle);
      }
    }

    .fuente {
      margin: var(--sc-spacing-1) 0 0;
      color: var(--sc-text-subtle);

      a {
        color: var(--sc-text-link);
      }
    }
  `,
})
export class FichaAccesibilidadComponent {
  readonly componente = input.required<ComponenteContrato>();
  protected readonly datos = inject(FichaDatosService);
  protected readonly tituloEs = tituloEs;

  protected readonly secciones = computed(() => this.datos.a11yDe(this.componente().primengPrincipal));

  /** Las propiedades ARIA que expone, con su descripción (la nuestra o, si no, la de PrimeNG). */
  protected readonly aria = computed(() =>
    this.componente()
      .contrato.filter((m) => /aria/i.test(m.nombre))
      .map((m) => ({ nombre: m.nombre, descripcion: m.descripcion ?? m.nativo?.descripcion ?? '' })),
  );
}
