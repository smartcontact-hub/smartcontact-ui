import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { ScButtonComponent } from '@smartcontact-hub/components';

/** Un audio ya elegido: lo que el campo necesita para pintarlo. */
export interface AudioPickerFile {
  readonly name: string;
  /** En bytes. */
  readonly size: number;
}

/**
 * Campo para adjuntar un audio (.wav o .mp3): el botón «Elegir» con su zona de soltar y, ya elegido, el nombre, la ✕
 * que lo quita y el reproductor del propio navegador debajo. Un solo archivo: elegir otro sustituye al anterior.
 *
 * Es un componente propio del Supervisor, no el de subida de archivos del DS: ese no contempla el reproductor ni el
 * estado «elegido» con su ✕, y el campo se rehará con el evolutivo de la subida de archivos. La maqueta de Figma es
 * `campo-audio` (variantes «Vacío» y «Con archivo»).
 *
 * El archivo no viaja a ningún sitio (prototipo): se entrega con `fileChosen` y el reproductor lo toca desde un
 * `objectURL` local, que se libera al cambiar de archivo y al destruirse el campo.
 */
@Component({
  selector: 'sc-audio-picker',
  standalone: true,
  imports: [ScButtonComponent],
  templateUrl: './audio-picker.component.html',
  styleUrl: './audio-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AudioPickerComponent {
  /** Id del campo: de él cuelgan el `input` nativo, la ayuda y el aviso. */
  readonly inputId = input.required<string>();
  /** Lo que hay guardado, o `null` si no hay nada. */
  readonly file = input<AudioPickerFile | null>(null);
  /** Tipos que admite el selector (`accept` nativo): `.wav,.mp3,audio/wav,audio/mpeg`. */
  readonly accept = input('.wav,.mp3,audio/wav,audio/mpeg');
  readonly chooseLabel = input.required<string>();
  readonly dropLabel = input.required<string>();
  readonly removeLabel = input.required<string>();
  /** «{0}: tipo de archivo no válido. » (lleva el nombre del archivo rechazado en `{0}`). */
  readonly invalidTypeSummary = input.required<string>();
  readonly invalidTypeDetail = input.required<string>();
  readonly helperText = input<string>('');

  readonly fileChosen = output<File>();
  readonly removed = output<void>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly picked = signal<{ readonly name: string; readonly url: string } | null>(null);
  protected readonly rejected = signal<string | null>(null);
  protected readonly dragging = signal(false);

  /** El reproductor suena si el archivo guardado es el que se eligió en esta sesión; el que viene de los datos de
   *  la demo no tiene fichero detrás. */
  protected readonly src = computed(() => {
    const saved = this.file();
    const p = this.picked();
    return saved && p && p.name === saved.name ? p.url : null;
  });
  protected readonly helperId = computed(() => `${this.inputId()}-help`);
  protected readonly errorId = computed(() => `${this.inputId()}-error`);
  protected readonly describedBy = computed(() => [this.rejected() ? this.errorId() : null, this.helperText() ? this.helperId() : null].filter(Boolean).join(' ') || null);

  constructor() {
    /* Si lo guardado se vacía desde fuera, el `objectURL` sobra. */
    effect(() => {
      if (!this.file()) this.release();
    });
    this.destroyRef.onDestroy(() => this.release());
  }

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.take(file);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.take(file);
  }

  protected remove(): void {
    this.release();
    this.rejected.set(null);
    this.removed.emit();
  }

  private take(file: File): void {
    if (!this.accepts(file)) {
      this.rejected.set(this.invalidTypeSummary().replace('{0}', file.name) + this.invalidTypeDetail());
      return;
    }
    this.rejected.set(null);
    this.release();
    this.picked.set({ name: file.name, url: URL.createObjectURL(file) });
    this.fileChosen.emit(file);
  }

  /** Lo mismo que hace el `accept` nativo, para lo que llega soltado. */
  private accepts(file: File): boolean {
    const rules = this.accept().split(',').map((r) => r.trim().toLowerCase()).filter(Boolean);
    const name = file.name.toLowerCase();
    return rules.some((r) => (r.startsWith('.') ? name.endsWith(r) : file.type.toLowerCase() === r));
  }

  private release(): void {
    const p = this.picked();
    if (p) URL.revokeObjectURL(p.url);
    this.picked.set(null);
  }
}
