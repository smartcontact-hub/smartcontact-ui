import { ChangeDetectionStrategy, Component, computed, inject, signal, type TemplateRef, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  type LabelColor,
  ScAvatarComponent,
  ScButtonComponent,
  ScDrawerComponent,
  ScEmptyStateComponent,
  ScSearchComponent,
  ScSelectButtonComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { injectAlertModal, ResultadoAccionService } from '@core/services';
import { injectLangChange } from '@core/utils/lang-change';

import { HorarioSemanaResumenComponent } from '../components/horario/horario-semana-resumen.component';
import { franjaDeLaSemana, type HorarioTipo, type MomentoDelDia, momentoDelDia } from '../state/horarios.core.mjs';
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
    HorarioSemanaResumenComponent,
    RouterLink,
    ScAvatarComponent,
    ScButtonComponent,
    ScDrawerComponent,
    ScEmptyStateComponent,
    ScIconComponent,
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
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly resultado = inject(ResultadoAccionService);
  private readonly alertModal = injectAlertModal();
  private readonly lang = injectLangChange();

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly query = signal('');
  protected readonly filtro = signal<string>(TODOS);
  protected readonly seleccion = signal<number | null>(null);

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

  private readonly tarjetas = computed<readonly Tarjeta[]>(() => {
    this.lang();
    return this.store.items().flatMap((h) => {
      const momento = momentoDelDia(h.week);
      const franja = franjaDeLaSemana(h.week);
      if (momento === 'ninguno' || !franja) return [];
      return [
        {
          id: h.id,
          nombre: h.name,
          descripcion: h.description,
          momento,
          franja: momento === 'todo' ? this.t('all_day') : `${franja.desde}–${franja.hasta}`,
          dias: this.etiquetaDeDias(franja.dias),
        },
      ];
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

  /** Todo lo del horario abierto en el panel. */
  protected readonly panel = computed(() => {
    this.lang();
    const id = this.seleccion();
    const h: HorarioTipo | undefined = this.store.items().find((x) => x.id === id);
    const tarjeta = this.tarjetas().find((c) => c.id === id);
    if (!h || !tarjeta) return null;
    const momento = MOMENTOS.find((m) => m.id === tarjeta.momento)!;
    const calendarios = this.servicio.usos(h.id);
    const grupos = this.uso.grupos(new Set(calendarios.map((u) => u.calendario.id)));
    return {
      id: h.id,
      nombre: h.name,
      descripcion: h.description,
      semana: h.week,
      franja: tarjeta.franja,
      dias: tarjeta.dias,
      momento: this.t(momento.id),
      icono: momento.icono,
      tono: momento.tono,
      calendarios: calendarios.map((u) => ({ id: u.calendario.id, nombre: u.calendario.name })),
      grupos: grupos.map((g) => g.name),
      vui: HORARIOS_EN_EL_VUI.has(h.id),
    };
  });

  protected abrir(id: number): void {
    this.seleccion.update((s) => (s === id ? null : id));
  }

  protected cerrar(): void {
    this.seleccion.set(null);
  }

  protected nuevo(): void {
    void this.router.navigateByUrl('/admin/horarios-tipo/crear');
  }

  protected editar(id: number): void {
    void this.router.navigateByUrl(`/admin/horarios-tipo/editar/${id}`);
  }

  protected duplicar(id: number): void {
    void this.router.navigate(['/admin/horarios-tipo/crear'], { queryParams: { seedFromId: id } });
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
