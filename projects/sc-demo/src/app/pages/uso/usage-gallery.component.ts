import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

/** Pantalla del Supervisor capturada (subset que necesita la galería). */
interface UsageScreen {
  id: string;
  route: string;
  label: string;
  shots: string[];
  ds: string[];
}

/** Forma de `projects/sc-demo/public/usage/_usage-status.json` (lo deriva `scripts/usage-status.mjs`). */
interface UsageStatus {
  capturedAt: string;
  viewport: string;
  theme: string;
  dsSelectors: number;
  screens: UsageScreen[];
  components: Record<string, string[]>;
  global: string[];
  gated: { selector: string; usedInSupervisor: number }[];
}

/**
 * Galería de uso real (Fase 2.2): "dónde se usa cada componente DS" en las pantallas
 * REALES del Supervisor, no en la demo aislada. Los datos (PNGs + JSON) son artefactos
 * GENERADOS por `npm run usage:capture` (DOM-truth) y se sirven desde `public/usage/`.
 * Esta página solo los pinta — no se desfasa (se regenera la captura).
 */
@Component({
  selector: 'app-usage-gallery',
  imports: [],
  templateUrl: './usage-gallery.component.html',
  styleUrl: './usage-gallery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsageGalleryComponent {
  protected readonly status = signal<UsageStatus | null>(null);
  protected readonly error = signal(false);
  protected readonly view = signal<'component' | 'screen'>('component');

  private readonly screenById = computed(() => {
    const m = new Map<string, UsageScreen>();
    for (const s of this.status()?.screens ?? []) m.set(s.id, s);
    return m;
  });

  /** Filas por componente: selector → pantallas donde aparece (excluye globales). */
  protected readonly componentRows = computed(() => {
    const st = this.status();
    if (!st) return [];
    const byId = this.screenById();
    return Object.entries(st.components).map(([selector, ids]) => ({
      selector,
      screens: ids.map((id) => byId.get(id)).filter((s): s is UsageScreen => !!s),
    }));
  });

  protected readonly screens = computed(() => this.status()?.screens ?? []);
  protected readonly global = computed(() => this.status()?.global ?? []);
  protected readonly gated = computed(() => this.status()?.gated ?? []);
  /** Componentes DS vistos en alguna pantalla (por-componente + globales). */
  protected readonly seenCount = computed(() => this.componentRows().length + this.global().length);

  constructor() {
    fetch('/usage/_usage-status.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: UsageStatus) => this.status.set(data))
      .catch(() => this.error.set(true));
  }

  protected src(file: string | undefined): string {
    return `/usage/${file ?? ''}`;
  }

  protected setView(v: 'component' | 'screen'): void {
    this.view.set(v);
  }
}
