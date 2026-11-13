import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { ScSelectButtonComponent, ScTagComponent } from '@smartcontact-hub/components';

export type PrototipoId = 'periodos' | 'horarios' | 'ivr';

/**
 * La cabecera de los tres prototipos: su título y su frase tal cual, la etiqueta de «Prototipo» y, a la derecha, el
 * selector para saltar de un prototipo a otro (como el del Lab de la tabla).
 */
@Component({
  selector: 'app-jefe-cabecera',
  standalone: true,
  imports: [ScSelectButtonComponent, ScTagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="jefe-cabecera">
      <div class="jefe-cabecera__texto">
        <div class="jefe-cabecera__titulo">
          <h1 class="page__heading sc-text-title-semibold">{{ titulo() }}</h1>
          <sc-tag [value]="etiqueta()" severity="secondary" />
        </div>
        <p class="sc-text-body-regular jefe-cabecera__frase">{{ frase() }}</p>
      </div>
      <sc-selectbutton
        [options]="opciones"
        optionValue="value"
        [allowEmpty]="false"
        [value]="actual()"
        (valueChange)="ir($event)"
        ariaLabel="Prototipo"
      />
    </div>
  `,
  styles: `
    .jefe-cabecera {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--sc-spacing-1);
      flex-wrap: wrap;
      margin-block-end: var(--sc-spacing-1);
    }
    .jefe-cabecera__titulo {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-0-75);
      flex-wrap: wrap;
    }
    .jefe-cabecera__frase {
      color: var(--sc-text-secondary);
      margin-block-start: var(--sc-spacing-0-25);
    }
  `,
})
export class JefeCabeceraComponent {
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
