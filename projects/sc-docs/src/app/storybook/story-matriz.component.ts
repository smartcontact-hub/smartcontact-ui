import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  input,
  linkedSignal,
} from '@angular/core';

import { ScButtonComponent, ScSelectComponent } from '@smartcontact-hub/components';

import {
  MAX_CELDAS,
  construirRejilla,
  contarCeldas,
  ejesCandidatos,
  ejesPorDefecto,
  type Ejes,
  type ValorEje,
} from './matriz.core.mjs';
import { StoryCanvasComponent, type TemaUrl } from './story-canvas.component';
import { urlDeHistoria } from './story-url';
import { ScArgs, StoryContext, StoryMeta } from './story.types';

/** El valor de un eje como se lee en una cabecera: `true`/`false` como sí/no, para que no parezca código. */
const rotulo = (v: ValorEje): string => (v === true ? 'sí' : v === false ? 'no' : String(v ?? ''));

/** Qué ejes trae la URL de la story (`filas`, `columnas`, `grupos`). `-` es «ninguno». */
export interface EjesUrl {
  readonly filas?: string | null;
  readonly columnas?: string | null;
  readonly grupos?: string | null;
}

/**
 * «Todas las combinaciones»: la rejilla del Playground con cada valor de hasta tres controles a la vez (la lógica, en
 * `matriz.core.mjs`). Los demás controles van como estén en el Playground, así que se estresa desde ahí: un texto
 * larguísimo, `loading` encendido, y se ve en todas las casillas.
 *
 * Plegada hasta que se pide: con cien botones pintados la página tarda, y dos `data-testid` iguales romperían los e2e
 * que buscan uno. Va dentro de un lienzo, así que trae lo mismo que cualquier story: tema, anchos, medir, contornos y
 * la revisión de accesibilidad de TODAS las casillas.
 */
