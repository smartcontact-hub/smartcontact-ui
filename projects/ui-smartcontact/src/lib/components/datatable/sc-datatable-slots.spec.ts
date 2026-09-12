/*
 * LAS RANURAS DE p-table, REENVIADAS — la red que sostiene "pega un ejemplo de
 * primeng.dev y funciona".
 *
 * Por qué existe. `sc-datatable` no es una caja con un hueco: las queries de
 * p-table son `contentChild('header')` y solo ven SU propio contenido, así que
 * una plantilla del consumidor NO llega sola (medido el 2026-09-11 con una
 * sonda y su control positivo). Llega porque este componente la captura y la
 * vuelve a emitir. Eso es código, y el código se rompe: sin estas pruebas, un
 * refactor del `.html` deja de reenviar y nadie se entera — el modelo de
 * column-defs sigue pintando, que es el camino que usan las 16 tablas de hoy.
 *
 * Qué fija: (1) una plantilla del consumidor GANA sobre el modelo de
 * column-defs; (2) una ranura que el componente no implementa (`footer`)
 * también llega; (3) el contexto de fila viaja entero; y (4) sin plantilla no
 * se pinta el elemento vacío, que es lo que costaría declarar las 38 siempre.
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { ScDatatableComponent } from './sc-datatable.component';
import type { ScColumnDef } from '../../core/types/datatable.types';

interface Fila {
  readonly id: number;
  readonly nombre: string;
}

const FILAS: readonly Fila[] = [
  { id: 1, nombre: 'Inés' },
  { id: 2, nombre: 'Marc' },
];
const COLUMNAS: readonly ScColumnDef<Fila>[] = [{ field: 'nombre', header: 'CABECERA-COLUMN-DEF' }];

/** El molde de primeng.dev: `#header` + `#body` con `let-fila`, pegado tal cual. */
@Component({
  standalone: true,
  imports: [ScDatatableComponent],
  template: `<sc-datatable [value]="filas" [columns]="columnas" dataKey="id">
    <ng-template #header>
      <tr>
        <th>CABECERA-DEL-CONSUMIDOR</th>
      </tr>
    </ng-template>
    <ng-template #body let-fila let-i="rowIndex">
      <tr>
        <td>CELDA:{{ fila.nombre }}:{{ i }}</td>
      </tr>
    </ng-template>
    <ng-template #footer>
      <tr>
        <td>PIE-DEL-CONSUMIDOR</td>
      </tr>
    </ng-template>
  </sc-datatable>`,
})
class ConPlantillasDePrimeNg {
  filas = FILAS;
  columnas = COLUMNAS;
}

/** Sin plantillas: el modelo data-driven de siempre. */
@Component({
  standalone: true,
  imports: [ScDatatableComponent],
  template: `<sc-datatable [value]="filas" [columns]="columnas" dataKey="id" />`,
})
class SoloColumnDefs {
  filas = FILAS;
  columnas = COLUMNAS;
}

const pintar = (c: unknown): HTMLElement => {
  const f = TestBed.createComponent(c as never);
  f.detectChanges();
  return f.nativeElement as HTMLElement;
};

describe('sc-datatable · ranuras de p-table reenviadas', () => {
  it('la cabecera del consumidor GANA sobre el modelo de column-defs', () => {
    const el = pintar(ConPlantillasDePrimeNg);
    expect(el.textContent).toContain('CABECERA-DEL-CONSUMIDOR');
    expect(el.textContent).not.toContain('CABECERA-COLUMN-DEF');
  });

  it('el cuerpo del consumidor llega CON su contexto de fila', () => {
    // La fila 2 en el índice 1: si el contexto no viajara, saldría `undefined`.
    expect(pintar(ConPlantillasDePrimeNg).textContent).toContain('CELDA:Marc:1');
  });

  it('una ranura que el componente NO implementa (footer) también llega', () => {
    const el = pintar(ConPlantillasDePrimeNg);
    expect(el.textContent).toContain('PIE-DEL-CONSUMIDOR');
    expect(el.querySelectorAll('tfoot').length).toBeGreaterThan(0);
  });

  it('sin plantillas del consumidor, el modelo de column-defs sigue pintando', () => {
    const el = pintar(SoloColumnDefs);
    expect(el.textContent).toContain('CABECERA-COLUMN-DEF');
    expect(el.textContent).toContain('Inés');
  });

  it('sin plantilla de pie NO se pinta un <tfoot> vacío', () => {
    // Es el motivo de que cada ranura vaya dentro de un `@if`: declararlas
    // siempre haría que p-table pintara el elemento aunque nadie lo use.
    expect(pintar(SoloColumnDefs).querySelectorAll('tfoot').length).toBe(0);
  });
});
