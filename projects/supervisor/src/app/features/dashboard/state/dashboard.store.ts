import { computed, Injectable, signal } from '@angular/core';

import { createVersionedStorage } from '@core/services/local-store.factory';

import { DASHBOARD_DEMO_MONITORS } from '../data/dashboard-demo';
import {
  MONITOR_NAME_MAX,
  type DashboardBox,
  type DashboardMonitor,
  type DashboardWidget,
} from '../data/dashboard.types';
import { liveTick } from '../data/live-tick';
import { widgetType, type WidgetSize } from '../data/widget-catalog';

/** Dónde vive un widget: caja y hueco dentro del monitor activo. */
export interface SlotRef {
  readonly box: number;
  readonly slot: number;
}

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

const emptyBoxes = (): DashboardBox[] =>
  Array.from({ length: 4 }, () => ({ id: newId('box'), layout: 'single' as const, slots: [null] }));

/** Tamaño que admite un hueco: el de una caja entera es grande; el de una partida, pequeño. */
export const slotSize = (box: Pick<DashboardBox, 'layout'>): WidgetSize => (box.layout === 'single' ? 'big' : 'small');

/**
 * Monitores del Dashboard: disposición, widgets y cifras.
 *
 * Se guardan en el navegador (`localStorage`), como el original los guarda en su servidor por
 * usuario: lo que Rafa cambia sigue ahí al recargar. Para volver a la demo de fábrica, sube
 * `currentVersion`.
 */
