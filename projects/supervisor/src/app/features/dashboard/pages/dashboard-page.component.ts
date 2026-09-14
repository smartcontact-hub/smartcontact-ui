import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  HostListener,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MenuModule } from 'primeng/menu';
import { PopoverModule } from 'primeng/popover';
import { ToolbarModule } from 'primeng/toolbar';
import type { MenuItem } from 'primeng/api';
import { ScBadgeComponent as BadgeComponent, ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';
import { SC_ICON_SIZE_DEFAULT, ScIconComponent as IconComponent } from '@smartcontact-hub/icons';

import { LanguageService } from '@core/services/language.service';
import { UndoStackService } from '@core/services/undo-stack.service';
import { injectLangChange } from '@core/utils/lang-change';

import { AnimateOnChangeDirective } from '../components/animate-on-change.directive';
import { DetailDrawerComponent } from '../components/detail-drawer/detail-drawer.component';
import { EmptySlotComponent } from '../components/empty-slot/empty-slot.component';
import { MonitorTabsComponent } from '../components/monitor-tabs/monitor-tabs.component';
import { WidgetAssistantComponent } from '../components/widget-assistant/widget-assistant.component';
import { WidgetCardComponent } from '../components/widget-card/widget-card.component';
import { WidgetViewComponent, type DetailOpen } from '../components/widget-view/widget-view.component';
import { alertFor, type WidgetAlert } from '../data/alerts';
import { applyFilter } from '../data/apply-filter';
import type { DashboardBox, DashboardWidget, WidgetFilter } from '../data/dashboard.types';
import type { DetailRequest } from '../data/detail';
import { typeTitleKey, widgetType, type WidgetSize } from '../data/widget-catalog';
import { DashboardStore, slotSize, type SlotRef } from '../state/dashboard.store';

/** Cada cuánto late la demo. El original refresca cada 60 s; aquí más corto para que se vea vivo. */
const LIVE_TICK_MS = 8000;
/** Mientras dura la entrada escalonada de la primera carga. Después, lo que entra lo hace sin espera. */
const INTRO_MS = 1200;
/** Segundos por monitor en el carrusel. El original trae 20 por defecto (`carousel_timeout`). */
const CAROUSEL_OPTIONS = [10, 20, 30, 60] as const;
/** Cuánto tardan en esconderse los controles del modo pared sin mover el ratón. */
const WALL_IDLE_MS = 3000;
/** Ancho de referencia del modo pared: por encima, todo se amplía en proporción (hasta ×1,8). */
const WALL_BASE_WIDTH = 1440;

interface DragData {
  readonly ref: SlotRef;
  readonly size: WidgetSize;
}

interface MonitorAlert {
  /** Identidad de la alerta para marcarla vista: monitor, widget, nivel y motivo (no la cifra). */
  readonly key: string;
  readonly seen: boolean;
  readonly monitorId: string;
  readonly monitorName: string;
  readonly widgetId: string;
  readonly widget: DashboardWidget;
  readonly alert: WidgetAlert;
}

/**
 * Dashboard: la home del Supervisor, adaptada del «Monitor» de la app real.
 *
 * Varios monitores en pestañas, cada uno con cuatro cajas; widgets que se crean y editan con un
 * asistente, se arrastran entre huecos del mismo tamaño y se filtran por canal. Encima de lo que
 * hace el original: alertas por umbral, detalle al pulsar una cifra, deshacer al quitar, y un modo
 * pared a pantalla completa con carrusel. La disposición se guarda en el navegador
 * (`DashboardStore`); las cifras son de demostración y laten cada pocos segundos.
 */
@Component({
  selector: 'sc-dashboard-page',
  imports: [
    TranslateModule,
    MenuModule,
    PopoverModule,
    ToolbarModule,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    BadgeComponent,
    ButtonComponent,
    IconComponent,
    AnimateOnChangeDirective,
    DetailDrawerComponent,
    EmptySlotComponent,
    MonitorTabsComponent,
    WidgetAssistantComponent,
    WidgetCardComponent,
    WidgetViewComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly undoStack = inject(UndoStackService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly lang = injectLangChange();
  protected readonly store = inject(DashboardStore);

  protected readonly typeTitleKey = typeTitleKey;
  /** En pantalla táctil, arrastrar espera un toque largo: si no, deslizar para hacer scroll movería widgets. */
  protected readonly dragDelay = { touch: 300, mouse: 0 };
  protected readonly iconSize = SC_ICON_SIZE_DEFAULT;

  // ─── Lo que se ve ───

  /** El monitor activo con cada widget ya filtrado y su alerta. */
  protected readonly view = computed(() => {
    const m = this.store.active();
    if (!m) return null;
    return {
      ...m,
      boxes: m.boxes.map((box) => ({
        ...box,
        slots: box.slots.map((w) => {
          if (!w) return null;
          const shown = applyFilter(w);
          return { widget: shown, alert: alertFor(shown) };
        }),
      })),
    };
  });

  /** Alertas de TODOS los monitores: una cola se desborda aunque no estés mirando su monitor. */
  protected readonly alerts = computed<MonitorAlert[]>(() => {
    const seen = this.store.seenAlerts();
    return this.store.monitors().flatMap((m) =>
      m.boxes.flatMap((box) =>
        box.slots.flatMap((w) => {
          if (!w) return [];
          const alert = alertFor(applyFilter(w));
          if (!alert) return [];
          const key = `${m.id}|${w.id}|${alert.level}|${alert.reasonKey}`;
          return [{ key, seen: seen.has(key), monitorId: m.id, monitorName: m.name, widgetId: w.id, widget: w, alert }];
        }),
      ),
    );
  });
  /** Las que aún no has visto: son las que encienden la campana. */
  protected readonly unseenAlerts = computed(() => this.alerts().filter((a) => !a.seen));
  protected readonly alertLevel = computed(() => {
    const unseen = this.unseenAlerts();
    return unseen.some((a) => a.alert.level === 'danger') ? 'danger' : unseen.length ? 'warning' : null;
  });

  protected readonly intro = signal(true);
  private readonly updatedAt = signal(new Date());
  protected readonly updatedAtLabel = computed(() =>
    new Intl.DateTimeFormat(this.language.locale(), { timeStyle: 'medium' }).format(this.updatedAt()),
  );

  /** Widget recién elegido desde la lista de alertas: parpadea un momento para encontrarlo. */
  protected readonly flashId = signal<string | null>(null);

  // ─── Asistente ───

  protected readonly assistantOpen = signal(false);
  protected readonly assistantTarget = signal<SlotRef | null>(null);
  protected readonly assistantEditing = signal<DashboardWidget | null>(null);
  protected readonly assistantSize = computed<WidgetSize>(() => {
    const t = this.assistantTarget();
    const box = t ? this.store.active()?.boxes[t.box] : null;
    return box ? slotSize(box) : 'small';
  });

  // ─── Detalle ───

  protected readonly detail = signal<DetailRequest | null>(null);
  protected readonly detailWidget = computed(() => {
    const d = this.detail();
    if (!d) return null;
    for (const box of this.view()?.boxes ?? []) for (const s of box.slots) if (s?.widget.id === d.widgetId) return s.widget;
    return null;
  });

  // ─── Carrusel y modo pared ───

  protected readonly carouselOptions = CAROUSEL_OPTIONS;
  protected readonly carouselSeconds = signal<number>(20);
  protected readonly carouselRunning = signal(false);
  protected readonly canRotate = computed(() => this.store.monitors().length > 1);
  protected readonly wall = signal(false);
  protected readonly wallControlsVisible = signal(true);
  protected readonly wallZoom = signal(1);
  private carouselTimer: ReturnType<typeof setTimeout> | null = null;
  private wallIdleTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly carouselMenu = computed<MenuItem[]>(() => {
    this.lang();
    return [
      {
        label: this.translate.instant('dashboard.carousel.every'),
        items: CAROUSEL_OPTIONS.map((s) => ({
          label: this.translate.instant('dashboard.carousel.seconds', { s }),
          icon: `sc-icon-font sc-icon-font--${s === this.carouselSeconds() ? 'radio_button_checked' : 'radio_button_unchecked'}`,
          command: () => this.carouselSeconds.set(s),
        })),
      },
    ];
  });

  constructor() {
    const live = setInterval(() => {
      this.store.tick();
      this.updatedAt.set(new Date());
    }, LIVE_TICK_MS);
    // Cada vez que cambia el monitor (a mano o por el carrusel), sus widgets entran escalonados.
    let intro: ReturnType<typeof setTimeout> | undefined;
    effect(() => {
      this.store.activeId();
      this.intro.set(true);
      clearTimeout(intro);
      intro = setTimeout(() => this.intro.set(false), INTRO_MS);
    });

    // El carrusel reprograma el siguiente paso cada vez que cambia el monitor, el ritmo o el estado:
    // si eliges una pestaña a mano, el contador vuelve a empezar desde ahí.
    effect(() => {
      const running = this.carouselRunning() && this.canRotate();
      const seconds = this.carouselSeconds();
      this.store.activeId();
      this.clearCarousel();
      if (running) this.carouselTimer = setTimeout(() => this.store.selectOffset(1), seconds * 1000);
    });

    // Una alerta que se resuelve deja de estar «vista»: si vuelve a pasar, tiene que avisar.
    effect(() => {
      const active = new Set(this.alerts().map((a) => a.key));
      untracked(() => this.store.forgetResolved(active));
    });

    const onFullscreen = () => {
      if (!document.fullscreenElement && this.wall()) this.exitWall();
    };
    document.addEventListener('fullscreenchange', onFullscreen);

    inject(DestroyRef).onDestroy(() => {
      clearInterval(live);
      clearTimeout(intro);
      this.clearCarousel();
      if (this.wallIdleTimer) clearTimeout(this.wallIdleTimer);
      document.removeEventListener('fullscreenchange', onFullscreen);
    });
  }

  protected titleOf(w: DashboardWidget): string {
    return w.title ?? this.translate.instant(typeTitleKey(w.type));
  }

  /** Retardo de entrada de un hueco: por caja y, dentro de una caja partida, por hueco. */
  protected enterDelay(boxIndex: number, slotIndex: number): string {
    return this.intro() ? `${boxIndex * 90 + slotIndex * 60}ms` : '0ms';
  }

  // ─── Monitores ───

  protected addMonitor(): void {
    this.store.addMonitor(this.translate.instant('dashboard.tabs.new_name'));
  }

  protected duplicateMonitor(id: string): void {
    this.store.duplicate(id, this.translate.instant('dashboard.tabs.copy_suffix'));
  }

  protected removeMonitor(id: string): void {
    const removed = this.store.remove(id);
    if (!removed) return;
    const { monitor, index } = removed;
    this.undoStack.push(
      this.translate.instant('dashboard.toast.monitor_removed', { name: monitor.name }),
      monitor.name,
      () => this.store.restore(monitor, index),
    );
  }

  // ─── Widgets ───

  protected updateFilter(ref: SlotRef, filter: WidgetFilter): void {
    const w = this.store.widgetAt(ref);
    if (w) this.store.place(ref, { ...w, filter });
  }

  /** Quitar no pregunta: se deshace desde el aviso o con Ctrl+Z, que es más rápido que confirmar. */
  protected removeWidget(ref: SlotRef): void {
    const removed = this.store.widgetAt(ref);
    if (!removed) return;
    const monitorId = this.store.activeId();
    this.store.place(ref, null);
    const title = this.titleOf(removed);
    this.undoStack.push(this.translate.instant('dashboard.toast.removed', { title }), title, () => {
      // Vuelve a su monitor y a su hueco, si sigue libre y la caja no ha cambiado de forma.
      this.store.select(monitorId);
      if (this.store.widgetAt(ref) === null) this.store.place(ref, removed);
    });
  }

  protected openAssistant(ref: SlotRef, editing: DashboardWidget | null = null): void {
    this.assistantTarget.set(ref);
    this.assistantEditing.set(editing);
    this.assistantOpen.set(true);
  }

  protected saveWidget(widget: DashboardWidget): void {
    const ref = this.assistantTarget();
    if (ref) this.store.place(ref, widget);
  }

  /** «Juntar» sale una vez por caja, en su primer hueco: en los cuatro era ruido. */
  protected splitActionFor(box: { layout: DashboardBox['layout']; slots: readonly unknown[] }, slotIndex: number): 'split' | 'gather' | null {
    if (box.slots.some((slot) => slot !== null)) return null;
    if (box.layout === 'single') return 'split';
    return slotIndex === 0 ? 'gather' : null;
  }

  protected dragData(ref: SlotRef, w: DashboardWidget): DragData {
    return { ref, size: widgetType(w.type).size };
  }

  /** Un hueco solo acepta widgets de su tamaño: los demás ni lo resaltan al pasar por encima. */
  protected acceptsFor(box: Pick<DashboardBox, 'layout'>) {
    const size = slotSize(box);
    return (drag: CdkDrag<DragData>) => drag.data.size === size;
  }

  protected dropped(event: CdkDragDrop<SlotRef, SlotRef, DragData>): void {
    if (event.previousContainer === event.container) return;
    this.store.swap(event.item.data.ref, event.container.data);
  }

  protected openDetail(widget: DashboardWidget, open: DetailOpen): void {
    if (this.wall()) return;
    this.detail.set({ kind: open.kind, presence: open.presence, widgetId: widget.id });
  }

  protected markAllAlertsSeen(): void {
    this.store.markAlertsSeen(this.alerts().map((a) => a.key));
  }

  protected goToAlert(a: MonitorAlert): void {
    this.store.markAlertsSeen([a.key]);
    this.store.select(a.monitorId);
    this.flashId.set(a.widgetId);
    setTimeout(() => {
      this.host.nativeElement.querySelector(`[data-widget-id="${a.widgetId}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    setTimeout(() => this.flashId.set(null), 1600);
  }

  // ─── Carrusel y modo pared ───

  protected toggleCarousel(): void {
    this.carouselRunning.update((r) => !r);
  }

  private clearCarousel(): void {
    if (this.carouselTimer) clearTimeout(this.carouselTimer);
    this.carouselTimer = null;
  }

  protected async enterWall(): Promise<void> {
    this.detail.set(null);
    this.wall.set(true);
    this.wallZoom.set(Math.min(1.8, Math.max(1, window.screen.width / WALL_BASE_WIDTH)));
    if (this.canRotate()) this.carouselRunning.set(true);
    this.pokeWallControls();
    try {
      await this.host.nativeElement.requestFullscreen?.();
    } catch {
      // Sin pantalla completa (un iframe, un navegador que lo niega): el modo pared tapa igualmente la ventana.
    }
  }

  protected exitWall(): void {
    this.wall.set(false);
    this.carouselRunning.set(false);
    this.wallZoom.set(1);
    if (document.fullscreenElement) void document.exitFullscreen();
  }

  /** Enseña los controles del modo pared y los vuelve a esconder tras un rato sin tocar nada. */
  protected pokeWallControls(): void {
    this.wallControlsVisible.set(true);
    if (this.wallIdleTimer) clearTimeout(this.wallIdleTimer);
    this.wallIdleTimer = setTimeout(() => this.wallControlsVisible.set(false), WALL_IDLE_MS);
  }

  /** Teclado del modo pared: espacio pausa, flechas cambian de monitor, Esc sale (sin pantalla completa). */
  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (!this.wall()) return;
    this.pokeWallControls();
    if (event.key === ' ') {
      event.preventDefault();
      this.toggleCarousel();
    } else if (event.key === 'ArrowRight') {
      this.store.selectOffset(1);
    } else if (event.key === 'ArrowLeft') {
      this.store.selectOffset(-1);
    } else if (event.key === 'Escape') {
      this.exitWall();
    }
  }
}