@Component({
  selector: 'app-story-matriz',
  imports: [NgTemplateOutlet, ScButtonComponent, ScSelectComponent, StoryCanvasComponent],
  styleUrl: './storybook.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-matriz" data-testid="sb-matriz">
      @if (!desnudo()) {
        <div class="sb-matriz__ejes">
          @for (e of selectoresEje; track e.clave) {
            <sc-select
              size="sm"
              [label]="e.rotulo"
              [options]="opcionesEje()"
              optionLabel="label"
              optionValue="value"
              [value]="ejes()[e.clave] ?? '-'"
              (valueChange)="fijarEje(e.clave, $any($event))"
            />
          }
          <p class="sb-matriz__cuenta sc-text-body-regular" data-testid="sb-matriz-cuenta">
            {{ total() }} {{ total() === 1 ? 'combinación' : 'combinaciones' }}
          </p>
          @if (!abierta()) {
            <sc-button
              size="sm"
              variant="secondary"
              appearance="outlined"
              [label]="'Ver las ' + total()"
              [disabled]="total() === 0 || demasiadas()"
              (clicked)="abierta.set(true)"
            />
          } @else {
            <sc-button size="sm" variant="secondary" appearance="text" label="Plegar" (clicked)="abierta.set(false)" />
          }
        </div>
        @if (demasiadas()) {
          <p class="sb-matriz__aviso sc-text-body-regular">
            Son más de {{ max }}: fija uno de los ejes en «ninguno» y pon su valor en el Playground.
          </p>
        }
      }

      @if ((abierta() || desnudo()) && !demasiadas()) {
        <app-story-canvas
          [template]="rejillaTpl"
          [args]="base()"
          [desnudo]="desnudo()"
          [tema]="tema()"
          [medirInicial]="medirInicial()"
          [contornosInicial]="contornosInicial()"
          [enlace]="enlace()"
          [enlaceSolo]="enlaceSolo()"
        />
      }
    </div>

    <ng-template #rejillaTpl>
      <div class="sb-matriz__rejilla">
        @for (g of rejilla(); track $index) {
          @if (ejes().grupos; as grupo) {
            <p class="sb-matriz__grupo sc-text-caption-semibold">{{ grupo }}: {{ rotulo(g.valor) }}</p>
          }
          <table class="sb-matriz__tabla">
            @if (ejes().columnas) {
              <thead>
                <tr>
                  <th scope="col" class="sc-text-caption-regular"><span class="sb-matriz__esquina">{{ ejes().filas }} \\ {{ ejes().columnas }}</span></th>
                  @for (c of g.filas[0]?.celdas ?? []; track $index) {
                    <th scope="col" class="sc-text-caption-semibold">{{ rotulo(c.valor) }}</th>
                  }
                </tr>
              </thead>
            }
            <tbody>
              @for (f of g.filas; track $index) {
                <tr>
                  <th scope="row" class="sc-text-caption-semibold">{{ rotulo(f.valor) }}</th>
                  @for (c of f.celdas; track $index) {
                    <td>
                      @if (c.imposible) {
                        <span class="sb-matriz__hueco" title="Esta combinación no existe en el Kit">—</span>
                      } @else {
                        <ng-container [ngTemplateOutlet]="template()" [ngTemplateOutletContext]="ctxDe(c.args)" />
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </ng-template>
  `,
})
export class StoryMatrizComponent {
  readonly meta = input.required<StoryMeta>();
  /** La plantilla del Playground: cada casilla es ella con otros args. */
  readonly template = input.required<TemplateRef<StoryContext>>();
  /** Los args del Playground: la base de todas las casillas. */
  readonly base = input.required<ScArgs>();
  readonly desnudo = input(false);
  readonly ejesUrl = input<EjesUrl>({});
  readonly tema = input<TemaUrl>('claro');
  readonly medirInicial = input(false);
  readonly contornosInicial = input(false);
  /** El segmento de la ruta de la ficha (`button`): sin él no hay enlace. */
  readonly pagina = input<string | null>(null);
  /** Los args de la base, ya codificados para la URL (`codificarArgs`). */
  readonly argsUrl = input('');

  protected readonly max = MAX_CELDAS;
  protected readonly rotulo = rotulo;
  protected readonly selectoresEje = [
    { clave: 'filas', rotulo: 'Filas' },
    { clave: 'columnas', rotulo: 'Columnas' },
    { clave: 'grupos', rotulo: 'Grupos' },
  ] as const;

  protected readonly candidatos = computed(() => ejesCandidatos(this.meta().argTypes));

  /** Los ejes: los de la URL si los trae, si no los que salen solos de los controles. */
  protected readonly ejes = linkedSignal<Ejes>(() => {
    const porDefecto = ejesPorDefecto(this.candidatos());
    const url = this.ejesUrl();
    const nombres = new Set(this.candidatos().map((c) => c.nombre));
    const leer = (v: string | null | undefined, d: string | null): string | null =>
      v === '-' ? null : v && nombres.has(v) ? v : d;
    return {
      filas: leer(url.filas, porDefecto.filas),
      columnas: leer(url.columnas, porDefecto.columnas),
      grupos: leer(url.grupos, porDefecto.grupos),
    };
  });

  protected readonly abierta = linkedSignal(() => this.desnudo());

  protected readonly opcionesEje = computed(() => [
    { label: 'ninguno', value: '-' },
    ...this.candidatos().map((c) => ({ label: `${c.nombre} (${c.valores.length})`, value: c.nombre })),
  ]);

  protected readonly total = computed(() => contarCeldas(this.ejes(), this.candidatos()));
  protected readonly demasiadas = computed(() => this.total() > MAX_CELDAS);

  protected readonly rejilla = computed(() =>
    construirRejilla(this.ejes(), this.candidatos(), this.base(), this.meta().combinacionImposible),
  );

  /** El contexto de cada casilla, guardado por sus args: el mismo objeto en cada pasada, así el outlet no rehace la vista. */
  private readonly contextos = new WeakMap<ScArgs, StoryContext>();
  protected ctxDe(args: ScArgs): StoryContext {
    let ctx = this.contextos.get(args);
    if (!ctx) {
      ctx = { $implicit: args, args };
      this.contextos.set(args, ctx);
    }
    return ctx;
  }

  protected fijarEje(clave: keyof Ejes, valor: string): void {
    this.ejes.set({ ...this.ejes(), [clave]: valor === '-' ? null : valor });
  }

  /** El enlace a la rejilla con sus ejes y la base del Playground: abre igual que se ve ahora. */
  private enlaceCon(solo: boolean): string | null {
    const pagina = this.pagina();
    if (!pagina) return null;
    const e = this.ejes();
    return urlDeHistoria({
      pagina,
      historia: 'combinaciones',
      args: this.argsUrl(),
      solo,
      extra: { filas: e.filas ?? '-', columnas: e.columnas ?? '-', grupos: e.grupos ?? '-' },
    });
  }
  protected readonly enlace = computed(() => this.enlaceCon(false));
  protected readonly enlaceSolo = computed(() => this.enlaceCon(true));
}