@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly storage = createVersionedStorage<DashboardMonitor>({
    storageKey: 'sc-dashboard-monitors',
    versionKey: 'sc-dashboard-monitors-version',
    currentVersion: 1,
    defaults: DASHBOARD_DEMO_MONITORS,
  });

  private readonly monitorsSignal = signal<readonly DashboardMonitor[]>(this.storage.read());
  readonly monitors = this.monitorsSignal.asReadonly();

  private readonly activeIdSignal = signal<string>(this.monitorsSignal()[0]?.id ?? '');
  readonly activeId = this.activeIdSignal.asReadonly();
  readonly active = computed(() => this.monitors().find((m) => m.id === this.activeId()) ?? this.monitors()[0]);
  readonly activeIndex = computed(() => Math.max(0, this.monitors().findIndex((m) => m.id === this.active()?.id)));

  /*
   * Alertas VISTAS en esta sesión. La campana cuenta solo las que no has visto: al revisarlas vuelve a
   * su estado normal. La clave lleva el nivel, así que si una alerta pasa de aviso a crítica vuelve a
   * contar como nueva. Las que se resuelven se olvidan (`forgetResolved`): si reaparecen, avisan.
   */
  private readonly seenSignal = signal<ReadonlySet<string>>(new Set());
  readonly seenAlerts = this.seenSignal.asReadonly();

  markAlertsSeen(keys: readonly string[]): void {
    if (keys.every((k) => this.seenSignal().has(k))) return;
    this.seenSignal.set(new Set([...this.seenSignal(), ...keys]));
  }

  forgetResolved(activeKeys: ReadonlySet<string>): void {
    const kept = [...this.seenSignal()].filter((k) => activeKeys.has(k));
    if (kept.length !== this.seenSignal().size) this.seenSignal.set(new Set(kept));
  }

  private commit(next: readonly DashboardMonitor[]): void {
    this.monitorsSignal.set(next);
    this.storage.write(next);
  }

  // ─── Monitores ───

  select(id: string): void {
    if (this.monitors().some((m) => m.id === id)) this.activeIdSignal.set(id);
  }

  selectOffset(offset: number): void {
    const list = this.monitors();
    if (!list.length) return;
    const next = (this.activeIndex() + offset + list.length) % list.length;
    this.activeIdSignal.set(list[next].id);
  }

  addMonitor(baseName: string): string {
    const names = new Set(this.monitors().map((m) => m.name));
    let n = this.monitors().length + 1;
    while (names.has(`${baseName} ${n}`)) n++;
    const monitor: DashboardMonitor = { id: newId('monitor'), name: `${baseName} ${n}`, boxes: emptyBoxes() };
    this.commit([...this.monitors(), monitor]);
    this.activeIdSignal.set(monitor.id);
    return monitor.id;
  }

  rename(id: string, name: string): void {
    const clean = name.trim().slice(0, MONITOR_NAME_MAX);
    if (!clean) return;
    this.commit(this.monitors().map((m) => (m.id === id ? { ...m, name: clean } : m)));
  }

  duplicate(id: string, suffix: string): void {
    const list = this.monitors();
    const index = list.findIndex((m) => m.id === id);
    if (index === -1) return;
    const source = list[index];
    const copy: DashboardMonitor = {
      id: newId('monitor'),
      name: `${source.name} ${suffix}`.slice(0, MONITOR_NAME_MAX),
      boxes: source.boxes.map((box) => ({
        ...box,
        id: newId('box'),
        slots: box.slots.map((w) => (w ? { ...w, id: newId('widget') } : w)),
      })),
    };
    this.commit([...list.slice(0, index + 1), copy, ...list.slice(index + 1)]);
    this.activeIdSignal.set(copy.id);
  }

  /** Borra un monitor (nunca el último) y devuelve lo necesario para deshacerlo. */
  remove(id: string): { monitor: DashboardMonitor; index: number } | null {
    const list = this.monitors();
    const index = list.findIndex((m) => m.id === id);
    if (index === -1 || list.length === 1) return null;
    const monitor = list[index];
    const next = list.filter((m) => m.id !== id);
    this.commit(next);
    if (this.activeId() === id) this.activeIdSignal.set(next[Math.min(index, next.length - 1)].id);
    return { monitor, index };
  }

  restore(monitor: DashboardMonitor, index: number): void {
    const list = this.monitors();
    if (list.some((m) => m.id === monitor.id)) return;
    this.commit([...list.slice(0, index), monitor, ...list.slice(index)]);
    this.activeIdSignal.set(monitor.id);
  }

  move(from: number, to: number): void {
    const list = [...this.monitors()];
    if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return;
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    this.commit(list);
  }

  // ─── Widgets del monitor activo ───

  widgetAt(ref: SlotRef): DashboardWidget | null {
    return this.active()?.boxes[ref.box]?.slots[ref.slot] ?? null;
  }

  /** Pone (o sustituye) un widget en un hueco. Rechaza un tamaño que el hueco no admite. */
  place(ref: SlotRef, widget: DashboardWidget | null): boolean {
    const box = this.active()?.boxes[ref.box];
    if (!box || ref.slot >= box.slots.length) return false;
    if (widget && widgetType(widget.type).size !== slotSize(box)) return false;
    this.updateBox(ref.box, (b) => ({ ...b, slots: b.slots.map((s, i) => (i === ref.slot ? widget : s)) }));
    return true;
  }

  /** Intercambia dos huecos del mismo tamaño (arrastrar un widget encima de otro o de un hueco libre). */
  swap(a: SlotRef, b: SlotRef): boolean {
    const boxes = this.active()?.boxes;
    if (!boxes?.[a.box] || !boxes[b.box] || (a.box === b.box && a.slot === b.slot)) return false;
    if (slotSize(boxes[a.box]) !== slotSize(boxes[b.box])) return false;
    const wa = boxes[a.box].slots[a.slot];
    const wb = boxes[b.box].slots[b.slot];
    this.commit(
      this.monitors().map((m) =>
        m.id !== this.active()?.id
          ? m
          : {
              ...m,
              boxes: m.boxes.map((box, bi) => ({
                ...box,
                slots: box.slots.map((s, si) =>
                  bi === a.box && si === a.slot ? wb : bi === b.box && si === b.slot ? wa : s,
                ),
              })),
            },
      ),
    );
    return true;
  }

  split(boxIndex: number): void {
    this.updateBox(boxIndex, (box) => ({ ...box, layout: 'split', slots: [null, null, null, null] }));
  }

  gather(boxIndex: number): void {
    this.updateBox(boxIndex, (box) => ({ ...box, layout: 'single', slots: [null] }));
  }

  /** Un latido de datos en TODOS los monitores: el carrusel enseña cifras al día. */
  tick(): void {
    this.commit(this.monitors().map((m) => liveTick(m)));
  }

  private updateBox(boxIndex: number, fn: (box: DashboardBox) => DashboardBox): void {
    const activeId = this.active()?.id;
    this.commit(
      this.monitors().map((m) =>
        m.id !== activeId ? m : { ...m, boxes: m.boxes.map((box, i) => (i === boxIndex ? fn(box) : box)) },
      ),
    );
  }
}
