import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { Horario } from '@features/admin/repositories/state/horarios.store';

import { horas, trozosDelDia } from './lab-semana-mini.component';

type Semana = Horario['week'];

const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const HORAS_EJE = [0, 6, 12, 18, 24];

/**
 * LABORATORIO: la semana habitual dibujada, encima de sus tramos en el editor. Una línea de 24 h por día con sus franjas,
 * las horas de cada día a la derecha y, en el de hoy, una marca en la hora de ahora. Se lee de un vistazo lo que los
 * tramos de debajo dicen en campos. Para el lector es una imagen con el resumen en texto.
 */
@Component({
  selector: 'sc-lab-semana-lineas',
  template: `
    <span class="eje sc-text-caption-regular" aria-hidden="true">
      @for (h of ejes; track h) {
        <span [style.inset-inline-start.%]="(h / 24) * 100">{{ h }}</span>
      }
    </span>
    @for (d of dias(); track d.dia) {
      <span class="dia" [class.dia--hoy]="d.hoy" [class.dia--resaltado]="d.resaltado" aria-hidden="true">
        <span class="dia__letra sc-text-caption-semibold">{{ d.letra }}</span>
        <span class="dia__linea">
          @for (t of d.trozos; track $index) {
            <i [style.inset-inline-start.%]="(t.desde / 1440) * 100" [style.inline-size.%]="((t.hasta - t.desde) / 1440) * 100"></i>
          }
          @if (d.ahora !== null) {
            <b [style.inset-inline-start.%]="(d.ahora / 1440) * 100"></b>
          }
        </span>
        <span class="dia__horas sc-text-caption-regular">{{ d.horas }}</span>
      </span>
    }
  `,
  host: { role: 'img', '[attr.aria-label]': 'resumen()' },
  styles: `
    :host {
      display: grid;
      grid-template-columns: 1.25rem minmax(0, 1fr) 3.5rem;
      column-gap: var(--sc-spacing-0-75);
      row-gap: var(--sc-spacing-0-125);
      padding-block: var(--sc-spacing-0-25) var(--sc-spacing-0-5);
    }
    .eje {
      position: relative;
      grid-column: 2;
      block-size: var(--sc-spacing-1);
      color: var(--sc-text-secondary);
      font-variant-numeric: tabular-nums;
    }
    .eje span {
      position: absolute;
      translate: -50% 0;
    }
    .eje span:first-child {
      translate: 0 0;
    }
    .eje span:last-child {
      translate: -100% 0;
    }
    .dia {
      display: contents;
    }
    .dia__letra {
      grid-column: 1;
      align-self: center;
      color: var(--sc-text-secondary);
      text-align: center;
    }
    .dia--hoy .dia__letra {
      color: var(--sc-text-danger);
    }
    .dia__linea {
      grid-column: 2;
      position: relative;
      align-self: center;
      block-size: var(--sc-spacing-0-75);
      border-radius: var(--sc-radius-sm);
      /* Las 6, las 12 y las 18: una raya fina cada cuarto de día. */
      background: linear-gradient(to right, var(--sc-border-default) 1px, transparent 1px) 0 0 / 25% 100%, var(--sc-bg-secondary-subtle);
      transition: box-shadow 150ms ease-out;
    }
    .dia--resaltado .dia__linea {
      box-shadow: 0 0 0 2px var(--sc-border-primary);
    }
    i {
      position: absolute;
      inset-block: 0;
      border-radius: var(--sc-radius-sm);
      background: var(--sc-bg-primary);
    }
    b {
      position: absolute;
      inset-block: -25%;
      inline-size: var(--sc-spacing-0-125);
      border-radius: var(--sc-radius-full);
      background: var(--sc-border-danger);
      translate: -50% 0;
    }
    .dia__horas {
      grid-column: 3;
      align-self: center;
      color: var(--sc-text-secondary);
      text-align: end;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabSemanaLineasComponent {
  readonly semana = input.required<Semana>();
  /** El día de hoy en la zona del horario (lunes = 0), o `null`. */
  readonly hoy = input<number | null>(null);
  /** Los minutos de ahora en la zona del horario; sin ellos, no hay marca. */
  readonly ahora = input<number | null>(null);
  /** El día que el calendario señala (lunes = 0): su línea se enmarca un momento. */
  readonly resaltado = input<number | null>(null);
  /** Lo que oye el lector: el resumen de la semana en texto. */
  readonly resumen = input('');

  protected readonly ejes = HORAS_EJE;

  protected readonly dias = computed(() =>
    LETRAS.map((letra, dia) => {
      const trozos = trozosDelDia(this.semana(), dia);
      const minutos = (this.semana()[dia] ?? []).reduce((n, f) => n + (f[1] > f[0] ? f[1] - f[0] : 1440 - f[0] + f[1]), 0);
      return {
        dia,
        letra,
        trozos,
        horas: minutos ? horas(minutos) : 'Cerrado',
        hoy: dia === this.hoy(),
        resaltado: dia === this.resaltado(),
        ahora: dia === this.hoy() ? this.ahora() : null,
      };
    }),
  );
}
