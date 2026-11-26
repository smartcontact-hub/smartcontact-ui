import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, HostListener, inject, linkedSignal, type OnInit, signal, type TemplateRef, viewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ScAlertModalComponent,
  ScBadgeComponent,
  ScButtonComponent,
  ScDynamicDialogService,
  ScInlineRenameCellComponent,
  ScSectionCardComponent,
  ScSelectComponent,
  ScTagComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { TooltipModule } from 'primeng/tooltip';

import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { pruebaEnCurso } from '@core/prueba/prueba-arranque';
import { BreadcrumbService, DiscardDialogService, ResultadoAccionService } from '@core/services';

import { ahoraEn, diaDeLaSemana, type Horario, validarSemana } from '@features/admin/repositories/state/horarios.core.mjs';
import { HorariosStore } from '@features/admin/repositories/state/horarios.store';
import { ChannelIconComponent } from '@shared/components';
import { nombreDeCopia } from '@shared/utils/copy-name';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';

import { estadoDeHorario } from '../horarios/lab-horarios-estado';
import { AplicadoEn, sitios, TIPOS_DE_USO } from './tp-aplicado';
import { TpDiasComponent } from './tp-dias.component';
import { descripcionDe, horas, minutosDeSemana, resumenDe, soloSemana } from './tp-modelo';
import { TpCabeDirective } from './tp-cabe.directive';
import { TpAvisosComponent } from './tp-piezas';
import { TpSemanaComponent } from './tp-semana.component';
import { T } from './tp-textos';
import { contarUso } from './tp-usos';

