import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { map, startWith } from 'rxjs';

import { IconComponent } from '@shared/components';
import { ScDialogComponent as DialogComponent } from '@smartcontact-hub/components';
import { ScToggleSwitchComponent as ToggleSwitchComponent } from '@smartcontact-hub/components';

import type { Conversation } from '../../data/conversation.types';

/**
 * Bulk transcription modal · Memory iter 6b v26.
 *
 * Reemplaza la taxonomía v11 (3 destinos MECE) por un layout compact
 * de 2 celdas tipo "Hero + Decision". Réplica del prototipo React
 * `BulkTranscriptionModal.tsx · v26 (Figma 297:2559)`.
 *
 * Body 720×200, dos celdas equal separadas por hairline vertical:
 *
 *   ┌─────────────────────────┬─────────────────────────┐
 *   │ TOTAL A PROCESAR        │ ANÁLISIS                │
 *   │ 12  genera coste        │ Incluir análisis   ◯─●  │
 *   │ Incluye 3 multi-rec.    │ 8 admiten análisis      │
 *   └─────────────────────────┴─────────────────────────┘
 *
 * Counters derivados:
 *   nTrans   = audios de llamadas pendientes (multi-rec leg-aware)
 *   nAnBase  = call_ea + chat_ea (elegibles para análisis)
 *   heroCount = toggleOn ? (nTrans + nAnBase) : nTrans
 *
 * 6 casos según contadores no-cero (C1-C6 documentados en spec React).
 * naturalDefault: toggle ON solo cuando nTrans=0 && nAnBase>0 (C2/C5).
 *
 * Multi-rec rule (sec 13.13): una llamada multi-grabación con 3 legs
 * sin transcribir cuenta como 3 audios en el hero, no 1 conversación.
 * El delta hint explica "Incluye N llamadas con varios tramos".
 *
 * Inputs nuevos vs v11: `processingIds` + `analyzingIds` (opcional,
 * default []) — excluyen filas mid-dispatch para evitar doble coste.
 * Hoy el mock no usa esos arrays; se documenta en §10 inventory.
 */
