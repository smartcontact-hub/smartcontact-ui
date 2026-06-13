import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
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
 * sistema base-14 del mirror (scale-sweep documentado en el DECISIONS-LOG).
 */
@Component({
  selector: 'sc-bulk-transcription-modal',
  standalone: true,
  imports: [NgClass, TranslatePipe, ScButtonComponent, ScToggleSwitchComponent],
  templateUrl: './sc-bulk-transcription-modal.component.html',
  styleUrls: ['./sc-bulk-transcription-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScBulkTranscriptionModalComponent implements OnChanges, OnDestroy {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  private readonly translateService = inject(TranslateService);

  constructor() {
    this.registerTranslations();
    this.translationChangeSubscription = this.translateService.onLangChange.subscribe(() => {
      this.changeDetectorRef.markForCheck();
    });
  }

  @Input() selectedCount = 0;

  @Input() transcriptionCount = 0;

  @Input() analysisCount = 0;

  @Input() newCallsCount: number | null = null;

  @Input() transcribedCallsPendingAnalysisCount: number | null = null;

  @Input() chatsPendingAnalysisCount: number | null = null;

  @Input() alreadyProcessedCount = 0;

  @Input() readyToTranscribeIds: string[] = [];

  @Input() readyToAnalyzeIds: string[] = [];

  @Input() multiSegmentCallsCount = 0;

  @Input() partialSegmentConversationsCount = 0;

  @Input() excludedInProgressCount = 0;

  @Input() surface: ScBulkTranscriptionModalSurface = 'default';

  @Input() styleClass = '';

  @Input() closeRequested: (() => void) | null = null;

  @Input() processRequested: ((result: ScBulkTranscriptionModalResult) => void) | null = null;

  @Output() closed = new EventEmitter<void>();

  @Output() processed = new EventEmitter<ScBulkTranscriptionModalResult>();

  includeAnalysis = false;

  heroBump = false;

  analysisPulse = false;

  analysisNudge = false;

  deltaFlash: { delta: number; key: number } | null = null;

  private analysisTouched = false;

  private countersSignature = '';

  private selectionEffectStartTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;

  private selectionEffectEndTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;

  private deltaFlashEndTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;

  private analysisNudgeStartTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;

  private analysisNudgeEndTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;

  private readonly translationChangeSubscription: Subscription;

  ngOnChanges(): void {
    const nextCountersSignature = this.getCountersSignature();

    if (this.countersSignature !== nextCountersSignature) {
      this.countersSignature = nextCountersSignature;
      this.analysisTouched = false;
      this.includeAnalysis = this.initialIncludeAnalysis;
      return;
    }

    if (!this.analysisTouched) {
      this.includeAnalysis = this.initialIncludeAnalysis;
    }
  }

  ngOnDestroy(): void {
    this.clearSelectionEffectTimers();
    this.clearAnalysisNudgeTimers();
    this.translationChangeSubscription.unsubscribe();
  }

  get subtitle(): string {
    return this.translateCount('selectedConversations', this.displaySelectedCount);
  }

  get analysisDisabled(): boolean {
    return !this.canAnalyze;
  }

  get analysisChecked(): boolean {
    return this.analysisDisabled ? false : this.includeAnalysis;
  }

  get heroCount(): number {
    return this.analysisChecked
      ? this.pendingTranscriptionCount + this.pendingAnalysisBaseCount
      : this.pendingTranscriptionCount;
  }

  get canSubmit(): boolean {
    return this.heroCount > 0;
  }

  get analysisCaption(): string {
    if (this.analysisDisabled) {
      return this.translate('allProcessed');
    }

    return this.translateCount('analysisCandidates', this.analysisCandidateCount);
  }

  get heroCostLabel(): string {
    return this.canSubmit ? this.translate('generatesCost') : this.translate('allProcessed');
  }

  get displaySelectedCount(): number {
    if (this.selectedCount > 0) {
      return this.selectedCount;
    }

    return this.pendingTranscriptionCount + this.pendingAnalysisBaseCount + this.alreadyProcessedCount;
  }

  get analysisCaptionClasses(): Record<string, boolean> {
    return {
      'sc-bulk-modal__caption--on': this.analysisChecked,
      'sc-bulk-modal__caption--pulse': this.analysisPulse,
      'sc-bulk-modal__caption--disabled': this.analysisDisabled,
    };
  }

  get analysisSectionClasses(): Record<string, boolean> {
    return {
      'sc-bulk-modal__analysis--disabled': this.analysisDisabled,
      'sc-bulk-modal__analysis--nudge': this.analysisNudge,
    };
  }

  get heroNumberClasses(): Record<string, boolean> {
    return {
      'sc-bulk-modal__hero-number--bump': this.heroBump,
    };
  }

  get costClasses(): Record<string, boolean> {
    return {
      'sc-bulk-modal__cost--muted': !this.canSubmit,
    };
  }

  get modalClasses(): Record<string, boolean> {
    const classes: Record<string, boolean> = {
      'sc-bulk-modal--dark': this.surface === 'dark',
      'sc-bulk-modal--green': this.surface === 'green',
    };

    for (const className of this.styleClass.split(/\s+/).filter(Boolean)) {
      classes[className] = true;
    }

    return classes;
  }

  get heroHint(): string {
    const includeHints: string[] = [];
    const excludeHints: string[] = [];

    if (!this.analysisChecked && this.multiSegmentCallsCount > 0) {
      includeHints.push(this.translateCount('multiSegmentCalls', this.multiSegmentCallsCount));
    }

    if (this.partialSegmentConversationsCount > 0) {
      includeHints.push(
        this.translateCount('partialSegmentConversations', this.partialSegmentConversationsCount),
      );
    }

    if (this.excludedInProgressCount > 0) {
      excludeHints.push(this.translateCount('inProgress', this.excludedInProgressCount));
    }

    const chunks: string[] = [];

    if (includeHints.length > 0) {
      chunks.push(this.translate('includes', { items: includeHints.join(' · ') }));
    }

    if (excludeHints.length > 0) {
      chunks.push(this.translate('excludes', { items: excludeHints.join(' · ') }));
    }

    return chunks.join(' ');
  }

  get alreadyProcessedLabel(): string {
    if (this.alreadyProcessedCount === 0) {
      return '';
    }

    return this.translateCount('alreadyProcessed', this.alreadyProcessedCount);
  }

  onAnalysisChange(checked: boolean): void {
    if (this.analysisDisabled) {
      this.includeAnalysis = false;
      this.triggerAnalysisNudge();
      return;
    }

    const previousHeroCount = this.heroCount;
    this.analysisTouched = true;
    this.includeAnalysis = checked;
    this.triggerSelectionEffects(this.heroCount - previousHeroCount);
  }

  onAnalysisAttempt(): void {
    if (this.analysisDisabled) {
      this.triggerAnalysisNudge();
    }
  }

  close(): void {
    this.closed.emit();
    this.closeRequested?.();
  }

  process(): void {
    if (!this.canSubmit) {
      return;
    }

    const transcriptionIds = [...this.readyToTranscribeIds];
    const analysisIds = this.analysisChecked
      ? [...new Set([...this.readyToAnalyzeIds, ...this.readyToTranscribeIds])]
      : [];
    const eligibleIds = [...new Set([...transcriptionIds, ...analysisIds])];

    const result: ScBulkTranscriptionModalResult = {
      includeAnalysis: this.analysisChecked,
      heroCount: this.heroCount,
      selectedCount: this.displaySelectedCount,
      transcriptionCount: this.pendingTranscriptionCount,
      analysisCount: this.pendingAnalysisBaseCount,
      transcribedCallsPendingAnalysisCount: this.pendingCallAnalysisCount,
      chatsPendingAnalysisCount: this.pendingChatAnalysisCount,
      eligibleIds,
      transcriptionIds,
      analysisIds,
    };

    this.processed.emit(result);
    this.processRequested?.(result);
  }

  private get initialIncludeAnalysis(): boolean {
    return this.pendingTranscriptionCount === 0 && this.pendingAnalysisBaseCount > 0;
  }

  private get pendingTranscriptionCount(): number {
    return this.newCallsCount ?? this.transcriptionCount;
  }

  private get pendingCallAnalysisCount(): number {
    if (this.transcribedCallsPendingAnalysisCount !== null) {
      return this.transcribedCallsPendingAnalysisCount;
    }

    if (this.chatsPendingAnalysisCount !== null) {
      return 0;
    }

    return this.analysisCount;
  }

  private get pendingChatAnalysisCount(): number {
    return this.chatsPendingAnalysisCount ?? 0;
  }

  private get pendingAnalysisBaseCount(): number {
    return this.pendingCallAnalysisCount + this.pendingChatAnalysisCount;
  }

  private get analysisCandidateCount(): number {
    return this.pendingTranscriptionCount + this.pendingAnalysisBaseCount;
  }

  private get canAnalyze(): boolean {
    return this.analysisCandidateCount > 0;
  }

  private triggerSelectionEffects(delta: number): void {
    this.clearSelectionEffectTimers();
    this.heroBump = false;
    this.analysisPulse = false;
    this.deltaFlash = null;
    this.changeDetectorRef.markForCheck();

    this.selectionEffectStartTimeout = globalThis.setTimeout(() => {
      this.heroBump = true;
      this.analysisPulse = true;

      if (delta !== 0) {
        this.deltaFlash = { delta, key: this.nextDeltaKey() };
      }

      this.changeDetectorRef.markForCheck();

      this.selectionEffectEndTimeout = globalThis.setTimeout(() => {
        this.heroBump = false;
        this.analysisPulse = false;
        this.changeDetectorRef.markForCheck();
      }, 360);

      if (delta !== 0) {
        this.deltaFlashEndTimeout = globalThis.setTimeout(() => {
          this.deltaFlash = null;
          this.changeDetectorRef.markForCheck();
        }, 760);
      }
    });
  }

  private triggerAnalysisNudge(): void {
    this.clearAnalysisNudgeTimers();
    this.analysisNudge = false;
    this.changeDetectorRef.markForCheck();

    this.analysisNudgeStartTimeout = globalThis.setTimeout(() => {
      this.analysisNudge = true;
      this.changeDetectorRef.markForCheck();

      this.analysisNudgeEndTimeout = globalThis.setTimeout(() => {
        this.analysisNudge = false;
        this.changeDetectorRef.markForCheck();
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

  private translate(key: string, params?: Record<string, string | number>): string {
    const value = this.translateService.instant(
      `${SC_BULK_TRANSCRIPTION_MODAL_TRANSLATION_KEY}.${key}`,
      params,
    );

    return typeof value === 'string' ? value : '';
  }

  private translateCount(key: string, count: number): string {
    return this.translate(`${key}.${count === 1 ? 'one' : 'other'}`, { count });
  }

  private getCountersSignature(): string {
    return [
      this.selectedCount,
      this.pendingTranscriptionCount,
      this.pendingCallAnalysisCount,
      this.pendingChatAnalysisCount,
      this.alreadyProcessedCount,
    ].join('|');
  }
}
