import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { serializeArgs } from './serialize-args';
import { StoryCanvasComponent, type TemaUrl } from './story-canvas.component';
import { StoryPanelComponent } from './story-panel.component';
import { StoryPropsTableComponent } from './story-props-table.component';
import { StoryAnatomyComponent } from './story-anatomy.component';
import { StorySnippetComponent } from './story-snippet.component';
import { StoryMatrizComponent, type EjesUrl } from './story-matriz.component';
import { ComponentApiService, trozosDeCuando } from './component-api.service';
import { EstadoComponenteComponent } from './estado-componente.component';
import { ejesCandidatos } from './matriz.core.mjs';
import { codificarArgs, decodificarArgs, slugHistoria, urlDeHistoria } from './story-url';
import { ScArgs, StoryControlsContext, StoryDef, StoryMeta } from './story.types';

const TEMAS_URL: readonly TemaUrl[] = ['claro', 'oscuro', 'comparar'];

/**
 * Orquesta la página de UN componente: cabecera (con «Cuándo se usa») + Playground (canvas + snippet) + «Todas las
 * combinaciones» + stories de ejemplo (apiladas, cada una con su canvas + código), con el panel de controles a su
 * derecha (`story-panel.component.ts`), fijo al bajar; debajo, a todo el ancho, la tabla de API. El demo declara las
 * stories como `<ng-template>` y pasa `meta` + `stories`.
 *
 * Apilado (no por pestañas) a propósito: una página = un componente con TODO a la vista, y así los `data-testid` de los
 * ejemplos siguen en el DOM (los e2e de métrica del Kit los miden).
 *
 * Cada story tiene DIRECCIÓN (`story-url.core.mjs`): `?historia=<nombre>` baja hasta ella, `&args=` siembra el
 * Playground y `&solo=1` pinta esa story sola, sin la barra lateral ni el resto de la ficha: es lo que abren «abrir
 * suelta», el iframe de los anchos fijos y las capturas de `docs:capturas`.
 */
