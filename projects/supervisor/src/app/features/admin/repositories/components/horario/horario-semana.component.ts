import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScButtonComponent, ScMultiSelectComponent, ScSelectComponent, ScToggleSwitchComponent } from '@smartcontact-hub/components';

import { injectLangChange } from '@core/utils/lang-change';

import type { CodigoDeSemana, Franja, Semana } from '../../state/horarios.core.mjs';
import { HorarioFranjasComponent } from './horario-franjas.component';

export const DIAS_DE_LA_SEMANA = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/**
 * Una semana, de lunes a domingo: cada día abierto o cerrado y, abierto, con sus franjas. Debajo, «Copiar» lleva las
 * franjas de un día a otros. Es la semana habitual de un horario y la de cada periodo.
 */
@Component({
  selector: 'sc-horario-semana',
  imports: [HorarioFranjasComponent, ScButtonComponent, ScMultiSelectComponent, ScSelectComponent, ScToggleSwitchComponent, TranslateModule],
  templateUrl: './horario-semana.component.html',
  styleUrl: './horario-semana.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioSemanaComponent {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  readonly semana = input.required<Semana>();
  /** Lo que le pasa a la semana (`validarSemana`), para decirlo bajo su día; `null` si vale. */
  readonly falta = input<{ readonly dia: number; readonly codigo: CodigoDeSemana } | null>(null);
  /** Distingue los `id` cuando hay dos semanas en pantalla (la habitual y la de un periodo). */
  readonly prefijo = input('semana');
  readonly semanaChange = output<Semana>();

  protected readonly dias = computed(() => {
    this.lang();
    return DIAS_DE_LA_SEMANA.map((clave, indice) => ({
      indice,
      nombre: this.translate.instant(`repositories.horarios.days.${clave}`) as string,
      franjas: this.semana()[indice] ?? [],
    }));
  });

  protected readonly opcionesDeDia = computed(() => this.dias().map((d) => ({ value: d.indice, label: d.nombre })));
  protected readonly origen = signal(0);
  protected readonly destinos = signal<number[]>([]);
  protected readonly destinosPosibles = computed(() => this.opcionesDeDia().filter((d) => d.value !== this.origen()));

  protected ponerDia(dia: number, franjas: readonly Franja[]): void {
    this.semanaChange.emit(this.semana().map((f, i) => (i === dia ? franjas : f)));
  }

  /** Al abrir un día, las franjas del día abierto más cercano por delante; si no hay ninguno, de 09:00 a 18:00. */
  protected abrir(dia: number, abierto: boolean): void {
    if (!abierto) return this.ponerDia(dia, []);
    const semana = this.semana();
    const vecino = [...Array(6).keys()].map((n) => semana[(dia + 6 - n) % 7] ?? []).find((f) => f.length > 0);
    this.ponerDia(dia, vecino ?? [[540, 1080]]);
  }

  protected elegirOrigen(valor: unknown): void {
    this.origen.set(Number(valor));
    this.destinos.update((d) => d.filter((x) => x !== this.origen()));
  }

  protected copiar(): void {
    const franjas = this.semana()[this.origen()] ?? [];
    const destinos = new Set(this.destinos());
    this.semanaChange.emit(this.semana().map((f, i) => (destinos.has(i) ? franjas : f)));
    this.destinos.set([]);
  }
}
