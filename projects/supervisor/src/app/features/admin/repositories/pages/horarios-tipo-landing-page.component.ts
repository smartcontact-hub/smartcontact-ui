import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, type TemplateRef, untracked, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  type LabelColor,
  ScAvatarComponent,
  ScButtonComponent,
  ScDrawerComponent,
  ScEmptyStateComponent,
  ScFactRowComponent,
  ScInputTextComponent,
  ScSearchComponent,
  ScSelectButtonComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { injectAlertModal, ResultadoAccionService } from '@core/services';
import { injectLangChange } from '@core/utils/lang-change';
import { nombreDeCopia } from '@shared/utils/copy-name';

import { HorarioSemanaComponent } from '../components/horario/horario-semana.component';
import { HorarioSemanaResumenComponent } from '../components/horario/horario-semana-resumen.component';
import { franjaDeLaSemana, type HorarioTipo, type MomentoDelDia, momentoDelDia, type Semana, textoDeFranja, validarSemana } from '../state/horarios.core.mjs';
import { HORARIOS_EN_EL_VUI } from '../state/horarios.semilla.mjs';
import { HorarioUsoService } from '../state/horario-uso.service';
import { HorariosTipoService } from '../state/horarios-tipo.service';
import { HorariosTipoStore } from '../state/horarios-tipo.store';

/** Los momentos del día en el orden en que se leen, y cómo se pintan: su icono y su tono de etiqueta del DS. */
const MOMENTOS = [
  { id: 'manana', icono: 'wb_sunny', tono: 'amber' },
  { id: 'tarde', icono: 'wb_twilight', tono: 'orange' },
  { id: 'noche', icono: 'dark_mode', tono: 'purple' },
  { id: 'madrugada', icono: 'nights_stay', tono: 'blue' },
  { id: 'todo', icono: 'all_inclusive', tono: 'gray' },
] as const satisfies readonly { id: Exclude<MomentoDelDia, 'ninguno'>; icono: string; tono: LabelColor }[];

type IdDeMomento = (typeof MOMENTOS)[number]['id'];
const TODOS = 'todos';
const LABORABLE = [[540, 1080]] as const;
/** La semana con la que arranca un horario nuevo: de lunes a viernes, de 9 a 18. */
const SEMANA_NUEVA: Semana = [LABORABLE, LABORABLE, LABORABLE, LABORABLE, LABORABLE, [], []];
const CLAVES_DIA = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

interface Tarjeta {
  readonly id: number;
  readonly nombre: string;
  readonly descripcion: string;
  readonly momento: IdDeMomento;
  readonly franja: string;
  readonly dias: string;
}

/**
 * La lista de horarios, por momento del día (experimento): mañana, tarde, noche y madrugada (y «24 horas» para los que cubren el
 * día entero), como el hub de Repositorios pero con otra tarjeta, para que se distingan: icono del momento, nombre y la franja
 * a la que afecta. Pulsar una tarjeta abre a la derecha un panel con todo lo del horario (su semana, dónde se usa) y desde él se
 * edita, se duplica o se elimina.
 */
