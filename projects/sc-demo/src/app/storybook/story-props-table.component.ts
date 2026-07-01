import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { PropRow } from './story.types';

/** Tabla de API (referencia estática): input · tipo · default · descripción. */
@Component({
  selector: 'app-story-props-table',
  styleUrl: './storybook.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (props().length) {
      <table class="sb-props">
        <thead>
          <tr>
            <th>Input</th>
            <th>Tipo</th>
            <th>Default</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          @for (p of props(); track p.name) {
            <tr>
              <td><code>{{ p.name }}</code></td>
              <td><code>{{ p.type }}</code></td>
              <td>
                @if (p.default) {
                  <code>{{ p.default }}</code>
                } @else {
                  —
                }
              </td>
              <td>{{ p.description ?? '' }}</td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class StoryPropsTableComponent {
  readonly props = input<readonly PropRow[]>([]);
}
