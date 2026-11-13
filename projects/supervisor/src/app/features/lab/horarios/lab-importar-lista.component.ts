import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import {
  ScButtonComponent,
  ScCheckboxComponent,
  ScCustomModalComponent,
  ScCustomModalFooterDirective,
  ScSelectComponent,
} from '@smartcontact-hub/components';

import { type CalendarioDeFestivos, type Festivo, FestivosStore } from '@features/admin/repositories/state/festivos.store';

import { diasDe, esFija, REGIONES } from './lab-festivos-catalogo';
import { T } from './lab-textos';

/**
 * Crear una lista de festivos desde el calendario oficial de un país o región, sin teclearlos: se elige la región, se
 * quitan los días que no apliquen y se crea la lista en Tiempo. Si ya existe una con ese nombre, no la duplica.
 */
@Component({
  selector: 'sc-lab-importar-lista',
  imports: [ScButtonComponent, ScCheckboxComponent, ScCustomModalComponent, ScCustomModalFooterDirective, ScSelectComponent],
  template: `
    <sc-custom-modal [visible]="true" [title]="t.importarLista" width="32rem" (closed)="cerrado.emit()">
      <div class="cuerpo">
        <sc-select inputId="lab-region-lista" label="País o región" [options]="regiones" optionLabel="label" optionValue="value" [value]="region()" (valueChange)="cambiar($any($event))" />
        <ul class="catalogo" role="list">
          @for (d of dias(); track d.date) {
            <li>
              <label class="dia">
                <sc-checkbox size="sm" [state]="fuera().has(d.date) ? 'none' : 'all'" [ariaLabel]="d.name" (cycle)="alternar(d.date)" />
                <span class="sc-text-body-regular fecha">{{ d.date.slice(8) }}/{{ d.date.slice(5, 7) }}</span>
                <span class="sc-text-body-regular">{{ d.name }}</span>
              </label>
            </li>
          }
        </ul>
        <p class="sc-text-caption-regular nota">
          @if (soloDias()) {
            Se suman a esta lista; los que ya tiene no se repiten.
          } @else {
          {{ existente() ? 'Ya tienes «' + nombre() + '»: se abrirá esa en vez de crear otra.' : 'Se crea «' + nombre() + '». Luego la aplicas a los horarios que quieras.' }}
          }
          Datos de ejemplo de 2026.
        </p>
      </div>
      <div scCustomModalFooter>
        <sc-button variant="secondary" appearance="outlined" label="Cancelar" (clicked)="cerrado.emit()" />
        <sc-button variant="primary" [label]="soloDias() ? 'Añadir ' + (dias().length - fuera().size) + ' días' : existente() ? 'Abrir la que hay' : 'Crear lista con ' + (dias().length - fuera().size) + ' días'" [disabled]="dias().length === fuera().size" (clicked)="crear()" />
      </div>
    </sc-custom-modal>
  `,
  styles: `
    .cuerpo { display: flex; flex-direction: column; gap: var(--sc-spacing-1); }
    .catalogo { max-block-size: 18rem; margin: 0; padding: 0; overflow: auto; list-style: none; }
    .dia { display: flex; align-items: center; gap: var(--sc-spacing-0-75); padding-block: var(--sc-spacing-0-25); cursor: pointer; }
    .fecha { min-inline-size: 3rem; color: var(--sc-text-secondary); font-variant-numeric: tabular-nums; }
    .nota { margin: 0; color: var(--sc-text-secondary); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabImportarListaComponent {
  private readonly store = inject(FestivosStore);
  /** Desde el editor de una lista: no crea otra, solo entrega los días para sumarlos a la que se edita. */
  readonly soloDias = input(false);
  readonly creada = output<CalendarioDeFestivos>();
  readonly elegidos = output<readonly Omit<Festivo, 'id'>[]>();
  readonly cerrado = output<void>();

  protected readonly t = T;
  protected readonly regiones = REGIONES.map((r) => ({ value: r.id, label: r.nombre }));
  protected readonly region = signal('es-md');
  protected readonly fuera = signal<ReadonlySet<string>>(new Set());
  protected readonly dias = computed(() => diasDe(this.region()));
  protected readonly nombre = computed(() => `Festivos ${REGIONES.find((r) => r.id === this.region())?.nombre ?? ''} 2026`);
  protected readonly existente = computed(() => this.store.items().find((c) => c.name === this.nombre()) ?? null);

  protected cambiar(id: string): void {
    this.region.set(id);
    this.fuera.set(new Set());
  }

  protected alternar(date: string): void {
    this.fuera.update((s) => {
      const n = new Set(s);
      if (n.has(date)) n.delete(date);
      else n.add(date);
      return n;
    });
  }

  protected crear(): void {
    if (this.soloDias()) {
      this.elegidos.emit(this.dias().filter((d) => !this.fuera().has(d.date)).map((d) => ({ name: d.name, date: d.date, yearly: esFija(d.date) })));
      return;
    }
    const ya = this.existente();
    if (ya) return this.creada.emit(ya);
    const dias = this.dias().filter((d) => !this.fuera().has(d.date));
    this.creada.emit(
      this.store.addItem({
        name: this.nombre(),
        description: 'Importada del calendario oficial',
        status: 'active',
        days: dias.map((d, i) => ({ id: i + 1, name: d.name, date: d.date, yearly: esFija(d.date) })),
      }),
    );
  }
}
