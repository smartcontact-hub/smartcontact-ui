import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';

import { serializeArgs } from './serialize-args';
import { StoryCanvasComponent } from './story-canvas.component';
import { StoryControlsComponent } from './story-controls.component';
import { StoryPropsTableComponent } from './story-props-table.component';
import { StorySnippetComponent } from './story-snippet.component';
import { ScArgs, StoryDef, StoryMeta } from './story.types';

/**
 * Orquesta la página de UN componente: cabecera + Playground (knobs en vivo + canvas + snippet)
 * + stories de ejemplo (apiladas, cada una con su canvas + código) + tabla de API. El demo
 * declara las stories como `<ng-template>` y pasa `meta` + `stories`.
 *
 * Apilado (no por pestañas) a propósito: una página = un componente con TODO a la vista, y así
 * los `data-testid` de los ejemplos siguen en el DOM (los e2e de métrica del Kit los miden).
 */
@Component({
  selector: 'app-story-host',
  imports: [StoryCanvasComponent, StoryControlsComponent, StorySnippetComponent, StoryPropsTableComponent],
  styleUrl: './storybook.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-host">
      <header class="sb-host__head">
        <h1>
          {{ meta().title ?? meta().tag }}
          <span class="sb-host__tag">&lt;{{ meta().tag }}&gt;</span>
        </h1>
        @if (meta().description) {
          <p class="sb-host__desc">{{ meta().description }}</p>
        }
      </header>

      @for (s of stories(); track s.name) {
        <section class="sb-host__story">
          <p class="sb-host__section-title">{{ s.playground ? '✦ ' + s.name : s.name }}</p>

          @if (s.playground) {
            <div class="sb-host__play">
              <div class="sb-host__play-main">
                <app-story-canvas [template]="s.template" [args]="playArgs()" />
                <app-story-snippet [code]="snippetFor(s)" />
              </div>
              <div>
                <p class="sb-host__section-title">Controles</p>
                <app-story-controls
                  [argTypes]="meta().argTypes"
                  [args]="playArgs()"
                  (argsChange)="playArgs.set($event)"
                />
              </div>
            </div>
          } @else {
            <div class="sb-host__grid">
              <app-story-canvas [template]="s.template" [args]="s.args ?? meta().defaultArgs" />
              <app-story-snippet [code]="snippetFor(s)" />
            </div>
          }
        </section>
      }

      @if (meta().props; as props) {
        @if (props.length) {
          <section class="sb-host__story">
            <p class="sb-host__section-title">API</p>
            <app-story-props-table [props]="props" />
          </section>
        }
      }
    </div>
  `,
})
export class StoryHostComponent {
  readonly meta = input.required<StoryMeta>();
  readonly stories = input.required<readonly StoryDef[]>();

  /** Args editables del Playground; se siembran de `meta.defaultArgs` (writable + reseed). */
  protected readonly playArgs = linkedSignal<ScArgs>(() => ({ ...this.meta().defaultArgs }));

  /** Código de una story: override propio, o serializado de `tag` + sus args (live en Playground). */
  protected snippetFor(s: StoryDef): string {
    if (s.snippet) return s.snippet;
    const args = s.playground ? this.playArgs() : (s.args ?? this.meta().defaultArgs);
    return serializeArgs(this.meta(), args);
  }
}
