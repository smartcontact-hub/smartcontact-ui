import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { ScSelectButtonComponent, ScTagComponent } from '@smartcontact-hub/components';

export type PrototipoId = 'periodos' | 'horarios' | 'ivr';

/**
 * La cabecera de la propuesta de referencia: una sola versión con tres pantallas. Arriba, el nombre de la propuesta;
 * después el título y la frase de cada pantalla tal cual, su etiqueta y, a la derecha, el selector para saltar de una
 * pantalla a otra (como el del Lab de la tabla).
 */
@Component({
  selector: 'app-referencia-cabecera',
  standalone: true,
  imports: [ScSelectButtonComponent, ScTagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="referencia-cabecera">
      <div class="referencia-cabecera__texto">
        <p class="sc-text-caption-semibold referencia-cabecera__propuesta">Propuesta de referencia</p>
        <div class="referencia-cabecera__titulo">
          <h1 class="page__heading sc-text-title-semibold">{{ titulo() }}</h1>
          <sc-tag [value]="etiqueta()" severity="secondary" />
        </div>
        <p class="sc-text-body-regular referencia-cabecera__frase">{{ frase() }}</p>
      </div>
      <sc-selectbutton
        [options]="opciones"
        optionValue="value"
        [allowEmpty]="false"
        [value]="actual()"
        (valueChange)="ir($event)"
        ariaLabel="Pantalla de la propuesta"
      />
    </div>
  `,
  styles: `
    .referencia-cabecera {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--sc-spacing-1);
      flex-wrap: wrap;
      margin-block-end: var(--sc-spacing-1);
    }
    .referencia-cabecera__titulo {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-0-75);
      flex-wrap: wrap;
    }
    .referencia-cabecera__propuesta {
      color: var(--sc-text-secondary);
      text-transform: uppercase;
      margin-block-end: var(--sc-spacing-0-25);
    }
    .referencia-cabecera__frase {
      color: var(--sc-text-secondary);
      margin-block-start: var(--sc-spacing-0-25);
    }
  `,
})
export class ReferenciaCabeceraComponent {
  private readonly router = inject(Router);

  readonly actual = input.required<PrototipoId>();
  readonly titulo = input.required<string>();
  readonly frase = input.required<string>();
  readonly etiqueta = input.required<string>();

  protected readonly opciones: { value: PrototipoId; label: string }[] = [
    { value: 'periodos', label: 'Periodos v2' },
    { value: 'horarios', label: 'Horarios y calendarios' },
    { value: 'ivr', label: 'Calendarios IVR' },
  ];

  protected ir(id: unknown): void {
    if (id === 'periodos' || id === 'horarios' || id === 'ivr') void this.router.navigateByUrl(`/lab/calendarios/${id}`);
  }
}
