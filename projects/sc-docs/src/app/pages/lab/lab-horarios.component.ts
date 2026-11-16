import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScAvatarComponent, ScIconTileComponent, ScTagComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { HORARIOS } from './horarios.data';

/** Un tramo de la semana dibujada: desde y hasta, en horas. */
interface Tramo {
  readonly desde: number;
  readonly hasta: number;
}

/** La semana de la ilustración se dibuja de 6:00 a 22:00: con 24 h los tramos se quedaban en rayitas. */
const DIA_EMPIEZA = 6;
const DIA_DURA = 16;

/**
 * Horarios, la tarjeta grande del Lab: el frente que se está probando ahora, con todas sus versiones juntas.
 *
 * Arriba, como las tarjetas grandes de la portada, un titular a dos tonos y una ilustración hecha con piezas DE VERDAD
 * del DS: la semana dibujada por tramos con la marca de ahora, el estado («Abierto») en un `sc-tag` y un mes con el
 * calor de las horas que abre cada día. Es decorado (`inert` y oculto al lector). Debajo, las versiones en tarjetas con
 * quién la hizo y su PR.
 */
@Component({
  selector: 'app-lab-horarios',
  imports: [ScAvatarComponent, ScIconComponent, ScIconTileComponent, ScTagComponent],
  templateUrl: './lab-horarios.component.html',
  styleUrl: './lab-horarios.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabHorariosComponent {
  protected readonly grupos = HORARIOS;
  protected readonly total = HORARIOS.reduce((n, g) => n + g.versions.length, 0);

  /** La semana de la ilustración: entre semana de 9 a 18, el jueves partido, el sábado por la mañana y el domingo cerrado. */
  protected readonly semana: readonly { readonly dia: string; readonly tramos: readonly Tramo[] }[] = [
    { dia: 'L', tramos: [{ desde: 9, hasta: 18 }] },
    { dia: 'M', tramos: [{ desde: 9, hasta: 18 }] },
    { dia: 'X', tramos: [{ desde: 9, hasta: 18 }] },
    { dia: 'J', tramos: [{ desde: 9, hasta: 14 }, { desde: 16, hasta: 20 }] },
    { dia: 'V', tramos: [{ desde: 9, hasta: 15 }] },
    { dia: 'S', tramos: [{ desde: 10, hasta: 14 }] },
    { dia: 'D', tramos: [] },
  ];

  protected readonly horas = [9, 12, 15, 18];

  /** La marca de ahora, a las 10:30. */
  protected readonly ahora = this.pos(10.5);

  /** El mes con calor: cinco semanas; 0 cerrado, 1-3 cuántas horas abre; un festivo y un día especial. */
  protected readonly mes: readonly { readonly calor: number; readonly tipo?: 'festivo' | 'especial' }[] = Array.from(
    { length: 35 },
    (_, i) => {
      if (i === 7) return { calor: 0, tipo: 'festivo' as const };
      if (i === 23) return { calor: 1, tipo: 'especial' as const };
      const dia = i % 7;
      return { calor: dia === 6 ? 0 : dia === 5 ? 1 : dia === 3 || dia === 4 ? 2 : 3 };
    },
  );

  /** «a.b/c» → [«a.», «b/», «c»]: los trozos entre los que el dominio puede partir de línea. */
  protected trozos(dominio: string): string[] {
    return dominio.match(/[^./]+[./]?/g) ?? [dominio];
  }

  /** Posición de una hora en la pista, en %. */
  protected pos(hora: number): number {
    return ((hora - DIA_EMPIEZA) / DIA_DURA) * 100;
  }
}
