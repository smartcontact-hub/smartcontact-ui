import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { LanguageService } from '@core/services/language.service';
import { injectLangChange } from '@core/utils/lang-change';

import { ahoraEn, cruzaMedianoche, diaDeLaSemana, type Franja, MINUTOS_DEL_DIA, type Semana, sumarDias } from '../../state/horarios.core.mjs';

/** Los tramos más cortos que esto no llevan su texto dentro de la barra (no cabría): se lee en la fila. */
const MIN_ANCHO_PARA_TEXTO = 13;
/** Lo que se ajusta al mover el borde de un tramo, en minutos. */
const PASO = 15;
/** El hueco que se elige al apretar (como en un calendario de equipo): media hora. */
const HUECO = 30;
const aFecha = (iso: string): Date => new Date(`${iso}T12:00:00`);
const dosCifras = (n: number): string => String(n).padStart(2, '0');
const horaTexto = (m: number): string => `${Math.floor(m / 60)}:${dosCifras(m % 60)}`;
const rangoTexto = (a: number, b: number): string => `${horaTexto(a)}–${horaTexto(b)}`;
const limitar = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

/** Une los tramos que se tocan o se pisan; los devuelve ordenados. */
function unir(franjas: readonly Franja[]): Franja[] {
  const orden = franjas.map((f): [number, number] => [f[0], f[1]]).sort((x, y) => x[0] - y[0]);
  const out: [number, number][] = [];
  for (const f of orden) {
    const ultimo = out[out.length - 1];
    if (ultimo && f[0] <= ultimo[1]) ultimo[1] = Math.max(ultimo[1], f[1]);
    else out.push(f);
  }
  return out;
}

/** Lo que se hace con el ratón apretado: abrir un tramo nuevo, o mover el principio o el final de uno que ya está. */
interface Arrastre {
  readonly dia: number;
  readonly modo: 'nuevo' | 'ini' | 'fin' | 'mover';
  /** Qué tramo del día (su posición entre los que se pueden editar); `-1` si es uno nuevo. */
  readonly idx: number;
  /** Donde se apretó (en minutos): el extremo que no se mueve. */
  readonly ancla: number;
  /** Donde está el ratón ahora (en minutos). */
  readonly actual: number;
}

/**
 * La semana de un horario, y donde se edita: una fila por día con la línea de las 24 horas. Se aprieta en un hueco y queda elegido en
 * el acto (media hora); sin soltar, se ARRASTRA hasta donde se quiera, como en un calendario de equipo: al soltar queda un tramo
 * abierto. Pasada la pulsación ya no hay nada elegido: el siguiente clic elige otro hueco. Un tramo se agarra por el cuerpo y se mueve
 * entero dentro del día (de 8–12 a 12–14, por ejemplo); sus bordes se arrastran para cambiarlo y su × lo quita. Un día sin
 * tramos se ve deshabilitado (letra tachada, línea rayada y «Cerrado»). El día de hoy lleva la letra subrayada. Pieza propia del
 * experimento; el ajuste con teclado y al minuto está en el editor de franjas de al lado.
 */
