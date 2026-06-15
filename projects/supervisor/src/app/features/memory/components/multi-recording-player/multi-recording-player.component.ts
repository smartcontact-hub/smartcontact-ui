import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { IconComponent } from '@shared/components';

import type { Recording } from '../../data/conversation.types';

/**
 * MultiRecordingPlayer · superficie única audio multi-leg (S46 §10 #2).
 *
 * Réplica 1:1 Angular+SCDS de `MultiRecordingPlayer.tsx` del prototipo
 * React. Reemplaza el par (RecordingTimeline strip + audio bar single)
 * por una sola surface bordered con 3 filas apiladas:
 *
 *   1. Transport (back10 · play · fwd10) + tiempo acumulado del tramo activo.
 *   2. Bar horizontal segmentado proporcionalmente por duración de tramo.
 *      Segmento activo lleva fill de progreso + playhead; click DENTRO de
 *      su área busca posición. Segmentos inactivos son visuales — el
 *      switch de tramo se hace en la fila 3 (semántica single-purpose).
 *   3. Labels alineadas con anchos de segmento. La activa lleva color
 *      `info-strong`; flechas ←↑→↓ navegan el radiogroup.
 *
 * Geometría proporcional preservada del audit React 15.29. El truncado
 * de labels (problem "IV…" / "C…") se resuelve sacando los labels FUERA
 * del bar para que cada label tenga el ancho completo de su segmento +
 * espacio vertical extra.
 *
 * MOCK ONLY: la app no conecta backend. El audio no se reproduce — los
 * controles son demostradores UX (setInterval en el player modal padre).
 */
@Component({
  selector: 'sc-memory-multi-recording-player',
  imports: [IconComponent, TranslateModule],
  templateUrl: './multi-recording-player.component.html',
  styleUrl: './multi-recording-player.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiRecordingPlayerComponent {
  private readonly translate = inject(TranslateService);

  readonly recordings = input.required<readonly Recording[]>();
  readonly selectedId = input.required<string>();
  readonly isPlaying = input.required<boolean>();
  readonly currentTime = input.required<number>();
  readonly totalDuration = input.required<number>();
  readonly playerEnabled = input(true);

  readonly togglePlay = output<void>();
  readonly seek = output<number>();
  readonly selectRecording = output<string>();

  protected readonly playIcon = 'play_arrow';
  protected readonly pauseIcon = 'pause';
  protected readonly back10Icon = 'rotate_left';
  protected readonly fwd10Icon = 'rotate_right';
  protected readonly checkIcon = 'check';

  protected readonly durations = computed(() =>
    this.recordings().map((r) => parseDurationSec(r.duration)),
  );

  protected readonly total = computed(() => {
    const sum = this.durations().reduce((a, b) => a + b, 0);
    return sum > 0 ? sum : 1;
  });

  protected readonly fractions = computed(() => this.durations().map((d) => d / this.total()));

  protected readonly selectedIndex = computed(() => {
    const idx = this.recordings().findIndex((r) => r.id === this.selectedId());
    return idx < 0 ? 0 : idx;
  });

  /** Cumulative left% del segmento activo dentro del bar global. */
  protected readonly activeLeftPct = computed(() => {
    const fr = this.fractions();
    const idx = this.selectedIndex();
    return fr.slice(0, idx).reduce((a, b) => a + b, 0) * 100;
  });

  protected readonly activeWidthPct = computed(() => this.fractions()[this.selectedIndex()] * 100);

  protected readonly progressFracInSeg = computed(() => {
    const total = this.totalDuration();
    if (total <= 0) return 0;
    return Math.min(1, this.currentTime() / total);
  });

  protected readonly playheadPct = computed(
    () => this.activeLeftPct() + this.activeWidthPct() * this.progressFracInSeg(),
  );

  protected readonly currentTimeLabel = computed(() => formatTime(this.currentTime()));
  protected readonly totalDurationLabel = computed(() => formatTime(this.totalDuration()));

  protected onBack10(): void {
    if (!this.playerEnabled()) return;
    this.seek.emit(Math.max(0, this.currentTime() - 10));
  }

  protected onFwd10(): void {
    if (!this.playerEnabled()) return;
    this.seek.emit(this.currentTime() + 10);
  }

  protected onTogglePlay(): void {
    if (!this.playerEnabled()) return;
    this.togglePlay.emit();
  }

  protected onScrubClick(event: MouseEvent): void {
    if (!this.playerEnabled()) return;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const fracInSeg = (event.clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, fracInSeg));
    this.seek.emit(clamped * this.totalDuration());
  }

  protected onSelectRecording(id: string): void {
    if (id === this.selectedId()) return;
    this.selectRecording.emit(id);
  }

  protected onLabelKeydown(event: KeyboardEvent, idx: number): void {
    const key = event.key;
    if (key === 'ArrowRight' || key === 'ArrowDown') {
      event.preventDefault();
      this.moveSelection(idx, 1);
    } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
      event.preventDefault();
      this.moveSelection(idx, -1);
    }
  }

  private moveSelection(fromIdx: number, dir: -1 | 1): void {
    const next = fromIdx + dir;
    const recs = this.recordings();
    if (next < 0 || next >= recs.length) return;
    this.selectRecording.emit(recs[next].id);
  }

  protected labelText(rec: Recording, idx: number): string {
    return (
      rec.label ?? this.translate.instant('memory.player.multi.leg_default_label', { idx: idx + 1 })
    );
  }

  protected ariaLabel(rec: Recording, idx: number): string {
    return this.translate.instant('memory.player.multi.leg_aria', {
      idx: idx + 1,
      label: this.labelText(rec, idx),
      duration: rec.duration,
      startTime: rec.startTime,
    });
  }
}

function parseDurationSec(d: string): number {
  const parts = d.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function formatTime(s: number): string {
  const safe = Math.max(0, Math.floor(s));
  const m = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const sec = (safe % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}
