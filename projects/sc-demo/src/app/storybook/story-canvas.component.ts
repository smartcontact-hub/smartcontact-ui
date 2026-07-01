import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  input,
  signal,
} from '@angular/core';

import { ScArgs, StoryContext } from './story.types';

type CanvasTheme = 'light' | 'dark' | 'split';

/**
 * Lienzo aislado de una story: pinta el `<ng-template>` con su contexto de `args` y deja
 * alternar el tema LOCALMENTE (claro/oscuro/comparar) aplicando `.sc-dark` a un wrapper —
 * no a `documentElement` —, así el toggle global de la demo no se ve afectado. `.sc-dark`
 * vuelca tanto los tokens `--sc-*` (capa 07-dark) como PrimeNG (`darkModeSelector`).
 */
@Component({
  selector: 'app-story-canvas',
  imports: [NgTemplateOutlet],
  styleUrl: './storybook.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-canvas">
      <div class="sb-canvas__bar">
        <div class="sb-canvas__themes" role="group" aria-label="Tema del lienzo">
          @for (t of themes; track t.id) {
            <button
              type="button"
              class="sb-seg"
              [class.is-active]="theme() === t.id"
              (click)="theme.set(t.id)"
            >
              {{ t.label }}
            </button>
          }
        </div>
      </div>

      <div class="sb-canvas__stage" [class.sb-canvas__stage--split]="theme() === 'split'">
        @if (theme() === 'split') {
          <div class="sb-canvas__pane">
            <ng-container [ngTemplateOutlet]="template()" [ngTemplateOutletContext]="ctx()" />
          </div>
          <div class="sb-canvas__pane sc-dark">
            <ng-container [ngTemplateOutlet]="template()" [ngTemplateOutletContext]="ctx()" />
          </div>
        } @else {
          <div class="sb-canvas__pane" [class.sc-dark]="theme() === 'dark'">
            <ng-container [ngTemplateOutlet]="template()" [ngTemplateOutletContext]="ctx()" />
          </div>
        }
      </div>
    </div>
  `,
})
export class StoryCanvasComponent {
  readonly template = input.required<TemplateRef<StoryContext>>();
  readonly args = input<ScArgs>({});

  protected readonly theme = signal<CanvasTheme>('light');
  protected readonly themes = [
    { id: 'light', label: 'Claro' },
    { id: 'dark', label: 'Oscuro' },
    { id: 'split', label: 'Comparar' },
  ] as const satisfies readonly { id: CanvasTheme; label: string }[];

  protected readonly ctx = computed<StoryContext>(() => {
    const a = this.args();
    return { $implicit: a, args: a };
  });
}
