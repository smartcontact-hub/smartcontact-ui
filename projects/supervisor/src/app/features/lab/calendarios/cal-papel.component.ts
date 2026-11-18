import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { ScCustomModalComponent } from '@smartcontact-hub/components';

import { ANIO, diaDeLaSemana, diasDelAnio, LETRAS, MESES } from './cal-modelo';
import { colorDelPapel, LEYENDA_DEL_PAPEL, NOMBRE_MISION_2, TABLA_DEL_PAPEL, type ColorDelPapel } from './cal-misiones';

interface Mes {
  readonly nombre: string;
  readonly hueco: number;
  readonly dias: readonly { readonly n: number; readonly color: ColorDelPapel }[];
}

/**
 * PROTOTIPO DE DISCOVERY: el papel con el que posventa pide su calendario, anonimizado. Es la fuente de la misión 2: la
 * persona lo tiene delante como lo tendría en su trabajo, con sus colores, y lo pasa al prototipo.
 */
@Component({
  selector: 'sc-cal-papel',
  imports: [ScCustomModalComponent],
  template: `
    <sc-custom-modal [visible]="true" width="72rem" [title]="'Calendario de atención ' + anio + ', ' + nombre" (closed)="cerrado.emit()">
      <div class="papel" data-prueba>
        <table class="tabla sc-text-body-regular">
          <thead>
            <tr>
              <th scope="col"><span class="visually-hidden">Qué</span></th>
              @for (c of tabla.columnas; track c) {
                <th scope="col" class="sc-text-body-semibold">{{ c }}</th>
              }
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" class="sc-text-caption-semibold">Fechas</th>
              @for (f of tabla.fechas; track f) {
                <td>{{ f }}</td>
              }
            </tr>
            <tr>
              <th scope="row" class="sc-text-caption-semibold">Horario</th>
              @for (h of tabla.horario; track h) {
                <td>{{ h }}</td>
              }
            </tr>
          </tbody>
        </table>

        <div class="cuerpo">
          <div class="meses">
            @for (m of meses; track m.nombre) {
              <div class="mes">
                <p class="mes__nombre sc-text-caption-semibold">{{ m.nombre }}</p>
                <div class="mes__rejilla" aria-hidden="true">
                  @for (l of letras; track $index) {
                    <span class="mes__letra sc-text-caption-regular">{{ l }}</span>
                  }
                  @for (h of huecos(m.hueco); track $index) {
                    <span></span>
                  }
                  @for (d of m.dias; track d.n) {
                    <span class="dia sc-text-caption-regular" [attr.data-color]="d.color">{{ d.n }}</span>
                  }
                </div>
              </div>
            }
          </div>
          <ul class="leyenda" role="list">
            @for (l of leyenda; track l.color) {
              <li class="leyenda__fila sc-text-body-regular">
                <span class="muestra" [attr.data-color]="l.color" aria-hidden="true"></span>
                <span>{{ l.texto }}</span>
              </li>
            }
          </ul>
        </div>
      </div>
    </sc-custom-modal>
  `,
  styles: `
    .papel { display: flex; flex-direction: column; gap: var(--sc-spacing-2); }
    .tabla { inline-size: 100%; border-collapse: collapse; }
    .tabla th, .tabla td { padding: var(--sc-spacing-0-5) var(--sc-spacing-0-75); border: 1px solid var(--sc-border-subtle); text-align: start; vertical-align: top; }
    .tabla thead th { background: var(--sc-bg-subtle); color: var(--sc-text-heading); }
    .tabla tbody th { color: var(--sc-text-secondary); white-space: nowrap; }
    .cuerpo { display: flex; flex-direction: column; gap: var(--sc-spacing-1-5); }
    .meses { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: var(--sc-spacing-1) var(--sc-spacing-1-5); }
    .mes__nombre { margin: 0 0 var(--sc-spacing-0-25); color: var(--sc-text-heading); text-transform: capitalize; }
    .mes__rejilla { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: var(--sc-spacing-0-125); }
    .mes__letra { text-align: center; color: var(--sc-text-subtle); }
    .dia { display: grid; place-items: center; aspect-ratio: 1; border-radius: var(--sc-radius-xs); border: 1px solid transparent; font-variant-numeric: tabular-nums; }
    .leyenda { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sc-spacing-0-75) var(--sc-spacing-1-5); margin: 0; padding: 0; list-style: none; }
    .leyenda__fila { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--sc-spacing-0-5); align-items: start; color: var(--sc-text-primary); }
    .muestra { inline-size: var(--sc-spacing-1); block-size: var(--sc-spacing-1); margin-block-start: var(--sc-spacing-0-25); border-radius: var(--sc-radius-xs); border: 1px solid transparent; }
    [data-color='blanco'] { background: var(--sc-bg-surface); border-color: var(--sc-border-default); color: var(--sc-text-primary); }
    [data-color='amarillo'] { background: var(--sc-bg-warning-subtle); border-color: var(--sc-border-warning-subtle); color: var(--sc-text-primary); }
    [data-color='azul'] { background: var(--sc-bg-info-subtle); border-color: var(--sc-border-info-subtle); color: var(--sc-text-info); }
    [data-color='verde'] { background: var(--sc-bg-success-subtle); border-color: var(--sc-border-success-subtle); color: var(--sc-text-success); }
    [data-color='rojo'] { background: var(--sc-bg-danger-subtle); border-color: var(--sc-border-danger); color: var(--sc-text-danger); }
    [data-color='naranja'] { background: var(--sc-bg-warning); border-color: var(--sc-border-warning); color: var(--sc-text-on-warning); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalPapelComponent {
  readonly cerrado = output<void>();

  protected readonly anio = ANIO;
  protected readonly nombre = NOMBRE_MISION_2;
  protected readonly tabla = TABLA_DEL_PAPEL;
  protected readonly leyenda = LEYENDA_DEL_PAPEL;
  protected readonly letras = LETRAS;
  protected readonly meses: readonly Mes[] = MESES.map((nombre, i) => {
    const prefijo = `${ANIO}-${String(i + 1).padStart(2, '0')}`;
    const dias = diasDelAnio(ANIO).filter((iso) => iso.startsWith(prefijo));
    return { nombre, hueco: diaDeLaSemana(dias[0]!), dias: dias.map((iso) => ({ n: +iso.slice(8, 10), color: colorDelPapel(iso) })) };
  });

  protected huecos(n: number): readonly number[] {
    return Array.from({ length: n }, (_, i) => i);
  }
}
