import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { ScButtonComponent } from '@smartcontact-hub/components';

import { HorarioFranjasComponent } from '@features/admin/repositories/components/horario/horario-franjas.component';
import { DIAS, type Franja, LETRAS, resumenDeSemana, type Semana } from './cal-modelo';

/** Un tramo de la semana: unos días (lunes = 0) que comparten las mismas franjas. */
interface Tramo {
  readonly dias: readonly number[];
  readonly franjas: readonly Franja[];
}

const clave = (franjas: readonly Franja[]): string => franjas.map((f) => f.join('-')).join(',');

function tramosDe(semana: Semana): Tramo[] {
  const porClave = new Map<string, Tramo>();
  semana.forEach((franjas, dia) => {
    if (franjas.length === 0) return;
    const k = clave(franjas);
    const t = porClave.get(k);
    porClave.set(k, t ? { ...t, dias: [...t.dias, dia] } : { dias: [dia], franjas });
  });
  return [...porClave.values()];
}

function semanaDe(tramos: readonly Tramo[]): Semana {
  const semana: Franja[][] = Array.from({ length: 7 }, () => []);
  for (const t of tramos) for (const d of t.dias) semana[d] = [...t.franjas];
  return semana;
}

/**
 * PROTOTIPO DE DISCOVERY: la semana de un horario, dibujada (siete rayas de 24 h) y, si se edita, en tramos: unos días
 * marcados (L M X J V S D) que comparten sus franjas. Para que el martes tenga las horas del lunes se marca la M en el
 * tramo del lunes; un día solo puede estar en un tramo.
 */