@Component({
  selector: 'sc-memory-bulk-transcription-modal',
  imports: [
    ButtonModule,
    FormsModule,
    IconComponent,
    DialogComponent,
    ToggleSwitchComponent,
    TranslateModule,
  ],
  templateUrl: './bulk-transcription-modal.component.html',
  styleUrl: './bulk-transcription-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkTranscriptionModalComponent {
  /** Inputs con default — necesario para que el effect del constructor
   *  no casque con NG0950 antes del primer binding. Comportamiento OK
   *  con valores default: modal invisible + selección vacía → heroCount=0. */
  readonly visible = input<boolean>(false);
  readonly selected = input<readonly Conversation[]>([]);
  readonly processingIds = input<readonly string[]>([]);
  readonly analyzingIds = input<readonly string[]>([]);

  readonly closed = output<void>();
  readonly confirmed = output<{
    readonly includeAnalysis: boolean;
    readonly eligibleIds: readonly string[];
  }>();

  /** Estado del toggle controlado por el usuario. El estado efectivo `toggleOn`
   *  aplica el natural-default + el lock cuando no se puede transcribir. */
  protected readonly userToggleOn = signal(false);
  /** Pulse simultáneo hero + caption al togglear (legacy: scale 1.08, 360ms). */
  protected readonly isPulsing = signal(false);
  /** Shake de la cell decision cuando toggle disabled + click (C1 nudge). */
  protected readonly isShaking = signal(false);
  /** Ghost "+N" / "−N" flotante (sc-delta-fly 750ms). Solo aparece al
   *  togglear cuando `delta = (next ? 1 : -1) * nAnBase` ≠ 0. Se limpia
   *  tras la animación. Patrón legacy `BulkTranscriptionModal.tsx`. */
  protected readonly deltaGhost = signal<{ key: number; value: number } | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Análisis derivado de la selección. Excluye `deleted: true` y filas
   *  en proceso de transcripción/análisis (evita doble dispatch). */
  protected readonly analysis = computed(() =>
    analyze(this.selected(), this.processingIds(), this.analyzingIds()),
  );

  protected readonly nTrans = computed(() => this.analysis().nTrans);
  protected readonly nAnBase = computed(() => this.analysis().nAnBase);
  protected readonly nInProgress = computed(() => this.analysis().nInProgress);
  protected readonly nMultiRec = computed(() => this.analysis().nMultiRec);
  protected readonly nPartialMultiRec = computed(() => this.analysis().nPartialMultiRec);
  protected readonly nSel = computed(() => this.selected().length);

  /** Solo es false en C1 (nada que hacer) — el toggle queda disabled. */
  protected readonly canAnalyze = computed(() => this.nTrans() + this.nAnBase() > 0);
  protected readonly toggleDisabled = computed(() => !this.canAnalyze());
  protected readonly isAllProcessed = computed(() => !this.canAnalyze());

  /** Natural default: ON solo cuando nada que transcribir pero sí analizar
   *  (C2/C5). Se aplica al abrir el modal y al cambiar la selección. */
  protected readonly toggleOn = computed(() =>
    this.toggleDisabled() ? false : this.userToggleOn(),
  );

  protected readonly heroCount = computed(() =>
    this.toggleOn() ? this.nTrans() + this.nAnBase() : this.nTrans(),
  );

  protected readonly canSubmit = computed(() => this.heroCount() > 0 && !this.isLoading());

  private readonly translate = inject(TranslateService);
  /** Reactive lang dependency for computed subtitles — patrón S49
   *  (feedback_i18n_reactive_pattern). `translate.instant()` aislado
   *  no re-evalúa al cambiar idioma; el signal lo fuerza. */
  private readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(
      map((e) => e.lang),
      startWith(this.translate.currentLang),
    ),
    { initialValue: this.translate.currentLang },
  );

  /**
   * Subtitle dinámico para el header del modal: contexto de selección.
   * Muestra desglose "X llamadas, Y chats" solo cuando hay mix (evita
   * redundancia "5 conversaciones · 5 llamadas").
   */
  protected readonly subtitle = computed(() => {
    this.currentLang(); // dependency for re-runs on lang change
    const sel = this.selected();
    if (sel.length === 0) return this.translate.instant('memory.bulk_transcription.no_selection');
    const nCalls = sel.filter((c) => c.channel === 'llamada').length;
    const nChats = sel.length - nCalls;
    const head =
      sel.length === 1
        ? this.translate.instant('memory.bulk_transcription.subtitle_one')
        : this.translate.instant('memory.bulk_transcription.subtitle_many', { count: sel.length });
    if (nCalls > 0 && nChats > 0) {
      const callsLabel =
        nCalls === 1
          ? this.translate.instant('memory.bulk_transcription.calls_one')
          : this.translate.instant('memory.bulk_transcription.calls_many', { count: nCalls });
      const chatsLabel =
        nChats === 1
          ? this.translate.instant('memory.bulk_transcription.chats_one')
          : this.translate.instant('memory.bulk_transcription.chats_many', { count: nChats });
      return `${head} · ${callsLabel}, ${chatsLabel}`;
    }
    return head;
  });

  /**
   * Hint debajo del hero. Solo aparece cuando aporta info NUEVA respecto
   * al subtitle (regla 15.41 anti señales-duplicadas). Casos típicos:
   *  - "Incluye N llamadas con varios tramos" (multi-rec, footgun 15.44).
   *  - "Excluye N en proceso" (cuando processingIds tiene filas selecc).
   */
  protected readonly heroDeltaHint = computed<string | null>(() => {
    if (this.isAllProcessed()) return null;
    const includes: string[] = [];
    const excludes: string[] = [];
    const nMR = this.nMultiRec();
    const nPMR = this.nPartialMultiRec();
    const nIP = this.nInProgress();
    if (nMR > 0 && !this.toggleOn()) {
      includes.push(`${nMR} ${nMR === 1 ? 'llamada' : 'llamadas'} con varios tramos`);
    }
    if (nPMR > 0) {
      if (includes.length > 0) {
        includes.push(`${nPMR} con tramos ya iniciados`);
      } else {
        includes.push(`${nPMR} ${nPMR === 1 ? 'llamada' : 'llamadas'} con tramos ya iniciados`);
      }
    }
    if (nIP > 0) excludes.push(`${nIP} en proceso`);
    const parts: string[] = [];
    if (includes.length > 0) parts.push(`Incluye ${includes.join(' · ')}`);
    if (excludes.length > 0) parts.push(`Excluye ${excludes.join(' · ')}`);
    return parts.length > 0 ? parts.join('. ') + '.' : null;
  });

  /**
   * experiment/beyondui-patterns S58 — Skill redesign-existing-projects:
   * "Mixed-state communication should be layered with iconografía
   * diferenciada, no texto denso". Reemplaza `heroDeltaHint` (single
   * string) con array de viñetas estructuradas — cada una es un chip
   * visible con icono + count + label. Patrón Linear/Vercel/Stripe.
   *
   * Tipos:
   *  - 'include' (verde): elegibles para procesar.
   *  - 'warn' (amber): atención — multi-tramo, parciales (no se excluyen,
   *    pero el usuario debe saber que cuenta como N audios).
   *  - 'exclude' (gray): se excluyen del batch (en proceso ya).
   */
  protected readonly heroBadges = computed<
    ReadonlyArray<{
      readonly kind: 'include' | 'warn' | 'exclude';
      readonly count: number;
      readonly label: string;
      readonly icon: string;
    }>
  >(() => {
    if (this.isAllProcessed()) return [];
    const badges: Array<{
      kind: 'include' | 'warn' | 'exclude';
      count: number;
      label: string;
      icon: string;
    }> = [];

    const elegibles = this.nTrans() + (this.toggleOn() ? this.nAnBase() : 0);
    if (elegibles > 0) {
      badges.push({
        kind: 'include',
        count: elegibles,
        label: this.toggleOn() ? 'a procesar + analizar' : 'a transcribir',
        icon: 'check',
      });
    }

    const nMR = this.nMultiRec();
    const nPMR = this.nPartialMultiRec();
    if (nMR > 0 && !this.toggleOn()) {
      badges.push({
        kind: 'warn',
        count: nMR,
        label: nMR === 1 ? 'con varios tramos' : 'con varios tramos',
        icon: 'layers',
      });
    }
    if (nPMR > 0) {
      badges.push({
        kind: 'warn',
        count: nPMR,
        label: 'con tramos ya iniciados',
        icon: 'layers',
      });
    }

    const nIP = this.nInProgress();
    if (nIP > 0) {
      badges.push({
        kind: 'exclude',
        count: nIP,
        label: nIP === 1 ? 'en proceso · excluida' : 'en proceso · excluidas',
        icon: 'block',
      });
    }

    return badges;
  });

  protected readonly captionLabel = computed(() => {
    const n = this.nTrans() + this.nAnBase();
    return n === 1 ? 'admite análisis' : 'admiten análisis';
  });

  protected readonly alignLeftIcon = 'notes';
  protected readonly alertIcon = 'error';
  protected readonly headerIcon = 'checklist';

  constructor() {
    // Reset toggle to natural default al abrir o al cambiar selección.
    effect(() => {
      if (!this.visible()) return;
      // Tocar selected() para que el effect se dispare con cualquier cambio.
      this.selected();
      const naturalOn = this.nTrans() === 0 && this.nAnBase() > 0;
      this.userToggleOn.set(naturalOn);
      this.isLoading.set(false);
      this.error.set(null);
    });

    // Solo limpiar ghost stale al cerrar/abrir el modal (legacy clear-on-open).
    effect(() => {
      if (!this.visible()) this.deltaGhost.set(null);
    });
  }

  /** Toggle pulse + flash · réplica `BulkTranscriptionModal.tsx`
   *  `handleToggle`: el ghost solo aparece al click del toggle (no en
   *  cualquier cambio de heroCount), con `delta = (next ? 1 : -1) * nAnBase`. */
  private ghostKey = 0;
  private pulseTimer: ReturnType<typeof setTimeout> | null = null;
  private ghostTimer: ReturnType<typeof setTimeout> | null = null;
  private firePulseAndFlash(delta: number): void {
    // Pulse hero + caption al unísono (legacy: animate-sc-pulse simultáneo).
    this.isPulsing.set(false);
    requestAnimationFrame(() => {
      this.isPulsing.set(true);
      if (this.pulseTimer) clearTimeout(this.pulseTimer);
      this.pulseTimer = setTimeout(() => this.isPulsing.set(false), 360);
    });
    // Ghost solo si el delta produce un cambio real en el heroCount.
    if (delta !== 0) {
      this.ghostKey += 1;
      this.deltaGhost.set({ key: this.ghostKey, value: delta });
      if (this.ghostTimer) clearTimeout(this.ghostTimer);
      this.ghostTimer = setTimeout(() => this.deltaGhost.set(null), 800);
    }
  }

  protected onToggleChange(next: boolean): void {
    if (this.toggleDisabled()) {
      // C1 nudge: shake la cell decisión (legacy refire pattern OFF→ON).
      this.isShaking.set(false);
      requestAnimationFrame(() => {
        this.isShaking.set(true);
        setTimeout(() => this.isShaking.set(false), 280);
      });
      return;
    }
    // Delta = ± nAnBase (legacy): el toggle suma/resta las analizables a hero.
    const delta = (next ? 1 : -1) * this.nAnBase();
    this.firePulseAndFlash(delta);
    this.userToggleOn.set(next);
  }

  protected onCancel(): void {
    if (this.isLoading()) return;
    this.closed.emit();
  }

  protected onConfirm(): void {
    if (!this.canSubmit()) return;
    const includeAnalysis = this.toggleOn();
    const a = this.analysis();
    const eligibleIds: string[] = [];
    for (const c of a.readyToTranscribe) eligibleIds.push(c.id);
    if (includeAnalysis) {
      for (const c of a.callEa) eligibleIds.push(c.id);
      for (const c of a.chatEa) eligibleIds.push(c.id);
    }
    this.isLoading.set(true);
    this.error.set(null);
    // Mock: emite inmediatamente. En real, el caller manejaría loading/error
    // y devolvería una promise. Aquí simulamos resolución síncrona.
    this.confirmed.emit({ includeAnalysis, eligibleIds });
    this.isLoading.set(false);
  }
}

