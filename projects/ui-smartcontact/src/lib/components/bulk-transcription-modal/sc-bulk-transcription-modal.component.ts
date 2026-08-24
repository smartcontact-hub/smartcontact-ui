import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { ScButtonComponent } from '../button/sc-button.component';
import { ScToggleSwitchComponent } from '../toggleswitch/sc-toggleswitch.component';
import {
  SC_BULK_TRANSCRIPTION_MODAL_TRANSLATION_KEY,
  SC_BULK_TRANSCRIPTION_MODAL_TRANSLATIONS,
} from './i18n/sc-bulk-transcription-modal.translations';

export type ScBulkTranscriptionModalResult = {
  includeAnalysis: boolean;
  heroCount: number;
  selectedCount: number;
  transcriptionCount: number;
  analysisCount: number;
  transcribedCallsPendingAnalysisCount: number;
  chatsPendingAnalysisCount: number;
  eligibleIds: string[];
  transcriptionIds: string[];
  analysisIds: string[];
};

export type ScBulkTranscriptionModalSurface = 'default' | 'dark' | 'green';

/**
 * Modal de procesamiento masivo de conversaciones (transcripción + análisis).
 *
 * **Port PRESENTACIONAL** (Mitad B, lote 9): recibe los contadores YA calculados
 * como `@Input` y emite la decisión (`processed`). La lógica de DOMINIO (derivar
 * los contadores de `Conversation[]`, filtrar borradas/en curso, separar
 * calls/chats) se queda en la app (Memory) — el DS no la conoce. Renderiza su
 * propia `<section role="dialog">`: el shell/overlay lo provee el consumidor
 * (render condicional o `ScDynamicDialogService`).
 *
 * Animaciones 1:1 con el molde: hero count-up (bump), delta flotante (+/-),
 * pulse del caption y nudge del toggle deshabilitado. Tokens traducidos al
 * sistema base-14 del mirror (scale-sweep documentado en el journal de construcción,
 * hoy en el tag `archive/docs-history`).
 *
 * ⚠️ **NO lo adoptes en Memory sin rehacerlo antes.** La rutina semanal
 * (2026-08-13) propuso sustituir con este el modal propio del supervisor
 * (`sc-memory-bulk-transcription-modal`) por ser "el mismo con otros nombres".
 * Comparados fichero a fichero el 2026-08-14, **ya no lo son**: este port quedó
 * congelado en la v26 de junio y el de la app siguió (redesign S58), así que
 * adoptarlo tal cual sería una REGRESIÓN visible. Lo que tiene la app y aquí no:
 *   · **badges iconográficos** include/warn/exclude en el hero, que sustituyeron
 *     al texto denso que aquí se sigue pintando (`heroHint`);
 *   · **franja de error** `role="alert"` recuperable;
 *   · **estado de carga** en el botón de procesar;
 *   · shell delegado en `<sc-dialog>` — este renderiza su propio `role="dialog"`.
 * Convergerlos es rehacer el port contra la app viva, no un swap. Mientras eso
 * no pase, su único consumidor es la demo de `sc-docs`.
 *
 * **Y tampoco se retira, aunque no lo consuma ninguna app.** Está en el KIT:
 * `kit-export-dtcg.json` lo modela con tokens propios (borde, header,
 * subheader, título, footer) bajo `aura/custom`, cuya única otra rama es
 * `typography` — o sea que es **el único componente custom que el Kit modela**.
 * Que la app no lo use no es que sobre: es que la app se adelantó al Kit.
 * Triado como **intencional** el 2026-08-14; no lo levantes otra vez como deuda.
 */
