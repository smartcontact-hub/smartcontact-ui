import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SliderModule } from 'primeng/slider';


import type { Recording } from '../../data/conversation.types';
import { formatTime, parseDurationSeconds } from '@shared/utils/audio';

/**
 * MultiRecordingPlayer · superficie única audio multi-leg (S46 §10 #2).
 *
 * Réplica 1:1 Angular+SCDS de `MultiRecordingPlayer.tsx` del prototipo
 * React. Reemplaza el par (RecordingTimeline strip + audio bar single)
 * por una sola surface bordered con 3 filas apiladas:
 *
 *   1. Transport (back10 · play · fwd10) + tiempo acumulado del tramo activo.
 *   2. Bar horizontal segmentado proporcionalmente por duración de tramo.
 *      El tramo activo es un `p-slider` (busca dentro del tramo, con el
 *      teclado o arrastrando). Segmentos inactivos son visuales — el
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
  imports: [ButtonComponent, FormsModule, IconComponent, SliderModule, TranslateModule],
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
  protected readonly back10Icon = 'replay_10';
  protected readonly fwd10Icon = 'forward_10';
  protected readonly checkIcon = 'check';

  protected readonly durations = computed(() =>
    this.recordings().map((r) => parseDurationSeconds(r.duration)),
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

  protected onSeek(t: number): void {
    if (!this.playerEnabled()) return;
    this.seek.emit(t);
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


