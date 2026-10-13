import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Pantalla de una entrada del sidebar que todavía no se ha construido con el DS. */
@Component({
  selector: 'app-pending-page',
  template: `
    <h1 class="sc-text-h2-semibold">{{ title() }}</h1>
    <p class="sc-text-body-regular">This screen is not built yet.</p>
  `,
  styles: `
    :host {
      display: block;
      color: var(--sc-text-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingPageComponent {
  // `withComponentInputBinding` entrega aquí el `data.title` de la ruta.
  readonly title = input<string>('');
}