interface AnalysisResult {
  readonly readyToTranscribe: readonly Conversation[];
  readonly callEa: readonly Conversation[];
  readonly chatEa: readonly Conversation[];
  readonly nTrans: number;
  readonly nConvTrans: number;
  readonly nMultiRec: number;
  readonly nPartialMultiRec: number;
  readonly nInProgress: number;
  readonly nAnBase: number;
}

/**
 * Calcula los contadores derivados de la selección, aplicando los
 * filtros silenciosos (deleted + in-progress) y la regla multi-rec
 * (audios, no conversaciones).
 */
function analyze(
  selected: readonly Conversation[],
  processingIds: readonly string[],
  analyzingIds: readonly string[],
): AnalysisResult {
  const inProgress = new Set<string>([...processingIds, ...analyzingIds]);
  const eligible = selected.filter((c) => !c.deleted && !inProgress.has(c.id));
  const calls = eligible.filter((c) => c.channel === 'llamada');
  const chats = eligible.filter((c) => c.channel === 'chat');
  const nInProgress = selected.filter((c) => inProgress.has(c.id)).length;

  const readyToTranscribe = calls.filter((c) => c.hasRecording && !c.hasTranscription);

  // Multi-rec: una llamada con N tramos sin transcribir cuenta N audios.
  let nTramos = 0;
  let nMultiRec = 0;
  let nPartialMultiRec = 0;
  for (const c of readyToTranscribe) {
    const recs = c.recordings;
    if (recs && recs.length > 1) {
      nMultiRec++;
      const untranscribed = recs.filter((r) => !r.hasTranscription).length;
      nTramos += untranscribed;
      if (recs.some((r) => r.hasTranscription)) nPartialMultiRec++;
    } else {
      nTramos += 1;
    }
  }

  const callsTranscribed = calls.filter((c) => c.hasTranscription);
  const callEa = callsTranscribed.filter((c) => !c.hasAnalysis);
  const chatEa = chats.filter((c) => !c.hasAnalysis);

  return {
    readyToTranscribe,
    callEa,
    chatEa,
    nTrans: nTramos,
    nConvTrans: readyToTranscribe.length,
    nMultiRec,
    nPartialMultiRec,
    nInProgress,
    nAnBase: callEa.length + chatEa.length,
  };
}