@Component({
  selector: 'sc-cal-semana',
  imports: [HorarioFranjasComponent, ScButtonComponent, TooltipModule],
  template: `
    <div class="dibujo" [class.dibujo--compacta]="compacta()" role="img" [attr.aria-label]="resumen()">
      @if (!compacta()) {
        <span class="dibujo__horas sc-text-caption-regular" aria-hidden="true">
          @for (h of horas; track h) {
            <span [style.inset-inline-start.%]="(h / 24) * 100">{{ h }}</span>
          }
        </span>
      }
      @for (d of dias(); track d.dia) {
        <span class="dibujo__dia">
          @if (!compacta()) {
            <span class="dibujo__letra sc-text-caption-semibold">{{ d.letra }}</span>
          }
          <span class="dibujo__raya">
            @for (f of d.franjas; track $index) {
              <i [style.inset-inline-start.%]="(f[0] / 1440) * 100" [style.inline-size.%]="((f[1] - f[0]) / 1440) * 100"></i>
            }
          </span>
        </span>
      }
    </div>

    @if (editable()) {
      <ol class="tramos" role="list">
        @for (tramo of tramos(); track $index; let i = $index) {
          <li class="tramo">
            <div class="tramo__dias" role="group" [attr.aria-label]="'Días del tramo ' + (i + 1)">
              @for (letra of letras; track d; let d = $index) {
                <button
                  type="button"
                  class="orbe sc-text-caption-semibold"
                  [class.orbe--on]="tramo.dias.includes(d)"
                  [attr.aria-pressed]="tramo.dias.includes(d)"
                  [attr.aria-label]="nombres[d]"
                  [pTooltip]="nombres[d]" tooltipPosition="top" tooltipEvent="both"
                  (click)="alternar(i, d)"
                >{{ letra }}</button>
              }
              <sc-button
                class="tramo__quitar"
                variant="secondary"
                appearance="text"
                size="sm"
                icon="close"
                [ariaLabel]="'Quitar el tramo ' + (i + 1)"
                (clicked)="quitar(i)"
              />
            </div>
            <sc-horario-franjas [franjas]="tramo.franjas" [etiqueta]="'tramo ' + (i + 1)" (franjasChange)="ponerFranjas(i, $event)" />
          </li>
        }
      </ol>
      <div class="pie">
        <sc-button
          variant="secondary"
          appearance="outlined"
          size="sm"
          icon="add"
          label="Añadir días con otras horas"
          [disabled]="cerrados().length === 0"
          (clicked)="anadir()"
        />
        @if (cerrados().length > 0) {
          <p class="cerrados sc-text-caption-regular">Cerrado: {{ cerradosTexto() }}</p>
        }
      </div>
    }
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: var(--sc-spacing-1); }
    .dibujo { position: relative; display: flex; flex-direction: column; gap: var(--sc-spacing-0-25); padding-block-start: var(--sc-spacing-1); }
    .dibujo__horas { position: absolute; inset-block-start: 0; inset-inline: var(--sc-spacing-1-5) 0; block-size: var(--sc-spacing-1); color: var(--sc-text-subtle); }
    .dibujo__horas span { position: absolute; translate: -50% 0; }
    .dibujo__dia { display: grid; grid-template-columns: var(--sc-spacing-1-5) minmax(0, 1fr); align-items: center; }
    .dibujo__letra { color: var(--sc-text-secondary); }
    .dibujo__raya { position: relative; block-size: var(--sc-spacing-0-75); border-radius: var(--sc-radius-full); background: color-mix(in srgb, var(--sc-text-heading) 5%, var(--sc-bg-surface)); }
    .dibujo--compacta { gap: var(--sc-spacing-0-125); padding-block-start: 0; }
    .dibujo--compacta .dibujo__dia { grid-template-columns: minmax(0, 1fr); }
    .dibujo--compacta .dibujo__raya {
      block-size: var(--sc-spacing-0-25);
      /* Guías a las 6, 12 y 18 h: así se ve la pausa del mediodía sin leer horas. */
      background:
        linear-gradient(90deg, transparent calc(25% - 0.5px), var(--guia) calc(25% - 0.5px) calc(25% + 0.5px), transparent calc(25% + 0.5px),
          transparent calc(50% - 0.5px), var(--guia) calc(50% - 0.5px) calc(50% + 0.5px), transparent calc(50% + 0.5px),
          transparent calc(75% - 0.5px), var(--guia) calc(75% - 0.5px) calc(75% + 0.5px), transparent calc(75% + 0.5px)),
        color-mix(in srgb, var(--sc-text-heading) 5%, var(--sc-bg-surface));
    }
    .dibujo--compacta { --guia: color-mix(in srgb, var(--sc-text-heading) 14%, transparent); }
    .dibujo--compacta .dibujo__raya i { z-index: 1; }
    .dibujo__raya i { position: absolute; inset-block: 0; border-radius: inherit; background: color-mix(in srgb, var(--sc-bg-info) 72%, var(--sc-bg-surface)); }
    .tramos { display: flex; flex-direction: column; gap: var(--sc-spacing-1); margin: 0; padding: 0; list-style: none; }
    .tramo {
      display: flex; flex-direction: column; gap: var(--sc-spacing-0-5);
      padding: var(--sc-spacing-1);
      border: 1px solid var(--sc-border-subtle); border-radius: var(--sc-radius-md);
      background: var(--sc-bg-surface);
    }
    .tramo__dias { display: flex; align-items: center; gap: var(--sc-spacing-0-25); }
    .tramo__quitar { margin-inline-start: auto; }
    .orbe {
      inline-size: 2rem; block-size: 2rem; padding: 0;
      border: 1px solid var(--sc-border-default); border-radius: var(--sc-radius-full);
      background: var(--sc-bg-surface); color: var(--sc-text-secondary); cursor: pointer;
      transition: background-color 150ms ease-out, transform 150ms ease-out;
      &:hover { background: var(--sc-bg-hover); }
      &:active { transform: scale(0.96); }
      &:focus-visible { outline: 2px solid var(--sc-border-focus); outline-offset: 1px; }
    }
    .orbe--on, .orbe--on:hover { border-color: var(--sc-bg-primary); background: var(--sc-bg-primary); color: var(--sc-text-on-primary); }
    .pie { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sc-spacing-0-5) var(--sc-spacing-1); }
    .cerrados { margin: 0; color: var(--sc-text-secondary); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalSemanaComponent {
  readonly semana = input.required<Semana>();
  readonly editable = input(false, { transform: booleanAttribute });
  /** Sin horas ni letras, siete rayas finas: para una fila de tabla. */
  readonly compacta = input(false, { transform: booleanAttribute });
  readonly semanaChange = output<Semana>();

  protected readonly letras = LETRAS;
  protected readonly nombres = DIAS;
  protected readonly horas = [0, 6, 12, 18, 24];
  protected readonly resumen = computed(() => resumenDeSemana(this.semana()));
  protected readonly dias = computed(() => this.semana().map((franjas, dia) => ({ dia, letra: LETRAS[dia], franjas })));

  /* Los tramos se guardan aparte mientras se editan: uno recién añadido no tiene días y la semana no puede
   * representarlo. Se recalculan cuando la semana llega de fuera. */
  private ultimaEmitida: Semana | null = null;
  private borrador: Tramo[] = [];
  protected readonly tramos = computed<Tramo[]>(() => {
    const s = this.semana();
    if (s !== this.ultimaEmitida) this.borrador = tramosDe(s);
    return this.borrador;
  });

  protected readonly cerrados = computed(() => {
    const usados = new Set(this.tramos().flatMap((t) => t.dias));
    return [0, 1, 2, 3, 4, 5, 6].filter((d) => !usados.has(d));
  });
  protected readonly cerradosTexto = computed(() => this.cerrados().map((d) => DIAS[d]).join(', '));

  private emitir(tramos: Tramo[]): void {
    this.borrador = tramos;
    const semana = semanaDe(tramos);
    this.ultimaEmitida = semana;
    this.semanaChange.emit(semana);
  }

  protected alternar(i: number, dia: number): void {
    const tramos = this.tramos();
    const yaEsta = tramos[i]!.dias.includes(dia);
    this.emitir(
      tramos.map((t, j) => {
        if (j === i) return { ...t, dias: yaEsta ? t.dias.filter((d) => d !== dia) : [...t.dias, dia].sort() };
        return yaEsta ? t : { ...t, dias: t.dias.filter((d) => d !== dia) };
      }),
    );
  }

  protected ponerFranjas(i: number, franjas: readonly Franja[]): void {
    this.emitir(this.tramos().map((t, j) => (j === i ? { ...t, franjas } : t)));
  }

  protected quitar(i: number): void {
    this.emitir(this.tramos().filter((_, j) => j !== i));
  }

  /** El tramo nuevo nace con los días que quedan cerrados y de 09:00 a 14:00. */
  protected anadir(): void {
    this.emitir([...this.tramos(), { dias: this.cerrados(), franjas: [[540, 840]] }]);
  }
}
