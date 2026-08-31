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
import { ThemeToggleComponent } from '../shared/theme-toggle.component';

type CanvasTheme = 'light' | 'dark' | 'split';

/**
 * Lienzo aislado de una story: pinta el `<ng-template>` con su contexto de `args` y deja
 * alternar el tema LOCALMENTE (claro/oscuro/comparar) aplicando `.sc-dark` a un wrapper —
 * no a `documentElement` —, así el toggle global de la demo no se ve afectado. `.sc-dark`
 * vuelca tanto los tokens `--sc-*` (capa 07-dark) como PrimeNG (`darkModeSelector`).
 */
@Component({
  selector: 'app-story-canvas',
  imports: [NgTemplateOutlet, ThemeToggleComponent],
  styleUrl: './storybook.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-canvas">
      <div class="sb-canvas__bar">
        <div class="sb-canvas__themes" role="group" aria-label="Tema del lienzo">
          <app-theme-toggle [dark]="theme() === 'dark'" (toggled)="toggleTheme()" />
          <button
            type="button"
            class="sb-seg sb-seg--compare"
            [class.is-active]="theme() === 'split'"
            [attr.aria-pressed]="theme() === 'split'"
            (click)="toggleSplit()"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="4.5" width="18" height="15" rx="2" />
              <line x1="12" y1="4.5" x2="12" y2="19.5" />
            </svg>
            Comparar
          </button>
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

  /** Sol/luna: alterna claro <-> oscuro (saliendo de comparar si estaba). */
  protected toggleTheme(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  /** Comparar: enciende/apaga la vista lado a lado (claro + oscuro). */
  protected toggleSplit(): void {
    this.theme.set(this.theme() === 'split' ? 'light' : 'split');
  }

  protected readonly ctx = computed<StoryContext>(() => {
    const a = this.args();
    return { $implicit: a, args: a };
  });
}