type Borrador = Omit<Horario, 'id'>;
/** Lo que se escribe en la cabecera, con el renombrado en el sitio del DS. */
type Texto = 'name' | 'description';
/** Lo más larga que es una descripción: una línea bajo el nombre. */
const MAX_DESCRIPCION = 160;

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
  imports: [ChannelIconComponent, ScBadgeComponent, ScButtonComponent, ScIconComponent, ScInlineRenameCellComponent, ScSectionCardComponent, ScSelectComponent, ScTagComponent, TooltipModule, TranslateModule, TpAvisosComponent, TpCabeDirective, TpDiasComponent, TpSemanaComponent],
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
  /** El resultado de guardar o crear, en el toast del sistema (DD-211 §5), el mismo en toda la app. */
  private readonly resultado = inject(ResultadoAccionService);
  private readonly translate = inject(TranslateService);
  /** Los avisos del Supervisor: `sc-alert-modal` (DD-241), abierto como lo abren los devs. */
  private readonly dialogos = inject(ScDynamicDialogService);
  private readonly descartar = inject(DiscardDialogService);

  protected readonly tipos = TIPOS_DE_USO;
  /** El icono del DS de cada tipo de sitio; WhatsApp lleva su logo (`sc-channel-icon`), que Material no tiene. */
  protected readonly simbolos: Readonly<Record<keyof typeof TIPOS_DE_USO, string | null>> = { servicio: 'call', grupo: 'group', whatsapp: null, calendario: 'calendar_month' };
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
    return { abierto: e.clave === 'open', detalle: enFrase(e.detalle) };
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
  /** Los sitios que no caben, en una frase para el lector (el tooltip no se lee). */
  protected readonly restoDeUsos = computed(() =>
    this.usosPlanos()
      .slice(this.usosPlanos().length - this.usosFuera())
      .map((u) => `${u.nombre}, ${this.tipos[u.tipo].uno.toLowerCase()}`)
      .join('; '),
  );
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
      // Al crear (o duplicar), el nombre empieza abierto y elegido entero: es lo primero que se escribe.
      this.editar('name');
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

  /** Al crear: todos los días cerrados otra vez, como al empezar. Es un paso más de deshacer. */
  protected vaciarSemana(): void {
    if (this.sinDias()) return;
    this.update('week', VACIO.week);
    this.resultado.contar('Semana vaciada: ⌘Z la devuelve');
    // El botón se apaga con la semana vacía: el foco pasa al lunes, que es por donde se vuelve a empezar.
    setTimeout(() => document.querySelector<HTMLElement>('#tp-dia-0')?.focus());
  }

  /* ── El nombre y la descripción, con el renombrado en el sitio del DS ─────────────────────────────────────────── */

  /** Lo que está abierto en su campo, si algo; lo de antes de abrirlo, para que Esc lo devuelva. */
  protected readonly editando = signal<Texto | null>(null);
  private antesDeEditar = '';

  protected editar(campo: Texto): void {
    this.antesDeEditar = this.form()[campo] ?? '';
    this.editando.set(campo);
    // El campo del DS se enfoca al abrirse, pero elige el texto antes de tenerlo (su valor llega un instante después):
    // se elige aquí, para que escribir lo cambie entero como promete.
    setTimeout(() => document.querySelector<HTMLInputElement>(`[data-texto="${campo}"] sc-inline-rename-cell input`)?.select());
  }

  /** Lo escrito cuenta mientras se escribe: «Guardar» y su motivo lo ven sin esperar a Intro. */
  protected enVivo(campo: Texto, e: Event): void {
    if (this.editando() !== campo) return;
    const valor = (e.target as HTMLInputElement).value;
    this.update(campo, campo === 'description' ? valor.slice(0, MAX_DESCRIPCION) : valor);
  }

  /** Intro o ✓: se queda lo escrito (sin espacios a los lados) y el foco vuelve al texto. */
  protected cerrarEdicion(campo: Texto, valor: string): void {
    this.dejar(campo, valor);
    this.enfocarTexto(campo);
  }

  /** Esc o ×: vuelve lo de antes de abrirlo. */
  protected cancelarEdicion(campo: Texto): void {
    this.dejar(campo, this.antesDeEditar);
    this.enfocarTexto(campo);
  }

  /** Salir del campo con el ratón o con Tab se queda con lo escrito; un nombre vacío no vale y vuelve el de antes. */
  protected salir(campo: Texto, e: FocusEvent): void {
    // Solo cuenta salir del campo: el texto que lo abre también pierde el foco al irse, y eso no es salir.
    if (this.editando() !== campo || !(e.target as HTMLElement).closest('sc-inline-rename-cell')) return;
    if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) return;
    const escrito = (this.form()[campo] ?? '').trim();
    this.dejar(campo, campo === 'name' && !escrito && this.modo() === 'editar' ? this.antesDeEditar : escrito);
  }

  private dejar(campo: Texto, valor: string): void {
    const limpio = valor.trim().slice(0, campo === 'description' ? MAX_DESCRIPCION : undefined);
    if ((this.form()[campo] ?? '') !== limpio) this.update(campo, limpio);
    this.editando.set(null);
  }

  private enfocarTexto(campo: Texto): void {
    setTimeout(() => document.querySelector<HTMLElement>(`.tp-cierre__editable[data-campo="${campo}"]`)?.focus());
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
    const seguido = this.ultimoCambio?.key === key && (key === 'name' || key === 'description') && ahora - this.ultimoCambio.t < 1500;
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

  /** Con el aviso de guardar abierto, ⌘S no guarda por detrás. */
  protected readonly confirmando = signal(false);

  private borrador(): Borrador {
    const f = this.form();
    return { ...f, name: f.name.trim(), description: (f.description ?? '').trim() };
  }

  protected save(): void {
    if (!this.puedeGuardar() || this.confirmando()) return;
    if (this.modo() === 'editar' && this.nUsos() > 0) {
      void this.preguntarGuardado();
      return;
    }
    this.guardar();
  }

  /**
   * Guardar un horario que se usa lo pregunta antes, con el aviso del Supervisor (`sc-alert-modal` `info` en blanco, como
   * al salir de la ficha de horario hacia Festivos): a cuántos sitios afecta y cuáles. El tercer botón, a la izquierda,
   * guarda los cambios como un horario nuevo y deja este como estaba.
   */
  private preguntarGuardado(): Promise<void> {
    this.confirmando.set(true);
    const nombres = this.usosPlanos().map((u) => u.nombre);
    const lista = nombres.length > 3 ? `${nombres.slice(0, 3).join(', ')} y ${nombres.length - 3} más` : enLista(nombres);
    return new Promise((hecho) => {
      const ref = this.dialogos.open<ScAlertModalComponent, unknown, Record<string, unknown>, 'action' | 'tertiary' | 'closed'>(ScAlertModalComponent, {
        // El diálogo de PrimeNG que lo envuelve toma el ancho del texto sin partir: con un mensaje largo crece más que
        // el aviso (que se para en su máximo) y lo deja descentrado. Con el mismo ancho que el aviso, queda centrado.
        width: 'var(--sc-alert-modal-max-width)',
        inputValues: {
          variant: 'info',
          surface: 'plain',
          title: `¿Guardar los cambios en ${sitios(this.nUsos())}?`,
          message: escapar(`Se aplica en ${lista}. Todos pasan a usar las horas nuevas en cuanto guardes.`),
          actionLabel: this.translate.instant('common.save'),
          secondaryActionLabel: this.translate.instant('common.cancel'),
          tertiaryActionLabel: 'Guardar como copia',
          closeRequested: () => ref.close('closed'),
          actionRequested: () => ref.close('action'),
          tertiaryActionRequested: () => ref.close('tertiary'),
        },
      });
      ref.onClose.subscribe((r) => {
        this.confirmando.set(false);
        if (r === 'action') this.guardar();
        if (r === 'tertiary') this.guardarComoCopia();
        hecho();
      });
    });
  }

  protected guardar(): void {
    const draft = this.borrador();
    if (this.modo() === 'crear') {
      const creado = this.store.addItem(draft);
      this.sucio.markPristine();
      void this.router
        .navigateByUrl(`${LISTA}/horario/${creado.id}`, { replaceUrl: true })
        .then(() => this.resultado.contar(this.translate.instant('repositories.horarios.toasts.created', { name: creado.name })));
      return;
    }
    this.store.updateItem(this.horarioId()!, draft);
    this.form.set(draft);
    this.sucio.markPristine();
    this.olvidar();
    this.resultado.contar(this.translate.instant('repositories.horarios.toasts.updated', { name: draft.name }));
  }

  /** Los cambios, en un horario nuevo que no se aplica en ningún sitio; el original queda como estaba. */
  protected guardarComoCopia(): void {
    const draft = this.borrador();
    const copia = this.store.addItem({ ...draft, name: nombreDeCopia(draft.name, this.store.items().map((h) => h.name)) });
    this.form.set(this.sucio.pristineValue());
    this.sucio.markPristine();
    this.olvidar();
    void this.router
      .navigateByUrl(`${LISTA}/horario/${copia.id}`)
      .then(() => this.resultado.contar(this.translate.instant('repositories.horarios.toasts.created', { name: copia.name })));
  }

  protected discard(): void {
    this.form.set(this.sucio.pristineValue());
    this.olvidar();
  }

  protected volver(): void {
    void this.router.navigateByUrl(LISTA);
  }

  /* ── Salir con cambios: lo pregunta la ruta (`tpSalirGuard`), con el aviso de descartar de todas las fichas ──────── */

  puedeSalir(): boolean | Promise<boolean> {
    if (!this.dirty() || this.modo() === 'crear') return true;
    return this.descartar.confirm();
  }

  /* ── Teclado ──────────────────────────────────────────────────────────────────────────────────────────────────── */

  @HostListener('document:keydown', ['$event'])
  protected tecla(e: KeyboardEvent): void {
    if (!(e.metaKey || e.ctrlKey) || this.confirmando()) return;
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

/** «A, B y C»: una lista corta, como se dice. */
function enLista(nombres: readonly string[]): string {
  return nombres.length < 2 ? (nombres[0] ?? '') : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

/** El mensaje del aviso va como HTML (`innerHTML`): los nombres de los sitios, escapados. */
function escapar(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
