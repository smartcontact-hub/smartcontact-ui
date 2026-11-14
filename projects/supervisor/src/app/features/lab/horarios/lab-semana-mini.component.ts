import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { Horario } from '@features/admin/repositories/state/horarios.store';

type Semana = Horario['week'];

/** Un trozo pintable de un día, en minutos desde las 00:00. */
interface Trozo {
  readonly desde: number;
  readonly hasta: number;
}

/** Los trozos de un día (lunes = 0): los suyos y lo que arrastra de la víspera, si su franja cruzó la medianoche. */
export function trozosDelDia(semana: Semana, dia: number): Trozo[] {
  const propios = (semana[dia] ?? []).map((f) => ({ desde: f[0], hasta: f[1] > f[0] ? f[1] : 1440 }));
  const vispera = (semana[(dia + 6) % 7] ?? []).filter((f) => f[1] <= f[0] && f[1] > 0).map((f) => ({ desde: 0, hasta: f[1] }));
  return [...vispera, ...propios];
}

/** Minutos abiertos en la semana habitual (la franja que cruza la medianoche cuenta hasta su fin). */
export const minutosDeLaSemana = (semana: Semana): number =>
  semana.reduce((n, d) => n + d.reduce((m, f) => m + (f[1] > f[0] ? f[1] - f[0] : 1440 - f[0] + f[1]), 0), 0);

/** «45 h», «7,5 h». */
export function horas(minutos: number): string {
  const h = minutos / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1).replace('.', ',')} h`;
}

/**
 * LABORATORIO: la semana habitual en miniatura, para una celda de la tabla. Siete rayas de 24 h, lunes arriba, con sus
 * franjas; la de hoy va más oscura y lleva una marca en la hora de ahora. Para el lector es una imagen con el resumen
 * en texto («L-V 09:00-18:00»), que la celda escribe también al lado.
 */
@Component({
  selector: 'sc-lab-semana-mini',
  template: `
    @for (d of dias(); track d.dia) {
      <span class="dia" [class.dia--hoy]="d.hoy">
        @for (t of d.trozos; track $index) {
          <i [style.inset-inline-start.%]="(t.desde / 1440) * 100" [style.inline-size.%]="((t.hasta - t.desde) / 1440) * 100"></i>
        }
        @if (d.ahora !== null) {
          <b [style.inset-inline-start.%]="(d.ahora / 1440) * 100"></b>
        }
      </span>
    }
  `,
  host: { role: 'img', '[attr.aria-label]': 'resumen()', '[class.inactivo]': 'inactivo()' },
  styles: `
    :host {
      display: flex;
      flex: none;
      flex-direction: column;
      gap: var(--sc-spacing-0-125);
      inline-size: 8rem;
    }
    .dia {
      position: relative;
      display: block;
      block-size: var(--sc-spacing-0-25);
      border-radius: var(--sc-radius-full);
      background: var(--sc-border-subtle);
    }
    i {
      position: absolute;
      inset-block: 0;
      border-radius: inherit;
      background: var(--sc-bg-primary-subtle-active);
    }
    .dia--hoy i {
      background: var(--sc-bg-primary);
    }
    :host(.inactivo) i {
      background: var(--sc-border-default);
    }
    b {
      position: absolute;
      inset-block: -50%;
      inline-size: var(--sc-spacing-0-125);
      border-radius: var(--sc-radius-full);
      background: var(--sc-border-danger);
      translate: -50% 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabSemanaMiniComponent {
  readonly semana = input.required<Semana>();
  /** El día de hoy en la zona del horario (lunes = 0), o `null`. */
  readonly hoy = input<number | null>(null);
  /** Los minutos de ahora en la zona del horario; sin ellos, no hay marca. */
  readonly ahora = input<number | null>(null);
  readonly inactivo = input(false);
  /** Lo que oye el lector: el resumen de la semana en texto. */
  readonly resumen = input('');

  protected readonly dias = computed(() =>
    [0, 1, 2, 3, 4, 5, 6].map((dia) => ({
      dia,
      trozos: trozosDelDia(this.semana(), dia),
      hoy: dia === this.hoy(),
      ahora: dia === this.hoy() && !this.inactivo() ? this.ahora() : null,
    })),
  );
}