@Component({
  selector: 'sc-bulk-transcription-modal',
  standalone: true,
  imports: [NgClass, TranslatePipe, ScButtonComponent, ScToggleSwitchComponent],
  templateUrl: './sc-bulk-transcription-modal.component.html',
  styleUrl: './sc-bulk-transcription-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScBulkTranscriptionModalComponent implements OnDestroy {
  private readonly translateService = inject(TranslateService);

  /**
   * Tic de idioma. NO es decorativo y es la trampa de migrar a señales un
   * componente traducido: `TranslateService.instant()` NO es una señal, así que
   * un `computed()` que la llame se cachea con el idioma que hubiera al primer
   * cálculo y NO se recalcula al cambiarlo. Antes eso lo tapaba el
   * `markForCheck()` del `onLangChange` —con getters, cada CD re-evaluaba—, pero
   * un `computed` no se re-evalúa porque el componente se re-pinte.
   *
   * Este contador sube en cada `onLangChange` y TODO computed que traduzca lo
   * lee, así que la dependencia queda declarada y el idioma vuelve a propagarse.
   */
  private readonly lang = signal(0);

  private readonly translationChangeSubscription: Subscription;

  constructor() {
    this.registerTranslations();
    this.translationChangeSubscription = this.translateService.onLangChange.subscribe(() => {
      this.lang.update((n) => n + 1);
    });
  }

  readonly selectedCount = input(0);

  readonly transcriptionCount = input(0);

  readonly analysisCount = input(0);

  readonly newCallsCount = input<number | null>(null);

  readonly transcribedCallsPendingAnalysisCount = input<number | null>(null);

  readonly chatsPendingAnalysisCount = input<number | null>(null);

  readonly alreadyProcessedCount = input(0);

  readonly readyToTranscribeIds = input<string[]>([]);

  readonly readyToAnalyzeIds = input<string[]>([]);

  readonly multiSegmentCallsCount = input(0);

  readonly partialSegmentConversationsCount = input(0);

  readonly excludedInProgressCount = input(0);

  readonly surface = input<ScBulkTranscriptionModalSurface>('default');

  readonly styleClass = input('');

  readonly closeRequested = input<(() => void) | null>(null);

  readonly processRequested = input<((result: ScBulkTranscriptionModalResult) => void) | null>(null);

  readonly closed = output<void>();

  readonly processed = output<ScBulkTranscriptionModalResult>();

  /**
   * `linkedSignal` sustituye al trío `ngOnChanges` + `analysisTouched` +
   * `countersSignature`, que implementaba a mano exactamente su semántica:
   * "vuelve al valor inicial cuando cambian los contadores; si no, respeta lo
   * que tocó el usuario". Es la misma regla, declarada en vez de reconstruida.
   *
   * La firma sigue siendo la fuente porque cubre TODO lo que mira
   * `initialIncludeAnalysis` — si se recorta, se pierde la rama de "los inputs
   * cambiaron pero el usuario no ha tocado nada".
   */
  readonly includeAnalysis = linkedSignal<string, boolean>({
    source: () => this.countersSignature(),
    computation: () => this.initialIncludeAnalysis(),
  });

  protected readonly heroBump = signal(false);

  protected readonly analysisPulse = signal(false);

  protected readonly analysisNudge = signal(false);

  protected readonly deltaFlash = signal<{ delta: number; key: number } | null>(null);

  private selectionEffectStartTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;

  private selectionEffectEndTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;

  private deltaFlashEndTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;

  private analysisNudgeStartTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;

  private analysisNudgeEndTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;

  ngOnDestroy(): void {
    this.clearSelectionEffectTimers();
    this.clearAnalysisNudgeTimers();
    this.translationChangeSubscription.unsubscribe();
  }

  // ── derivadas privadas (contadores) ────────────────────────────────────────

  private readonly pendingTranscriptionCount = computed(
    () => this.newCallsCount() ?? this.transcriptionCount(),
  );

  private readonly pendingCallAnalysisCount = computed(() => {
    const transcribed = this.transcribedCallsPendingAnalysisCount();

    if (transcribed !== null) {
      return transcribed;
    }

    if (this.chatsPendingAnalysisCount() !== null) {
      return 0;
    }

    return this.analysisCount();
  });

  private readonly pendingChatAnalysisCount = computed(() => this.chatsPendingAnalysisCount() ?? 0);

  private readonly pendingAnalysisBaseCount = computed(
    () => this.pendingCallAnalysisCount() + this.pendingChatAnalysisCount(),
  );

  private readonly analysisCandidateCount = computed(
    () => this.pendingTranscriptionCount() + this.pendingAnalysisBaseCount(),
  );

  private readonly canAnalyze = computed(() => this.analysisCandidateCount() > 0);

  private readonly initialIncludeAnalysis = computed(
    () => this.pendingTranscriptionCount() === 0 && this.pendingAnalysisBaseCount() > 0,
  );

  private readonly countersSignature = computed(() =>
    [
      this.selectedCount(),
      this.pendingTranscriptionCount(),
      this.pendingCallAnalysisCount(),
      this.pendingChatAnalysisCount(),
      this.alreadyProcessedCount(),
    ].join('|'),
  );

  // ── derivadas de plantilla ─────────────────────────────────────────────────

  readonly analysisDisabled = computed(() => !this.canAnalyze());

  readonly analysisChecked = computed(() =>
    this.analysisDisabled() ? false : this.includeAnalysis(),
  );

  readonly heroCount = computed(() =>
    this.analysisChecked()
      ? this.pendingTranscriptionCount() + this.pendingAnalysisBaseCount()
      : this.pendingTranscriptionCount(),
  );

  readonly canSubmit = computed(() => this.heroCount() > 0);

  readonly displaySelectedCount = computed(() => {
    const selected = this.selectedCount();

    if (selected > 0) {
      return selected;
    }

    return (
      this.pendingTranscriptionCount() + this.pendingAnalysisBaseCount() + this.alreadyProcessedCount()
    );
  });

  readonly subtitle = computed(() =>
    this.translateCount('selectedConversations', this.displaySelectedCount()),
  );

  readonly analysisCaption = computed(() => {
    if (this.analysisDisabled()) {
      return this.translate('allProcessed');
    }

    return this.translateCount('analysisCandidates', this.analysisCandidateCount());
  });

  readonly heroCostLabel = computed(() =>
    this.canSubmit() ? this.translate('generatesCost') : this.translate('allProcessed'),
  );

  readonly analysisCaptionClasses = computed<Record<string, boolean>>(() => ({
    'sc-bulk-modal__caption--on': this.analysisChecked(),
    'sc-bulk-modal__caption--pulse': this.analysisPulse(),
    'sc-bulk-modal__caption--disabled': this.analysisDisabled(),
  }));

  readonly analysisSectionClasses = computed<Record<string, boolean>>(() => ({
    'sc-bulk-modal__analysis--disabled': this.analysisDisabled(),
    'sc-bulk-modal__analysis--nudge': this.analysisNudge(),
  }));

  readonly heroNumberClasses = computed<Record<string, boolean>>(() => ({
    'sc-bulk-modal__hero-number--bump': this.heroBump(),
  }));

  readonly costClasses = computed<Record<string, boolean>>(() => ({
    'sc-bulk-modal__cost--muted': !this.canSubmit(),
  }));

  readonly modalClasses = computed<Record<string, boolean>>(() => {
    const surface = this.surface();
    const classes: Record<string, boolean> = {
      'sc-bulk-modal--dark': surface === 'dark',
      'sc-bulk-modal--green': surface === 'green',
    };

    for (const className of this.styleClass().split(/\s+/).filter(Boolean)) {
      classes[className] = true;
    }

    return classes;
  });

  readonly heroHint = computed(() => {
    const includeHints: string[] = [];
    const excludeHints: string[] = [];
    const multiSegment = this.multiSegmentCallsCount();
    const partialSegment = this.partialSegmentConversationsCount();
    const excludedInProgress = this.excludedInProgressCount();

    if (!this.analysisChecked() && multiSegment > 0) {
      includeHints.push(this.translateCount('multiSegmentCalls', multiSegment));
    }

    if (partialSegment > 0) {
      includeHints.push(this.translateCount('partialSegmentConversations', partialSegment));
    }

    if (excludedInProgress > 0) {
      excludeHints.push(this.translateCount('inProgress', excludedInProgress));
    }

    const chunks: string[] = [];

    if (includeHints.length > 0) {
      chunks.push(this.translate('includes', { items: includeHints.join(' · ') }));
    }

    if (excludeHints.length > 0) {
      chunks.push(this.translate('excludes', { items: excludeHints.join(' · ') }));
    }

    return chunks.join(' ');
  });

  readonly alreadyProcessedLabel = computed(() => {
    const already = this.alreadyProcessedCount();

    if (already === 0) {
      return '';
    }

    return this.translateCount('alreadyProcessed', already);
  });

  // ── acciones ───────────────────────────────────────────────────────────────

  onAnalysisChange(checked: boolean): void {
    if (this.analysisDisabled()) {
      this.includeAnalysis.set(false);
      this.triggerAnalysisNudge();
      return;
    }

    const previousHeroCount = this.heroCount();

    this.includeAnalysis.set(checked);
    this.triggerSelectionEffects(this.heroCount() - previousHeroCount);
  }

  onAnalysisAttempt(): void {
    if (this.analysisDisabled()) {
      this.triggerAnalysisNudge();
    }
  }

  close(): void {
    this.closed.emit();
    this.closeRequested()?.();
  }

  process(): void {
    if (!this.canSubmit()) {
      return;
    }

    const transcriptionIds = [...this.readyToTranscribeIds()];
    const analysisIds = this.analysisChecked()
      ? [...new Set([...this.readyToAnalyzeIds(), ...this.readyToTranscribeIds()])]
      : [];
    const eligibleIds = [...new Set([...transcriptionIds, ...analysisIds])];

    const result: ScBulkTranscriptionModalResult = {
      includeAnalysis: this.analysisChecked(),
      heroCount: this.heroCount(),
      selectedCount: this.displaySelectedCount(),
      transcriptionCount: this.pendingTranscriptionCount(),
      analysisCount: this.pendingAnalysisBaseCount(),
      transcribedCallsPendingAnalysisCount: this.pendingCallAnalysisCount(),
      chatsPendingAnalysisCount: this.pendingChatAnalysisCount(),
      eligibleIds,
      transcriptionIds,
      analysisIds,
    };

    this.processed.emit(result);
    this.processRequested()?.(result);
  }

  // ── efectos de animación ───────────────────────────────────────────────────
  //
  // Los `markForCheck()` que había aquí desaparecen: escribir una señal ya
  // notifica a OnPush. Los temporizadores se quedan — son la animación, no
  // estado derivado.

  private triggerSelectionEffects(delta: number): void {
    this.clearSelectionEffectTimers();
    this.heroBump.set(false);
    this.analysisPulse.set(false);
    this.deltaFlash.set(null);

    this.selectionEffectStartTimeout = globalThis.setTimeout(() => {
      this.heroBump.set(true);
      this.analysisPulse.set(true);

      if (delta !== 0) {
        this.deltaFlash.set({ delta, key: this.nextDeltaKey() });
      }

      this.selectionEffectEndTimeout = globalThis.setTimeout(() => {
        this.heroBump.set(false);
        this.analysisPulse.set(false);
      }, 360);

      if (delta !== 0) {
        this.deltaFlashEndTimeout = globalThis.setTimeout(() => {
          this.deltaFlash.set(null);
        }, 760);
      }
    });
  }

  private triggerAnalysisNudge(): void {
    this.clearAnalysisNudgeTimers();
    this.analysisNudge.set(false);

    this.analysisNudgeStartTimeout = globalThis.setTimeout(() => {
      this.analysisNudge.set(true);

      this.analysisNudgeEndTimeout = globalThis.setTimeout(() => {
        this.analysisNudge.set(false);
      }, 300);
    });
  }

  private deltaKeyCounter = 0;

  /** Clave incremental para re-disparar la animación del delta (sin Date.now). */
  private nextDeltaKey(): number {
    this.deltaKeyCounter += 1;

    return this.deltaKeyCounter;
  }

  private clearSelectionEffectTimers(): void {
    this.clearTimer(this.selectionEffectStartTimeout);
    this.clearTimer(this.selectionEffectEndTimeout);
    this.clearTimer(this.deltaFlashEndTimeout);
    this.selectionEffectStartTimeout = null;
    this.selectionEffectEndTimeout = null;
    this.deltaFlashEndTimeout = null;
  }

  private clearAnalysisNudgeTimers(): void {
    this.clearTimer(this.analysisNudgeStartTimeout);
    this.clearTimer(this.analysisNudgeEndTimeout);
    this.analysisNudgeStartTimeout = null;
    this.analysisNudgeEndTimeout = null;
  }

  private clearTimer(timeoutId: ReturnType<typeof globalThis.setTimeout> | null): void {
    if (timeoutId !== null) {
      globalThis.clearTimeout(timeoutId);
    }
  }

  private registerTranslations(): void {
    // Copy fijo colocado: registra solo el diccionario (merge). A diferencia del
    // molde, NO toca el idioma activo/fallback de la app (un componente del DS no
    // debe secuestrar la config de i18n del consumidor).
    for (const [language, translations] of Object.entries(SC_BULK_TRANSCRIPTION_MODAL_TRANSLATIONS)) {
      this.translateService.setTranslation(language, translations, true);
    }
  }

  /** Lee `lang()` a propósito: es lo que ata los computed traducidos al idioma. */
  private translate(key: string, params?: Record<string, string | number>): string {
    this.lang();

    const value = this.translateService.instant(
      `${SC_BULK_TRANSCRIPTION_MODAL_TRANSLATION_KEY}.${key}`,
      params,
    );

    return typeof value === 'string' ? value : '';
  }

  private translateCount(key: string, count: number): string {
    return this.translate(`${key}.${count === 1 ? 'one' : 'other'}`, { count });
  }
}
