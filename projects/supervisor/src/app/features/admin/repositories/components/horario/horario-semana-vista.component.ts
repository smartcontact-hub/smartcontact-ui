import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, input, output, signal, untracked } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { ScConfirmService, ScToggleSwitchComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { LanguageService } from '@core/services/language.service';
import { injectLangChange } from '@core/utils/lang-change';

import { HorarioFranjasComponent } from './horario-franjas.component';
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
  imports: [HorarioFranjasComponent, ScIconComponent, ScToggleSwitchComponent, TooltipModule, TranslateModule],
  templateUrl: './horario-semana-vista.component.html',
  styleUrl: './horario-semana-vista.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioSemanaVistaComponent {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly lang = injectLangChange();
  private readonly confirm = inject(ScConfirmService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** ¿Tenía la semana alguna franja la última vez? `null` hasta la primera lectura: al abrir un horario ya hecho no se pregunta nada. */
  private teniaFranjas: boolean | null = null;

  constructor() {
    // Al poner la primera franja de una semana vacía, se pregunta (globo del DS pegado a ese día) si se repite en los demás.
    effect(() => {
      const tiene = this.semana().some((f) => f.length > 0);
      const antes = this.teniaFranjas;
      this.teniaFranjas = tiene;
      if (antes === false && tiene) untracked(() => setTimeout(() => void this.preguntarRepetir(), 0));
    });
    const id = setInterval(() => this.ahora.set(Date.now()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  readonly semana = input.required<Semana>();
  readonly zona = input('Europe/Madrid');
  /** Los días (0 = lunes) marcados como cerrados. */
  readonly cerrados = input<readonly number[]>([]);
  /** Lo que le pasa a la semana (`validarSemana`), para decirlo bajo su día; `null` si vale. */
  readonly falta = input<{ readonly dia: number; readonly codigo: string } | null>(null);
  readonly semanaChange = output<Semana>();
  readonly cierreChange = output<{ readonly dia: number; readonly cerrado: boolean }>();

  /** El instante de ahora en la zona del horario; se refresca cada minuto. */
  private readonly ahora = signal(Date.now());
  private readonly momento = computed(() => ahoraEn(this.zona(), new Date(this.ahora())));
  private readonly hoy = computed(() => this.momento().fecha);
  private readonly lunes = computed(() => sumarDias(this.hoy(), -diaDeLaSemana(this.hoy())));

  /** Las marcas de horas del eje: una por hora (con poco ancho se esconden las impares); la 23 se omite para que no pise al 24. */
  protected readonly marcas = Array.from({ length: 25 }, (_, i) => i).filter((m) => m !== 23);

  /** Las franjas de un día, escritas a mano en sus campos. */
  protected ponerDia(dia: number, franjas: readonly Franja[]): void {
    this.semanaChange.emit(this.semana().map((f, i) => (i === dia ? franjas : f)));
  }

  /** El primer día con franjas y los días que siguen sin configurar (ni cerrados): a ellos se puede repetir su horario. */
  protected readonly sugerencia = computed(() => {
    this.lang();
    const semana = this.semana();
    const cerrados = new Set(this.cerrados());
    const origen = semana.findIndex((f) => f.length > 0);
    if (origen < 0) return null;
    const vacios = semana.map((f, i) => (i !== origen && f.length === 0 && !cerrados.has(i) ? i : -1)).filter((i) => i >= 0);
    if (vacios.length === 0) return null;
    const largo = new Intl.DateTimeFormat(this.language.locale(), { weekday: 'long' });
    return {
      origen,
      nombre: largo.format(aFecha(sumarDias(this.lunes(), origen))),
      todos: vacios,
      laborables: vacios.filter((i) => i <= 4),
    };
  });

  /** El globo de confirmación del DS: ¿repetir el horario del día en los demás? De lunes a viernes si hay días laborables vacíos; si no, en los que falten. */
  private async preguntarRepetir(): Promise<void> {
    const sug = this.sugerencia();
    if (!sug) return;
    const destinos = sug.laborables.length > 0 ? sug.laborables : sug.todos;
    const celdas = this.host.nativeElement.querySelectorAll('.fila__franjas');
    const clave = sug.laborables.length > 0 ? 'repeat_prompt_weekdays' : 'repeat_prompt';
    const objetivo = celdas[sug.origen]?.querySelector('.franjas__fila') ?? celdas[sug.origen] ?? null;
    const respuesta = this.confirm.request({
      title: this.translate.instant('repositories.horarios.sv.repeat_title') as string,
      body: this.translate.instant(`repositories.horarios.sv.${clave}`, { day: sug.nombre.charAt(0).toUpperCase() + sug.nombre.slice(1) }) as string,
      acceptLabel: this.translate.instant('repositories.horarios.sv.repeat_yes') as string,
      rejectLabel: this.translate.instant('repositories.horarios.sv.repeat_no') as string,
      icon: 'content_copy',
      // Pegado a la franja recién puesta (su fila de horas), no a toda la celda, que es mucho más ancha.
      target: objetivo,
    });
    this.colocarGlobo(objetivo);
    const acepta = await respuesta;
    if (acepta) this.repetir(sug.origen, destinos);
  }

  /**
   * PrimeNG pega el globo al borde izquierdo del botón y lo abre hacia abajo: con una franja estrecha queda corrido a la derecha y
   * tapa los días de debajo. Se recoloca encima de la franja recién puesta y centrado sobre ella, con la flecha apuntando hacia
   * abajo (la variante «flipped» del propio componente).
   */
  private colocarGlobo(objetivo: Element | null, intentos = 12): void {
    if (!objetivo) return;
    const globo = document.querySelector<HTMLElement>('.p-confirmpopup');
    if (!globo) {
      if (intentos > 0) requestAnimationFrame(() => this.colocarGlobo(objetivo, intentos - 1));
      return;
    }
    // Se coloca ya y otra vez al asentarse el globo (su ancho final llega tras pintarse el texto).
    this.posicionarGlobo(globo, objetivo);
    setTimeout(() => this.posicionarGlobo(globo, objetivo), 150);
  }

  private posicionarGlobo(globo: HTMLElement, objetivo: Element): void {
    const t = objetivo.getBoundingClientRect();
    // El tamaño sin la animación de entrada (la escala del globo falsea `getBoundingClientRect`).
    const ancho = globo.offsetWidth;
    const alto = globo.offsetHeight;
    const margen = 8;
    const izquierda = Math.min(Math.max(t.left + t.width / 2 - ancho / 2, margen), window.innerWidth - ancho - margen);
    globo.style.left = `${izquierda + window.scrollX}px`;
    globo.style.top = `${t.top - alto - margen + window.scrollY}px`;
    globo.style.setProperty('--p-confirmpopup-arrow-left', `${t.left + t.width / 2 - izquierda - 18}px`);
    globo.setAttribute('data-p-confirmpopup-flipped', 'true');
    globo.classList.add('p-confirmpopup-flipped');
  }

  /** Repite las franjas de un día en los días indicados. */
  protected repetir(origen: number, destinos: readonly number[]): void {
    const franjas = this.semana()[origen] ?? [];
    this.semanaChange.emit(this.semana().map((f, i) => (destinos.includes(i) ? franjas.map((x): Franja => [x[0], x[1]]) : f)));
  }

  protected alternarCierre(dia: number, cerrado: boolean): void {
    this.cierreChange.emit({ dia, cerrado });
  }

  private readonly arrastre = signal<Arrastre | null>(null);

  private formatoHoras(minutos: number): string {
    return `${new Intl.NumberFormat(this.language.locale(), { maximumFractionDigits: 1 }).format(minutos / 60)} h`;
  }

  protected readonly dias = computed(() => {
    this.lang();
    const hoy = this.hoy();
    const drag = this.arrastre();
    const semana = this.semana();
    const cerrados = new Set(this.cerrados());
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
        ahora: fecha === hoy ? (this.momento().minutos / MINUTOS_DEL_DIA) * 100 : null,
        ahoraTexto: fecha === hoy ? horaTexto(this.momento().minutos) : '',
        barras,
        seleccion,
        cerrado: cerrados.has(i) && minutos === 0 && !seleccion,
        nota: cerrados.has(i) && minutos === 0 && !seleccion ? cerrado : null,
        marcado: cerrados.has(i),
        franjas,
        nombre: largo.format(aFecha(fecha)),
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
