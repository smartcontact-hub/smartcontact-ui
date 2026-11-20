import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, HostListener, inject, linkedSignal, type OnInit, signal, type TemplateRef, viewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ScButtonComponent, ScSectionCardComponent, ScSelectComponent } from '@smartcontact-hub/components';
import { TooltipModule } from 'primeng/tooltip';

import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { pruebaEnCurso } from '@core/prueba/prueba-arranque';
import { BreadcrumbService } from '@core/services';

import { ahoraEn, diaDeLaSemana, type Horario, validarSemana } from '@features/admin/repositories/state/horarios.core.mjs';
import { HorariosStore } from '@features/admin/repositories/state/horarios.store';
import { nombreDeCopia } from '@shared/utils/copy-name';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';

import { estadoDeHorario } from '../horarios/lab-horarios-estado';
import { AplicadoEn, sitios, TIPOS_DE_USO } from './tp-aplicado';
import { TpDiasComponent } from './tp-dias.component';
import { TpIconoComponent } from './tp-icono.component';
import { descripcionDe, horas, minutosDeSemana, resumenDe, soloSemana } from './tp-modelo';
import { TpCabeDirective } from './tp-cabe.directive';
import { TpAvisos, TpAvisosComponent, TpModalComponent } from './tp-piezas';
import { TpSemanaComponent } from './tp-semana.component';
import { T } from './tp-textos';
import { contarUso } from './tp-usos';

type Borrador = Omit<Horario, 'id'>;

/** Un horario nuevo empieza sin ningún día abierto: la semana enseña una fila sin días para irlos marcando. */
const VACIO: Borrador = {
  name: '',
  timezone: 'Europe/Madrid',
  description: '',
  status: 'active',
  week: [[], [], [], [], [], [], []],
  periods: [],
  specials: [],
  holidayCalendarIds: [],
};

/** La lista de Horarios de esta versión; un horario se abre en `<LISTA>/horario/:id`. */
const LISTA = '/lab/tiempo';

/**
 * CIERRE DE HORARIOS: el editor de un horario, que ya solo es su semana (periodos, días especiales y festivos pasan al
 * calendario). Arriba, el nombre, su descripción (la escribe quien lo crea), sus horas y si ahora se atiende; debajo,
 * dónde se aplica, y la semana, un día por fila (`tp-dias.component.ts`). Guardar y Deshacer, arriba, como en las fichas. Guardar un
 * horario que se usa en algún sitio lo dice antes, con la opción de guardar los cambios como una copia.
 */