@Component({
  selector: 'app-story-host',
  imports: [
    EstadoComponenteComponent,
    NgTemplateOutlet,
    StoryAnatomyComponent,
    StoryCanvasComponent,
    StoryMatrizComponent,
    StoryPanelComponent,
    StorySnippetComponent,
    StoryPropsTableComponent,
  ],
  styleUrl: './storybook.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (solo()) {
      <div class="sb-solo" data-testid="sb-solo">
        @if (historiaUrl() === 'combinaciones' && playground(); as pg) {
          <app-story-matriz
            [meta]="meta()"
            [template]="pg.template"
            [base]="playArgs()"
            [desnudo]="true"
            [ejesUrl]="ejesUrl()"
            [tema]="temaUrl()"
            [medirInicial]="medirUrl()"
            [contornosInicial]="contornosUrl()"
          />
        } @else if (historiaSola(); as s) {
          <app-story-canvas
            [template]="s.template"
            [args]="argsDe(s)"
            [desnudo]="true"
            [tema]="temaUrl()"
            [medirInicial]="medirUrl()"
            [contornosInicial]="contornosUrl()"
            [revisarA11y]="false"
          />
        } @else if (stories().length) {
          <p class="sb-solo__vacio">Esta ficha no tiene ninguna story que se llame «{{ historiaUrl() }}».</p>
        }
      </div>
    } @else {
      <div class="sb-host">
        <!-- El panel de controles acompaña a las stories y no a la referencia: la API va debajo, a todo el ancho, y el
             panel deja de seguir al bajar al llegar a ella. -->
        <div class="sb-host__zona" [class.sb-host__zona--con-panel]="hayControles()">
          <div class="sb-host__contenido">
            <header class="sb-host__head">
              <h1>
                {{ meta().title ?? meta().tag }}
                <span class="sb-host__tag">&lt;{{ meta().tag }}&gt;</span>
              </h1>
              <!-- El estado del componente (DD-190): listo, experimental o retirado, y por qué. -->
              <app-estado-componente class="sb-host__estado" [estado]="estado()" explicado />
              @if (meta().description) {
                <p class="sb-host__desc sc-text-h3-regular">{{ meta().description }}</p>
              }
              <!-- «Cuándo se usa» va ARRIBA: es la pregunta que se hace antes que ninguna otra («¿es este o es otro?»).
                   Al final de la ficha, tras todas las stories, quedaba a 6.000 px en la de Button. -->
              @if (cuando(); as cuando) {
                <!-- Sin data-testid: la línea base de estilos cuenta los de cada ficha (component-styles.spec.ts). -->
                <div class="sb-host__cuando">
                  <p class="sb-host__cuando-titulo sc-text-caption-semibold">Cuándo se usa</p>
                  <p class="sb-host__cuando-texto">
                    @for (t of trozos(cuando); track $index) {
                      @if (t.codigo) {
                        <code>{{ t.texto }}</code>
                      } @else {
                        <span>{{ t.texto }}</span>
                      }
                    }
                  </p>
                </div>
              }
              <!-- Opt-in: una página puede proyectar un aviso bajo la descripción (p. ej. un enlace a
                   otra pantalla relacionada). Sin contenido proyectado, no pinta nada — las otras
                   páginas no cambian. -->
              <ng-content select="[sbHeaderExtra]" />
            </header>

            @for (s of stories(); track s.name) {
              <section
                class="sb-host__story"
                [id]="'historia-' + slug(s)"
                [class.sb-host__story--enlazada]="slug(s) === historiaUrl()"
              >
                <h2 class="sb-host__section-title sb-host__h2 sc-text-h2-semibold">{{ s.name }}</h2>
                @if (s.description) {
                  <p class="sb-host__story-desc sc-text-body-regular">{{ s.description }}</p>
                }

                @if (s.playground) {
                  <!-- Sus controles van en el panel de la derecha (app-story-panel), fijo al bajar. -->
                  <div class="sb-host__play-main">
                    <app-story-canvas
                      [template]="s.template"
                      [args]="playArgs()"
                      [enlace]="enlaceDe(s)"
                      [enlaceSolo]="enlaceDe(s, true)"
                    />
                    <app-story-snippet [code]="snippetFor(s)" />
                    <!-- La anatomía se LEE del DOM ya pintado: no hay texto a mano que pueda mentir. -->
                    <app-story-anatomy [tag]="meta().tag" />
                  </div>
                } @else {
                  <div class="sb-host__grid">
                    <app-story-canvas
                      [template]="s.template"
                      [args]="argsDe(s)"
                      [enlace]="enlaceDe(s)"
                      [enlaceSolo]="enlaceDe(s, true)"
                    />
                    <app-story-snippet [code]="snippetFor(s)" />
                  </div>
                }
              </section>

              @if (s.playground && hayEjes()) {
                <section
                  class="sb-host__story"
                  id="historia-combinaciones"
                  [class.sb-host__story--enlazada]="historiaUrl() === 'combinaciones'"
                >
                  <h2 class="sb-host__section-title sb-host__h2 sc-text-h2-semibold">Todas las combinaciones</h2>
                  <p class="sb-host__story-desc sc-text-body-regular">
                    El Playground con cada valor de hasta tres controles a la vez. Los demás van como estén arriba: pon ahí
                    un texto muy largo o enciende «loading», y se ve en todas las casillas.
                  </p>
                  <app-story-matriz
                    [meta]="meta()"
                    [template]="s.template"
                    [base]="playArgs()"
                    [pagina]="pagina()"
                    [argsUrl]="argsPlayUrl()"
                    [ejesUrl]="ejesUrl()"
                  />
                </section>
              }
            }

          </div>

          @if (hayControles()) {
            <app-story-panel
              [argTypes]="meta().argTypes"
              [base]="meta().defaultArgs"
              [args]="playArgs()"
              (argsChange)="playArgs.set($event)"
              [controlsTemplate]="playground()?.controlsTemplate ?? null"
              [controlsContext]="controlsContext()"
            />
          }
        </div>

        <section class="sb-host__story sb-host__api">
          <h2 class="sb-host__section-title sb-host__h2 sc-text-h2-semibold">API</h2>
          <app-story-props-table [miembros]="contrato()" [error]="apiError()" />
        </section>
      </div>
    }
  `,
})
export class StoryHostComponent {
  readonly meta = input.required<StoryMeta>();
  readonly stories = input.required<readonly StoryDef[]>();

  private readonly api = inject(ComponentApiService);
  private readonly route = inject(ActivatedRoute);

  /** El contrato del componente, DERIVADO del código — ya no se escribe en el demo. */
  protected readonly contrato = computed(() => this.api.contrato(this.meta().tag));
  /** Su línea de «cuándo se usa», la pregunta que se hace ANTES que la de las props. */
  protected readonly cuando = computed(() => this.api.cuando(this.meta().tag));
  protected readonly trozos = trozosDeCuando;
  /** Su estado (DD-190), del mismo contrato generado. */
  protected readonly estado = computed(() => this.api.estado(this.meta().tag));
  protected readonly apiError = this.api.error;

  // ── La dirección de la página: lo que trae la URL ──────────────────────────────────────────────
  private readonly qp = toSignal(this.route.queryParamMap, { initialValue: convertToParamMap({}) });
  /** El segmento de la ruta de esta ficha (`button`): con él se escriben los enlaces. */
  protected readonly pagina = computed(() => this.route.snapshot.routeConfig?.path ?? null);
  protected readonly solo = computed(() => this.qp().get('solo') === '1');
  protected readonly historiaUrl = computed(() => this.qp().get('historia'));
  protected readonly temaUrl = computed<TemaUrl>(() => {
    const t = this.qp().get('tema') as TemaUrl | null;
    return t && TEMAS_URL.includes(t) ? t : 'claro';
  });
  protected readonly medirUrl = computed(() => this.qp().get('medir') === '1');
  protected readonly contornosUrl = computed(() => this.qp().get('contornos') === '1');
  protected readonly ejesUrl = computed<EjesUrl>(() => ({
    filas: this.qp().get('filas'),
    columnas: this.qp().get('columnas'),
    grupos: this.qp().get('grupos'),
  }));
  private readonly argsUrl = computed(() =>
    decodificarArgs(
      this.qp().get('args'),
      this.meta().argTypes.map((a) => a.name),
    ),
  );

  protected readonly playground = computed(() => this.stories().find((s) => s.playground) ?? null);
  protected readonly hayEjes = computed(() => ejesCandidatos(this.meta().argTypes).length > 0);
  /** El panel de la derecha, solo si hay Playground y algo que tocar en él. */
  protected readonly hayControles = computed(() => !!this.playground() && this.meta().argTypes.length > 0);

  /** Args editables del Playground: los de la ficha, con lo que traiga la URL encima (el enlace de alguien). */
  protected readonly playArgs = linkedSignal<ScArgs>(() => {
    const h = this.historiaUrl();
    const sembrar = h === 'combinaciones' || (h !== null && h === this.slugPlayground());
    return { ...this.meta().defaultArgs, ...(sembrar ? this.argsUrl() : {}) };
  });

  /** Lo que el Playground cambia respecto a la ficha, listo para un enlace. */
  protected readonly argsPlayUrl = computed(() =>
    codificarArgs(this.playArgs(), this.meta().defaultArgs, this.meta().argTypes.map((a) => a.name)),
  );

  /** La story que pide la URL en modo suelto. */
  protected readonly historiaSola = computed(() => {
    const h = this.historiaUrl();
    return this.stories().find((s) => slugHistoria(s.name) === h) ?? null;
  });

  private bajado = false;

  constructor() {
    // `?historia=` sin `solo`: la página entera, bajando hasta esa story en cuanto existe.
    effect(() => {
      const h = this.historiaUrl();
      if (this.bajado || this.solo() || !h || !this.stories().length) return;
      this.bajado = true;
      this.bajarA(`historia-${h}`);
    });
  }

  /**
   * Baja hasta la story, y otra vez cuando la página se asienta: lo de encima (el Playground con sus controles, la fuente
   * de iconos) termina de pintarse DESPUÉS, y empuja la story hacia abajo. Medido: con un solo salto, `?historia=variantes`
   * se quedaba en el Playground. Si quien lee ya ha movido la página, no se le vuelve a mover.
   */
  private bajarA(id: string): void {
    let tocado = false;
    const marcar = (): void => {
      tocado = true;
    };
    const eventos = ['wheel', 'keydown', 'pointerdown', 'touchstart'] as const;
    eventos.forEach((e) => window.addEventListener(e, marcar, { once: true, passive: true }));
    const bajar = (): void => {
      if (!tocado) document.getElementById(id)?.scrollIntoView({ block: 'start' });
    };
    requestAnimationFrame(bajar);
    void document.fonts.ready.then(bajar);
    setTimeout(bajar, 600);
    setTimeout(() => {
      bajar();
      eventos.forEach((e) => window.removeEventListener(e, marcar));
    }, 1500);
  }

  protected slug(s: StoryDef): string {
    return slugHistoria(s.name);
  }

  protected argsDe(s: StoryDef): ScArgs {
    return s.playground ? this.playArgs() : (s.args ?? this.meta().defaultArgs);
  }

  /** El enlace a una story: la del Playground lleva los controles que se han tocado. */
  protected enlaceDe(s: StoryDef, solo = false): string | null {
    const pagina = this.pagina();
    if (!pagina) return null;
    return urlDeHistoria({ pagina, historia: this.slug(s), args: s.playground ? this.argsPlayUrl() : '', solo });
  }

  /** Contexto de `[ng-template let-ctx]` para un `controlsTemplate` a medida: args + cómo mutarlos. */
  protected readonly controlsContext = computed<{ $implicit: StoryControlsContext }>(() => ({
    $implicit: {
      args: this.playArgs(),
      setArg: (name: string, value: unknown) => this.playArgs.set({ ...this.playArgs(), [name]: value }),
    },
  }));

  /** Código de una story: override propio, o serializado de `tag` + sus args (live en Playground), con lo que el
   *  contrato dice: lo requerido se escribe y lo que vale su valor por defecto, no. */
  protected snippetFor(s: StoryDef): string {
    if (s.snippet) return s.snippet;
    return serializeArgs(this.meta(), this.argsDe(s), this.contrato());
  }

  private slugPlayground(): string | null {
    const pg = this.playground();
    return pg ? slugHistoria(pg.name) : null;
  }
}