@Component({
  selector: 'sc-horario-semana-vista',
  imports: [ScIconComponent, TranslateModule],
  templateUrl: './horario-semana-vista.component.html',
  styleUrl: './horario-semana-vista.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioSemanaVistaComponent {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly lang = injectLangChange();

  readonly semana = input.required<Semana>();
  readonly zona = input('Europe/Madrid');
  readonly semanaChange = output<Semana>();

  private readonly hoy = computed(() => ahoraEn(this.zona()).fecha);
  private readonly lunes = computed(() => sumarDias(this.hoy(), -diaDeLaSemana(this.hoy())));

  /** Las marcas de horas del eje: una por hora (con poco ancho se esconden las impares); la 23 se omite para que no pise al 24. */
  protected readonly marcas = Array.from({ length: 25 }, (_, i) => i).filter((m) => m !== 23);

  private readonly arrastre = signal<Arrastre | null>(null);

  private formatoHoras(minutos: number): string {
    return `${new Intl.NumberFormat(this.language.locale(), { maximumFractionDigits: 1 }).format(minutos / 60)} h`;
  }

  protected readonly dias = computed(() => {
    this.lang();
    const hoy = this.hoy();
    const drag = this.arrastre();
    const semana = this.semana();
    const letra = new Intl.DateTimeFormat(this.language.locale(), { weekday: 'narrow' });
    const largo = new Intl.DateTimeFormat(this.language.locale(), { weekday: 'long' });
    const cerrado = this.translate.instant('repositories.horarios.closed') as string;
    return Array.from({ length: 7 }, (_, i) => {
      const fecha = sumarDias(this.lunes(), i);
      const franjas = semana[i] ?? [];
      const previa = semana[(i + 6) % 7] ?? [];
      // Los tramos que se pueden editar (no cruzan la medianoche), con su posición entre ellos.
      const propios = franjas.filter((f) => !cruzaMedianoche(f)).map((f) => [f[0], f[1]] as [number, number]);
      const editables = propios.map(([a, b], idx) => {
        if (drag && drag.dia === i && drag.modo === 'mover' && drag.idx === idx) {
          const s = this.desplazamiento(drag, a, b);
          return [a + s, b + s] as [number, number];
        }
        if (drag && drag.dia === i && (drag.modo === 'ini' || drag.modo === 'fin') && drag.idx === idx) {
          const m = limitar(Math.round(drag.actual / PASO) * PASO, 0, MINUTOS_DEL_DIA);
          return drag.modo === 'ini' ? ([Math.min(m, b - PASO), b] as [number, number]) : ([a, Math.max(m, a + PASO)] as [number, number]);
        }
        return [a, b] as [number, number];
      });
      // Lo que cruza la medianoche se enseña partido (hasta las 24 h y desde las 0 h del día siguiente), sin poderse arrastrar.
      const fijos: [number, number][] = [
        ...franjas.filter((f) => cruzaMedianoche(f)).map((f) => [f[0], MINUTOS_DEL_DIA] as [number, number]),
        ...previa.filter((f) => cruzaMedianoche(f) && f[1] > 0).map((f) => [0, f[1]] as [number, number]),
      ];
      const todos = [
        ...editables.map(([a, b], idx) => ({ a, b, idx, editable: true })),
        ...fijos.map(([a, b]) => ({ a, b, idx: -1, editable: false })),
      ];
      const barras = todos.map((t) => ({
        ...t,
        izq: (t.a / MINUTOS_DEL_DIA) * 100,
        ancho: ((t.b - t.a) / MINUTOS_DEL_DIA) * 100,
        texto: rangoTexto(t.a, t.b),
        conTexto: ((t.b - t.a) / MINUTOS_DEL_DIA) * 100 >= MIN_ANCHO_PARA_TEXTO,
      }));
      let seleccion: { izq: number; ancho: number; texto: string } | null = null;
      if (drag && drag.dia === i && drag.modo === 'nuevo') {
        const [a, b] = this.rangoElegido(drag);
        seleccion = { izq: (a / MINUTOS_DEL_DIA) * 100, ancho: ((b - a) / MINUTOS_DEL_DIA) * 100, texto: rangoTexto(a, b) };
      }
      const minutos = todos.reduce((s, t) => s + (t.b - t.a), 0);
      return {
        indice: i,
        fecha,
        letra: letra.format(aFecha(fecha)),
        esHoy: fecha === hoy,
        barras,
        seleccion,
        cerrado: minutos === 0 && !seleccion,
        nota: minutos === 0 && !seleccion ? cerrado : null,
        horas: minutos > 0 ? this.formatoHoras(minutos) : '—',
        minutos,
        aria: `${largo.format(aFecha(fecha))}: ${barras.length > 0 ? barras.map((b) => b.texto).join(', ') : cerrado}`,
      };
    });
  });

  /* ── Con el ratón ─────────────────────────────────────────────────────────────────────────────────────────────── */

  private minutoDe(event: PointerEvent, pista: HTMLElement): number {
    const r = pista.getBoundingClientRect();
    return limitar(((event.clientX - r.left) / r.width) * MINUTOS_DEL_DIA, 0, MINUTOS_DEL_DIA);
  }

  /** El rango de un hueco elegido: el hueco apretado y, si se arrastra, todos los de en medio hasta el hueco donde está el ratón. */
  private rangoElegido(a: Arrastre): [number, number] {
    const hueco = (m: number): number => limitar(Math.floor(m / HUECO) * HUECO, 0, MINUTOS_DEL_DIA - HUECO);
    const x = hueco(a.ancla);
    const y = hueco(a.actual);
    return [Math.min(x, y), Math.max(x, y) + HUECO];
  }

  /** Apretar en un hueco: queda elegido en el acto (media hora) y se amplía arrastrando sin soltar. Apretar sobre un tramo ya abierto no elige nada. */
  protected empezar(event: PointerEvent, dia: number): void {
    if (event.button !== 0 || (event.target as HTMLElement).closest('.barra')) return;
    const pista = event.currentTarget as HTMLElement;
    pista.setPointerCapture(event.pointerId);
    const m = this.minutoDe(event, pista);
    this.arrastre.set({ dia, modo: 'nuevo', idx: -1, ancla: m, actual: m });
  }

  /** Cuánto se ha movido un tramo entero (en minutos, de 15 en 15), sin salirse del día. */
  private desplazamiento(a: Arrastre, ini: number, fin: number): number {
    return limitar(Math.round((a.actual - a.ancla) / PASO) * PASO, -ini, MINUTOS_DEL_DIA - fin);
  }

  /** Apretar en el cuerpo de un tramo ya abierto: se agarra entero y se mueve dentro del mismo día. */
  protected empezarMover(event: PointerEvent, dia: number, idx: number): void {
    if (event.button !== 0) return;
    event.stopPropagation();
    const pista = (event.currentTarget as HTMLElement).closest('.pista') as HTMLElement;
    pista.setPointerCapture(event.pointerId);
    const m = this.minutoDe(event, pista);
    this.arrastre.set({ dia, modo: 'mover', idx, ancla: m, actual: m });
  }

  /** Apretar en el borde de un tramo: mueve su principio o su final. */
  protected empezarBorde(event: PointerEvent, dia: number, idx: number, modo: 'ini' | 'fin'): void {
    if (event.button !== 0) return;
    event.stopPropagation();
    const pista = (event.currentTarget as HTMLElement).closest('.pista') as HTMLElement;
    pista.setPointerCapture(event.pointerId);
    const m = this.minutoDe(event, pista);
    this.arrastre.set({ dia, modo, idx, ancla: m, actual: m });
  }

  protected mover(event: PointerEvent): void {
    const a = this.arrastre();
    if (!a) return;
    this.arrastre.set({ ...a, actual: this.minutoDe(event, event.currentTarget as HTMLElement) });
  }

  /** Soltar: el hueco elegido (o el rango arrastrado) queda como tramo abierto. */
  protected soltar(event: PointerEvent): void {
    const a = this.arrastre();
    if (!a) return;
    this.arrastre.set(null);
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    const m = limitar(Math.round(this.minutoDe(event, event.currentTarget as HTMLElement) / PASO) * PASO, 0, MINUTOS_DEL_DIA);
    const franjas = this.semana()[a.dia] ?? [];
    if (a.modo === 'nuevo') {
      const [x, y] = this.rangoElegido({ ...a, actual: this.minutoDe(event, event.currentTarget as HTMLElement) });
      this.poner(a.dia, unir([...franjas, [x, y]]));
      return;
    }
    const propios = franjas.filter((f) => !cruzaMedianoche(f));
    const f = propios[a.idx];
    if (!f) return;
    if (a.modo === 'mover') {
      const s = this.desplazamiento({ ...a, actual: this.minutoDe(event, event.currentTarget as HTMLElement) }, f[0], f[1]);
      if (s !== 0) this.poner(a.dia, unir([...franjas.filter((x) => x !== f), [f[0] + s, f[1] + s]]));
      return;
    }
    const nuevo: Franja = a.modo === 'ini' ? [Math.min(m, f[1] - PASO), f[1]] : [f[0], Math.max(m, f[0] + PASO)];
    this.poner(a.dia, unir([...franjas.filter((x) => x !== f), nuevo]));
  }

  protected cancelar(): void {
    this.arrastre.set(null);
  }

  /** Quitar un tramo (su ×, o Suprimir con el foco en él). */
  protected quitar(dia: number, idx: number): void {
    const franjas = this.semana()[dia] ?? [];
    const propios = franjas.filter((f) => !cruzaMedianoche(f));
    const f = propios[idx];
    if (f) this.poner(dia, franjas.filter((x) => x !== f));
  }

  private poner(dia: number, franjas: readonly Franja[]): void {
    this.semanaChange.emit(this.semana().map((f, i) => (i === dia ? franjas : f)));
  }
}