@Component({
  selector: 'sc-horarios-tipo-landing-page',
  imports: [
    HorarioSemanaComponent,
    HorarioSemanaResumenComponent,
    RouterLink,
    ScAvatarComponent,
    ScButtonComponent,
    ScDrawerComponent,
    ScEmptyStateComponent,
    ScFactRowComponent,
    ScIconComponent,
    ScInputTextComponent,
    ScSearchComponent,
    ScSelectButtonComponent,
    TranslateModule,
  ],
  templateUrl: './horarios-tipo-landing-page.component.html',
  styleUrl: './horarios-tipo-landing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorariosTipoLandingPageComponent {
  private readonly store = inject(HorariosTipoStore);
  private readonly servicio = inject(HorariosTipoService);
  private readonly uso = inject(HorarioUsoService);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly resultado = inject(ResultadoAccionService);
  private readonly alertModal = injectAlertModal();
  private readonly lang = injectLangChange();

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
    // Un enlace desde fuera (el hub de Repositorios) puede traer el horario que se abre: `?abrir=3`.
    const abrir = Number(this.route.snapshot.queryParamMap.get('abrir'));
    if (abrir) this.seleccion.set(abrir);
    // Al cambiar de horario (o abrir uno nuevo), el borrador parte de lo guardado y la edición vuelve a estar contraída.
    effect(() => {
      const s = this.seleccion();
      untracked(() => {
        this.intento.set(false);
        if (s === 'nuevo') return;
        this.editando.set(false);
        this.borrador.set(this.desdeGuardado(s));
      });
    });
  }

  protected readonly query = signal('');
  protected readonly filtro = signal<string>(TODOS);
  /** El horario abierto en el panel; `'nuevo'` es el panel de alta (sin horario guardado). */
  protected readonly seleccion = signal<number | 'nuevo' | null>(null);

  /* ── Edición dentro del panel: contraída para un horario que ya existe, abierta para uno nuevo ─────────────────── */

  protected readonly editando = signal(false);
  protected readonly intento = signal(false);
  protected readonly borrador = signal<{ name: string; description: string; week: Semana }>({ name: '', description: '', week: SEMANA_NUEVA });

  private desdeGuardado(id: number | null): { name: string; description: string; week: Semana } {
    const h = this.store.items().find((x) => x.id === id);
    return h ? { name: h.name, description: h.description, week: h.week } : { name: '', description: '', week: SEMANA_NUEVA };
  }

  protected readonly faltaDeSemana = computed(() => validarSemana(this.borrador().week));
  protected readonly faltaElNombre = computed(() => !this.borrador().name.trim());
  private readonly sucio = computed(() => {
    const s = this.seleccion();
    if (s === 'nuevo') return true;
    const o = this.desdeGuardado(s);
    const b = this.borrador();
    return b.name !== o.name || b.description !== o.description || JSON.stringify(b.week) !== JSON.stringify(o.week);
  });
  protected readonly puedeGuardar = computed(() => !this.faltaElNombre() && !this.faltaDeSemana() && this.sucio());
  protected readonly cabecera = computed(() => this.panel()?.nombre ?? null);
  protected readonly abierto = computed(() => !!this.panel());

  protected cambiar(campo: 'name' | 'description' | 'week', valor: string | Semana): void {
    this.borrador.update((b) => ({ ...b, [campo]: valor }));
  }

  private t(clave: string, params?: Record<string, unknown>): string {
    return this.translate.instant(`repositories.horariosTipo.landing.${clave}`, params) as string;
  }

  /** «L–V», «S–D», «Todos los días»: los días que abre, en rachas. */
  private etiquetaDeDias(dias: readonly number[]): string {
    if (dias.length === 7) return this.t('every_day');
    const corto = (i: number): string => (this.translate.instant(`repositories.horarios.days_short.${CLAVES_DIA[i]}`) as string).replace(/\.$/, '');
    const rachas: string[] = [];
    for (let i = 0; i < dias.length; ) {
      let j = i;
      while (j + 1 < dias.length && dias[j + 1] === dias[j] + 1) j++;
      rachas.push(j > i ? `${corto(dias[i])}–${corto(dias[j])}` : corto(dias[i]));
      i = j + 1;
    }
    return rachas.join(', ');
  }

  /** El momento, la franja («09:00–18:00») y los días («L–V») de una semana; `null` si no abre ningún día. */
  private describir(week: Semana): { momento: IdDeMomento; franja: string; dias: string } | null {
    const momento = momentoDelDia(week);
    const franja = franjaDeLaSemana(week);
    if (momento === 'ninguno' || !franja) return null;
    return { momento, franja: momento === 'todo' ? this.t('all_day') : `${franja.desde}–${franja.hasta}`, dias: this.etiquetaDeDias(franja.dias) };
  }

  private readonly tarjetas = computed<readonly Tarjeta[]>(() => {
    this.lang();
    return this.store.items().flatMap((h) => {
      const d = this.describir(h.week);
      return d ? [{ id: h.id, nombre: h.name, descripcion: h.description, ...d }] : [];
    });
  });

  protected readonly opcionesFiltro = computed(() => {
    this.lang();
    const hay = new Set(this.tarjetas().map((c) => c.momento));
    return [
      { value: TODOS, label: this.t('filter_all') },
      ...MOMENTOS.filter((m) => m.id !== 'todo' || hay.has('todo')).map((m) => ({ value: m.id, label: this.t(m.id) })),
    ];
  });

  /** Una sección por momento con sus tarjetas, tras el filtro y el buscador; las vacías no salen. */
  protected readonly secciones = computed(() => {
    this.lang();
    const q = this.query().trim().toLowerCase();
    const filtro = this.filtro();
    return MOMENTOS.filter((m) => filtro === TODOS || filtro === m.id)
      .map((m) => ({
        id: m.id,
        titulo: this.t(m.id),
        icono: m.icono,
        tono: m.tono,
        cards: this.tarjetas().filter((c) => c.momento === m.id && (!q || `${c.nombre} ${c.descripcion}`.toLowerCase().includes(q))),
      }))
      .filter((s) => s.cards.length > 0);
  });

  /** La semana como filas: cada grupo de días con sus tramos («Lun–Vie · 09:00–18:00»); sin tramos, cerrado. */
  private filasDeSemana(week: Semana): readonly { etiqueta: string; tramos: readonly string[] }[] {
    const nombre = (i: number): string => (this.translate.instant(`repositories.horarios.days.${CLAVES_DIA[i]}`) as string).slice(0, 3);
    const grupos: { desde: number; hasta: number; franjas: Semana[number] }[] = [];
    for (let d = 0; d < 7; d++) {
      const franjas = week[d] ?? [];
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && JSON.stringify(ultimo.franjas) === JSON.stringify(franjas)) ultimo.hasta = d;
      else grupos.push({ desde: d, hasta: d, franjas });
    }
    return grupos.map((g) => ({
      etiqueta: g.desde === g.hasta ? nombre(g.desde) : `${nombre(g.desde)}–${nombre(g.hasta)}`,
      tramos: g.franjas.map((f) => textoDeFranja(f)),
    }));
  }

  /** ¿Está el panel en modo edición? Un horario nuevo, siempre; uno que existe, tras «Editar». */
  protected readonly edicion = computed(() => this.seleccion() === 'nuevo' || this.editando());

  /** Todo lo del horario abierto en el panel. En edición, lo que se enseña (momento, franja, semana) es lo del borrador, en vivo. */
  protected readonly panel = computed(() => {
    this.lang();
    const id = this.seleccion();
    const guardado: HorarioTipo | undefined = typeof id === 'number' ? this.store.items().find((x) => x.id === id) : undefined;
    if (!guardado && id !== 'nuevo') return null;
    const week = this.edicion() ? this.borrador().week : guardado!.week;
    const d = this.describir(week) ?? { momento: 'manana' as IdDeMomento, franja: '', dias: '' };
    const momento = MOMENTOS.find((m) => m.id === d.momento)!;
    const calendarios = guardado ? this.servicio.usos(guardado.id) : [];
    const grupos = this.uso.grupos(new Set(calendarios.map((u) => u.calendario.id)));
    return {
      id: guardado?.id ?? null,
      nombre: guardado?.name ?? this.t('new_title'),
      descripcion: guardado?.description ?? '',
      filas: this.filasDeSemana(week),
      franja: d.franja,
      dias: d.dias,
      momento: this.t(momento.id),
      icono: momento.icono,
      tono: momento.tono,
      calendarios: calendarios.map((u) => ({ id: u.calendario.id, nombre: u.calendario.name })),
      grupos: grupos.map((g) => g.name),
      vui: guardado ? HORARIOS_EN_EL_VUI.has(guardado.id) : false,
    };
  });

  protected abrir(id: number): void {
    this.seleccion.update((s) => (s === id ? null : id));
  }

  protected cerrar(): void {
    this.seleccion.set(null);
  }

  /** «Nuevo horario»: el panel de alta, con el formulario ya abierto. */
  protected nuevo(): void {
    this.borrador.set({ name: '', description: '', week: SEMANA_NUEVA });
    this.editando.set(true);
    this.seleccion.set('nuevo');
  }

  /** «Editar»: abre la edición del panel. */
  protected editar(): void {
    this.editando.set(true);
  }

  /** «Duplicar»: el panel de alta con una copia del horario y un nombre que no se repite. */
  protected duplicar(id: number): void {
    const h = this.store.items().find((x) => x.id === id);
    if (!h) return;
    this.seleccion.set('nuevo');
    this.borrador.set({ name: nombreDeCopia(h.name, this.store.items().map((x) => x.name)), description: h.description, week: h.week });
    this.editando.set(true);
  }

  protected cancelar(): void {
    if (this.seleccion() === 'nuevo') {
      this.seleccion.set(null);
      return;
    }
    this.borrador.set(this.desdeGuardado(this.seleccion() as number));
    this.intento.set(false);
    this.editando.set(false);
  }

  protected guardar(): void {
    if (this.faltaElNombre() || this.faltaDeSemana()) {
      this.intento.set(true);
      return;
    }
    if (!this.puedeGuardar()) return;
    const b = this.borrador();
    const datos = { name: b.name.trim(), description: b.description.trim() };
    if (this.seleccion() === 'nuevo') {
      const creado = this.store.addItem({ ...datos, week: b.week });
      this.seleccion.set(creado.id);
      this.resultado.contar(this.translate.instant('repositories.horariosTipo.toasts.created', { name: creado.name }));
      return;
    }
    const id = this.seleccion() as number;
    this.store.updateItem(id, datos);
    // La semana nueva llega, además, a todos los calendarios que usan este horario.
    this.servicio.actualizarSemana(id, b.week);
    this.editando.set(false);
    this.resultado.contar(this.translate.instant('repositories.horariosTipo.toasts.updated', { name: datos.name }));
  }

  protected async eliminar(id: number): Promise<void> {
    const h = this.store.items().find((x) => x.id === id);
    if (!h) return;
    // Si lo usan calendarios, el aviso lo dice: se quedan con su semana pero sin vínculo.
    const aviso = this.servicio.aviso([id]);
    const confirmado = await this.alertModal({
      variant: 'error',
      surface: 'plain',
      title: this.translate.instant('repositories.horariosTipo.delete_dialog.title', { name: h.name }),
      message: [aviso, this.translate.instant('common.delete_dialog.body')].filter(Boolean).join(' '),
      actionLabel: this.translate.instant('common.delete'),
      secondaryActionLabel: this.translate.instant('common.cancel'),
    });
    if (!confirmado) return;
    this.servicio.soltar([id]);
    this.store.deleteItem(id);
    this.seleccion.set(null);
    this.resultado.contar(this.translate.instant('repositories.horariosTipo.toasts.deleted', { name: h.name }));
  }
}