@Component({
  selector: 'sc-tp-horario',
  imports: [ScButtonComponent, ScSectionCardComponent, ScSelectComponent, TooltipModule, TranslateModule, TpAvisosComponent, TpCabeDirective, TpDiasComponent, TpIconoComponent, TpModalComponent, TpSemanaComponent],
  templateUrl: './tp-horario.page.html',
  // Hojas globales repartidas por dueño: cada una cabe en el presupuesto de estilos por componente.
  styleUrls: ['./tp-base.scss', './tp-piezas.scss', './tp-capas.scss', './tp-semana.scss', './tp-dias.scss', './tp-cierre.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpHorarioPage implements OnInit {
  protected readonly t = T;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(HorariosStore);
  private readonly aplicado = inject(AplicadoEn);
  private readonly avisos = inject(TpAvisos);

  protected readonly tipos = TIPOS_DE_USO;
  /** La semana se edita en una lista de siete días; `?variante=columna` enseña la versión anterior (días que comparten horas y mapa), para comparar. */
  protected readonly columna = this.route.snapshot.queryParamMap.get('variante') === 'columna';
  protected readonly sitios = sitios;

  protected readonly modo = signal<'crear' | 'editar'>('crear');
  /** Con una prueba con personas en marcha, la barra de guardar deja sitio a la suya. */
  protected readonly enPrueba = pruebaEnCurso();
  protected readonly horarioId = signal<number | null>(null);
  protected readonly form = signal<Borrador>(VACIO);
  private readonly sucio = createFormDirtyState(() => this.form());
  protected readonly dirty = this.sucio.dirty;

  /** El reloj: la raya de «ahora» y el estado se mueven solos. */
  private readonly reloj = signal(new Date());
  /**
   * Sin botón de volver, se vuelve por la miga de pan, como en las demás fichas: «Horarios» lleva a la lista y el último
   * tramo dice el nombre guardado (al crear, «Nuevo horario»).
   */
  private readonly migas = inject(BreadcrumbService);
  private readonly nombreGuardado = computed(() => {
    const id = this.horarioId();
    return id === null ? null : (this.store.items().find((x) => x.id === id)?.name ?? null);
  });
  private readonly migaConNombre = effect(() => this.migas.nombrar(this.route, this.modo() === 'editar' ? this.nombreGuardado() : null));
  private readonly sinMiga = inject(DestroyRef).onDestroy(() => this.migas.nombrar(this.route, null));

  /** Guardar y Deshacer, en la barra de arriba, como en las demás fichas del Supervisor. */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    const id = setInterval(() => this.reloj.set(new Date()), 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
    useTopbarActions(this.topbarActions);
  }

  protected readonly ahora = computed(() => ahoraEn(this.form().timezone, this.reloj()));
  protected readonly ahoraSemana = computed(() => ({ dia: diaDeLaSemana(this.ahora().fecha), minutos: this.ahora().minutos }));

  /* ── Cabecera ─────────────────────────────────────────────────────────────────────────────────────────────────── */

  /**
   * Lo de ahora sale solo de la semana. El estado guardado («Inactivo») no cuenta: un horario no hace nada por sí mismo,
   * lo que se enciende o se apaga es dónde se aplica (el nodo del IVR, el canal). El campo sigue en los datos por
   * compatibilidad con lo que se migre.
   */
  protected readonly estado = computed(() => estadoDeHorario({ id: 0, ...soloSemana(this.form()), status: 'active' }, [], this.reloj()));
  /** «Ahora cerrado, abre a las 9:00»: lo de ahora, en una frase que lo dice. Un horario inactivo no tiene «ahora». */
  protected readonly ahoraTexto = computed(() => {
    const e = this.estado();
    if (e.clave === 'inactive') return null;
    return { abierto: e.clave === 'open', titulo: e.clave === 'open' ? 'abierto' : 'cerrado', detalle: enFrase(e.detalle) };
  });
  /**
   * Las horas a la semana, con hacia dónde se movieron: la cifra entra desde abajo si sube y desde arriba si baja. La
   * primera no se anima (`viva` es falso): solo cuenta lo que cambia.
   */
  protected readonly horasSemana = linkedSignal<number, { texto: string; minutos: number; baja: boolean; viva: boolean }>({
    source: () => minutosDeSemana(this.form().week),
    computation: (minutos, antes) => ({ texto: horas(minutos), minutos, baja: !!antes && minutos < antes.value.minutos, viva: !!antes }),
  });
  protected readonly faltaSemana = computed(() => validarSemana(this.form().week));
  /** La descripción no se escribe: sale de la semana y se guarda con ella, así nunca dice otra cosa que las horas. */
  protected readonly descripcion = computed(() => descripcionDe(this.form().week));
  /** La misma descripción en grupos de días, para pintarla con pesos distintos. */
  protected readonly resumen = computed(() => resumenDe(this.form().week));
  /** Los grupos que no caben en sus dos líneas: van en «+N». */
  protected readonly resumenFuera = signal(0);
  protected readonly verResumen = computed(() => `Ver ${this.resumenFuera()} más`);
  /** Las zonas que conoce el navegador, para el desplegable del DS (con buscador); la del horario siempre está. */
  protected readonly zonas = computed(() => {
    const conocidas = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
    return [...new Set([this.form().timezone, 'UTC', ...conocidas])].sort().map((z) => ({ value: z, label: z.replaceAll('_', ' ') }));
  });

  /* ── Dónde se aplica ──────────────────────────────────────────────────────────────────────────────────────────── */

  protected readonly usos = computed(() => this.aplicado.agrupados(this.horarioId()));
  protected readonly nUsos = computed(() => this.usos().reduce((n, g) => n + g.usos.length, 0));
  /** Los sitios en una lista, por tipo: en una línea, y los que no caben, en «+N». */
  protected readonly usosPlanos = computed(() => this.usos().flatMap((g) => g.usos));
  protected readonly usosFuera = signal(0);
  protected readonly verUsos = computed(() => `Ver ${this.usosFuera()} sitios más`);
  protected readonly avisoUsos = computed(() => `Si lo cambias, cambia en ${this.nUsos() === 1 ? 'ese sitio' : `los ${this.nUsos()}`}`);

  /** Un horario que no abre ningún día no se guarda: no serviría para nada. */
  protected readonly sinDias = computed(() => this.form().week.every((d) => !d?.length));
  protected readonly puedeGuardar = computed(
    () => !!this.form().name.trim() && !this.faltaSemana() && !this.sinDias() && (this.modo() === 'crear' || this.dirty()),
  );
  protected readonly motivo = computed(() =>
    !this.form().name.trim() ? 'Ponle un nombre' : this.sinDias() ? 'Abre al menos un día' : this.faltaSemana() ? 'Revisa la semana' : '',
  );

  /* ── Carga ────────────────────────────────────────────────────────────────────────────────────────────────────── */

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw === null || raw === 'nuevo' || raw === 'crear') {
      this.desdeCopia();
      this.sucio.markPristine();
      return;
    }
    const h = this.store.items().find((x) => x.id === Number(raw));
    if (!h) {
      void this.router.navigateByUrl(LISTA, { replaceUrl: true });
      return;
    }
    this.modo.set('editar');
    this.horarioId.set(h.id);
    const { id: _id, ...datos } = h;
    this.form.set(datos);
    this.sucio.markPristine();
  }

  /** Duplicar desde la lista es un alta (DD-234): `?seedFromId` abre «Nuevo horario» con la semana del original. */
  private desdeCopia(): void {
    const seed = this.route.snapshot.queryParamMap.get('seedFromId');
    const origen = seed ? this.store.items().find((h) => h.id === Number(seed)) : null;
    if (!origen) return;
    const { id: _id, ...datos } = origen;
    this.form.set({ ...datos, name: nombreDeCopia(origen.name, this.store.items().map((h) => h.name)) });
  }

  /** La lista de «+N» de la cabecera se abre hacia la izquierda si hacia la derecha se saldría del lienzo. */
  protected orientar(e: Event): void {
    const mas = e.currentTarget as HTMLElement;
    const pop = mas.querySelector<HTMLElement>('.tp-mas__pop');
    const lienzo = mas.closest<HTMLElement>('.tp-lienzo');
    if (!pop || !lienzo) return;
    mas.classList.toggle('tp-mas--fin', mas.getBoundingClientRect().left + pop.offsetWidth > lienzo.getBoundingClientRect().right);
  }

  /** Al crear: todos los días cerrados otra vez, como al empezar. Es un paso más de deshacer. */
  protected vaciarSemana(): void {
    if (this.sinDias()) return;
    this.update('week', VACIO.week);
    this.avisos.decir('Semana vacía. ⌘Z la devuelve.');
    // El botón se apaga con la semana vacía: el foco pasa al lunes, que es por donde se vuelve a empezar.
    setTimeout(() => document.querySelector<HTMLElement>('#tp-dia-0')?.focus());
  }

  protected update<K extends keyof Borrador>(key: K, value: Borrador[K]): void {
    this.apuntar(key);
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  /* ── Deshacer y rehacer: ⌘Z y ⇧⌘Z, paso a paso ──────────────────────────────────────────────────────────────────── */

  /** Lo que había antes de cada cambio. Un arrastre entero es un paso, y escribir el nombre de seguido, otro. */
  private readonly pasado = signal<readonly Borrador[]>([]);
  private readonly futuro = signal<readonly Borrador[]>([]);
  protected readonly puedeDeshacer = computed(() => this.pasado().length > 0);
  private enGesto = false;
  private ultimoCambio: { key: keyof Borrador; t: number } | null = null;

  private apuntar(key: keyof Borrador): void {
    if (this.enGesto) return;
    const ahora = Date.now();
    const seguido = this.ultimoCambio?.key === key && key === 'name' && ahora - this.ultimoCambio.t < 1500;
    this.ultimoCambio = { key, t: ahora };
    if (seguido) return;
    this.pasado.update((p) => [...p.slice(-49), this.form()]);
    this.futuro.set([]);
  }

  /** La semana avisa al empezar y al acabar un arrastre: todo lo de en medio es un paso. */
  protected gesto(empieza: boolean): void {
    if (empieza) {
      this.apuntar('week');
      this.enGesto = true;
      return;
    }
    this.enGesto = false;
    this.ultimoCambio = null;
    // Un arrastre cancelado (Esc) o que no movió nada no deja un paso vacío.
    const p = this.pasado();
    if (p.length && JSON.stringify(p[p.length - 1].week) === JSON.stringify(this.form().week)) this.pasado.set(p.slice(0, -1));
  }

  protected deshacer(): void {
    const p = this.pasado();
    if (!p.length) return;
    contarUso('deshacer');
    this.futuro.update((f) => [...f, this.form()]);
    this.form.set(p[p.length - 1]);
    this.pasado.set(p.slice(0, -1));
    this.ultimoCambio = null;
  }

  protected rehacer(): void {
    const f = this.futuro();
    if (!f.length) return;
    contarUso('rehacer');
    this.pasado.update((p) => [...p, this.form()]);
    this.form.set(f[f.length - 1]);
    this.futuro.set(f.slice(0, -1));
    this.ultimoCambio = null;
  }

  private olvidar(): void {
    this.pasado.set([]);
    this.futuro.set([]);
    this.ultimoCambio = null;
  }

  /* ── Guardar: si se usa en algún sitio, se dice antes ─────────────────────────────────────────────────────────── */

  protected readonly confirmando = signal(false);
  /** La salida que espera a que se confirme el guardado (Guardar y salir con el horario en uso). */
  private trasGuardar: ((v: boolean) => void) | null = null;

  private borrador(): Borrador {
    const f = this.form();
    return { ...f, name: f.name.trim(), description: (f.description ?? '').trim() };
  }

  protected save(): void {
    if (!this.puedeGuardar()) return;
    if (this.modo() === 'editar' && this.nUsos() > 0) {
      this.confirmando.set(true);
      return;
    }
    this.guardar();
  }

  protected guardar(): void {
    this.confirmando.set(false);
    const draft = this.borrador();
    if (this.modo() === 'crear') {
      const creado = this.store.addItem(draft);
      this.sucio.markPristine();
      void this.router.navigateByUrl(`${LISTA}/horario/${creado.id}`, { replaceUrl: true }).then(() => this.avisos.decir(`«${creado.name}» creado`));
      return;
    }
    this.store.updateItem(this.horarioId()!, draft);
    this.form.set(draft);
    this.sucio.markPristine();
    this.olvidar();
    this.avisos.decir(this.nUsos() > 0 ? `Cambios guardados en ${sitios(this.nUsos())}` : 'Cambios guardados');
    this.salirTrasGuardar(true);
  }

  /** Los cambios, en un horario nuevo que no se aplica en ningún sitio; el original queda como estaba. */
  protected guardarComoCopia(): void {
    this.confirmando.set(false);
    const original = this.store.items().find((h) => h.id === this.horarioId());
    const draft = this.borrador();
    const copia = this.store.addItem({ ...draft, name: nombreDeCopia(draft.name, this.store.items().map((h) => h.name)) });
    this.form.set(this.sucio.pristineValue());
    this.sucio.markPristine();
    this.olvidar();
    this.salirTrasGuardar(false);
    void this.router
      .navigateByUrl(`${LISTA}/horario/${copia.id}`)
      .then(() => this.avisos.decir(`«${copia.name}» creado. «${original?.name ?? draft.name}» sigue como estaba`));
  }

  protected cancelarGuardar(): void {
    this.confirmando.set(false);
    this.salirTrasGuardar(false);
  }

  private salirTrasGuardar(v: boolean): void {
    const ok = this.trasGuardar;
    this.trasGuardar = null;
    ok?.(v);
  }

  protected discard(): void {
    this.form.set(this.sucio.pristineValue());
    this.olvidar();
  }

  protected volver(): void {
    void this.router.navigateByUrl(LISTA);
  }

  /* ── Salir con cambios: lo pregunta la ruta (`tpSalirGuard`) ────────────────────────────────────────────────────── */

  protected readonly saliendo = signal<((v: boolean) => void) | null>(null);

  puedeSalir(): boolean | Promise<boolean> {
    if (!this.dirty() || this.modo() === 'crear') return true;
    return new Promise((ok) => this.saliendo.set(ok));
  }

  protected responderSalida(v: 'seguir' | 'descartar' | 'guardar'): void {
    const ok = this.saliendo();
    this.saliendo.set(null);
    if (!ok) return;
    if (v === 'guardar' && this.nUsos() > 0) {
      // Guardar y salir pasa por la misma confirmación: el aviso de a quién afecta no se salta.
      this.trasGuardar = ok;
      this.confirmando.set(true);
      return;
    }
    if (v === 'guardar') this.save();
    if (v === 'descartar') this.discard();
    ok(v !== 'seguir');
  }

  /* ── Teclado ──────────────────────────────────────────────────────────────────────────────────────────────────── */

  @HostListener('document:keydown', ['$event'])
  protected tecla(e: KeyboardEvent): void {
    if (!(e.metaKey || e.ctrlKey) || this.confirmando() || this.saliendo()) return;
    const k = e.key.toLowerCase();
    if (k === 's') {
      e.preventDefault();
      this.save();
      return;
    }
    // En un campo de texto, deshacer es el del campo; fuera, el de la pantalla.
    const t = e.target as HTMLElement | null;
    if (t?.matches('input:not([type=checkbox]):not([type=radio]), textarea, [contenteditable="true"]')) return;
    if ((k === 'z' && e.shiftKey) || k === 'y') {
      e.preventDefault();
      this.rehacer();
    } else if (k === 'z') {
      e.preventDefault();
      this.deshacer();
    }
  }
}

const DIA_ENTERO: Readonly<Record<string, string>> = { lun: 'el lunes', mar: 'el martes', mié: 'el miércoles', jue: 'el jueves', vie: 'el viernes', sáb: 'el sábado', dom: 'el domingo' };

/** «abre lun 09:00» del listado, dicho entero: «abre el lunes a las 9:00»; medianoche, con su nombre. */
function enFrase(detalle: string): string {
  if (detalle === 'siempre') return 'siempre';
  if (detalle === 'sin próximas horas') return 'sin horas para abrir';
  const m = /^(abre|cierra) (?:(.+) )?(\d{2}):(\d{2})$/.exec(detalle);
  if (!m) return detalle;
  const [, verbo, cuando, hh, mm] = m;
  const h = Number(hh);
  const dia = !cuando ? '' : cuando === 'mañana' ? 'mañana ' : `${DIA_ENTERO[cuando] ?? `el ${cuando}`} `;
  if ((h === 0 || h === 24) && mm === '00') return `${verbo} ${cuando === 'mañana' ? '' : dia}a medianoche`;
  return `${verbo} ${dia}${h === 1 ? 'a la' : 'a las'} ${h}:${mm}`;
}
