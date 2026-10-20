import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';

import { ScIconComponent } from '@smartcontact-hub/icons';

import { createScFieldState } from '../field/sc-field';
import { ScFieldMsgComponent } from '../field/sc-field-msg.component';

/**
 * Subir archivos: elegir con el botón o soltarlos en la zona, con su lista, su validación de tipo y tamaño y su
 * progreso. Wrapper Extended sobre `<p-fileupload>` de primeng.dev, en su modo **advanced** (el de
 * «arrastra y suelta»): la plantilla, la cabecera, las filas de archivo y el movimiento los pone PrimeNG, y el aspecto, el
 * tema (`fileupload.*`). Un solo componente para todo lo que se sube en el producto: audios, importaciones, adjuntos.
 *
 * **Cuándo sí y cuándo no** (DD-184): subir uno o varios archivos con zona de soltar. Para la foto de una persona o
 * entidad, con su recorte y su ilustración de reserva, `sc-photo-upload`.
 *
 * Qué añade el wrapper, y por qué:
 *   - **Sin servidor por defecto.** El prototipo no sube a ningún sitio: sin `url`, la subida es propia
 *     (`customUpload`) y el componente solo entrega los archivos (`uploaded`). Con `url`, PrimeNG hace el envío.
 *   - **`auto` por defecto**: el archivo se entrega al elegirlo y desaparecen los botones «Subir» y «Cancelar». Con
 *     `[auto]="false"`, el «Advanced» de primeng.dev entero: «Elegir», «Subir» y «Cancelar», el archivo pendiente con su
 *     barra, y al subir, a la lista de subidos (los audios de Grupos, revisión del 2026-10-15).
 *   - **`clearAfterSelect`** para quien guarda el archivo en otro sitio (un campo del formulario): la lista se vacía
 *     tras entregar, así el nombre no se pinta dos veces.
 *   - **`saved`: lo ya guardado, en la lista del propio componente** (revisión del 2026-10-15). Quien guarda el archivo
 *     en un campo le pasa lo que hay, y sale como sale en primeng.dev un archivo ya subido: su nombre, su tamaño, la
 *     marca de subido y su ✕ (`savedRemoved`). Sin servidor, lo elegido se da por subido al entregarlo, como hace
 *     PrimeNG tras una subida que sale bien; con `saved`, la lista es la que diga quien lo usa.
 *   - **Los textos llegan traducidos.** PrimeNG los toma de su locale (inglés); `chooseLabel`, `dropLabel` y los
 *     avisos de tipo y tamaño se pasan escritos en el idioma de la pantalla.
 *   - **La plantilla `#empty` va dentro**, con el texto de `dropLabel` (la consulta de `p-fileupload` no ve una
 *     plantilla que atraviesa dos proyecciones, como en `sc-selectbutton`).
 *
 * Uso:
 * ```html
 * <sc-fileupload
 *   accept=".wav,audio/wav"
 *   chooseLabel="Subir archivo"
 *   [clearAfterSelect]="true"
 *   (filesSelected)="onFiles($event)"
 * />
 * ```
 *
 * Figma: `❖ FileUpload` del Smart Contact Prime kit (pendiente de nodo, `docs/figma-pendiente.md`).
 */
/** Un archivo ya guardado: lo que la lista necesita para pintarlo como subido. */
export interface ScSavedFile {
  readonly name: string;
  /** En bytes. */
  readonly size: number;
}

@Component({
  selector: 'sc-fileupload',
  standalone: true,
  imports: [FileUploadModule, ScFieldMsgComponent, ScIconComponent],
  templateUrl: './sc-fileupload.component.html',
  styleUrl: './sc-fileupload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'sc-fileupload' },
})
export class ScFileUploadComponent {
  /** Nombre del parámetro con el que viajan los archivos, si hay `url`. */
  readonly name = input('files[]');
  /** `advanced` (zona de soltar y lista) o `basic` (un solo botón). */
  readonly mode = input<'advanced' | 'basic'>('advanced');
  /** Varios archivos a la vez. Sin ello, elegir otro sustituye al anterior. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Tipos admitidos: MIME (`image/*`) o extensiones (`.wav`), separados por coma. */
  readonly accept = input<string>();
  /** Tamaño máximo por archivo, en bytes. */
  readonly maxFileSize = input<number>();
  /** Número máximo de archivos. */
  readonly fileLimit = input<number>();
  readonly disabled = input(false, { transform: booleanAttribute });
  /** El archivo se entrega al elegirlo, sin botón de «Subir». */
  readonly auto = input(true, { transform: booleanAttribute });
  /** Adónde enviar. Sin `url`, el componente no sube nada: entrega los archivos por `uploaded`. */
  readonly url = input<string>();
  /** Vacía la lista tras entregar: para quien guarda el archivo en otro sitio. */
  readonly clearAfterSelect = input(false, { transform: booleanAttribute });
  /** Lo ya guardado, que sale en la lista como subido. Con él, la lista la manda quien lo pasa. */
  readonly saved = input<readonly ScSavedFile[]>();

  /** Texto del botón de elegir, traducido. */
  readonly chooseLabel = input<string>();
  /** Textos de «Subir» y «Cancelar» (sin `auto`), traducidos. Sin ellos, los del locale de PrimeNG. */
  readonly uploadLabel = input<string>();
  readonly cancelLabel = input<string>();
  /** Icono del botón de elegir, del DS (`sc-icon`). Por defecto, el de cada ejemplo de primeng.dev: el «+» en
   *  `advanced` (su icono de serie) y la flecha de subida en `basic` (`chooseIcon="pi pi-upload"`). */
  readonly chooseIconName = input<string>();
  protected readonly chooseIcon = computed(() => this.chooseIconName() ?? (this.mode() === 'basic' ? 'upload' : 'add'));
  /** Texto de la zona de soltar, traducido. Sin él, la zona queda vacía. */
  readonly dropLabel = input<string>();
  /** Nombre de la ✕ de cada archivo, traducido: la de PrimeNG es un botón de solo icono sin nombre. */
  readonly removeLabel = input<string>();
  /**
   * La ayuda, debajo, como la de los demás campos del DS (qué formatos, para qué es): el botón de elegir la anuncia
   * con su nombre (`aria-describedby`, por el passthrough). Hasta DD-217 §16 cada pantalla la escribía a mano.
   */
  readonly helperText = input<string>();
  /** Avisos de archivo rechazado, con los mismos `{0}` que PrimeNG (nombre del archivo, tamaño o tipos admitidos). */
  readonly invalidFileSizeMessageSummary = input('{0}: Invalid file size, ');
  readonly invalidFileSizeMessageDetail = input('maximum upload size is {0}.');
  readonly invalidFileTypeMessageSummary = input('{0}: Invalid file type, ');
  readonly invalidFileTypeMessageDetail = input('allowed file types: {0}.');

  /** Los archivos de una elección, ya validados. */
  readonly filesSelected = output<readonly File[]>();
  /** Los archivos entregados (con `auto`, nada más elegirlos). */
  readonly uploaded = output<readonly File[]>();
  /** Un archivo quitado de la lista con su botón. */
  readonly fileRemoved = output<File>();
  /** La lista se vació, por quien usa el componente o por `clearAfterSelect`. */
  readonly cleared = output<void>();
  /** Uno de los guardados (`saved`) quitado con su ✕. */
  readonly savedRemoved = output<ScSavedFile>();

  private readonly fu = viewChild<FileUpload>('fu');

  /**
   * Por el passthrough: el nombre de la ✕ (`pcFileRemoveButton`) y el icono de «Elegir» fuera del lector. PrimeNG pone
   * `aria-label="true"` al envoltorio del icono propio (`#chooseicon`) y, sin `aria-hidden`, el botón se llamaba «true
   * Elegir»; su icono de serie lleva los dos atributos y se llama «Choose» (medido en primeng.dev, 2026-10-15).
   */
  private readonly field = createScFieldState('sc-fileupload', {
    inputId: computed(() => undefined),
    helperText: this.helperText,
  });
  protected readonly msgId = this.field.msgId;

  protected readonly pt = computed(() => {
    const label = this.removeLabel();
    const ayuda = this.helperText() ? { root: { 'aria-describedby': this.msgId() } } : {};
    return {
      pcChooseButton: { ...ayuda, icon: { 'aria-hidden': 'true' } },
      ...(label ? { pcFileRemoveButton: { root: { 'aria-label': label } } } : {}),
    };
  });

  constructor() {
    // Lo guardado, en la lista de subidos de PrimeNG. Solo lee nombre y tamaño (y el tipo, para la miniatura de una
    // imagen), así que no hace falta el contenido del archivo.
    effect(() => {
      const saved = this.saved();
      const fu = this.fu();
      if (!fu || saved === undefined) return;
      fu.uploadedFiles.set(saved.map((f) => ({ name: f.name, size: f.size, type: '' }) as unknown as File));
    });
  }

  /** Sin `url` la subida es nuestra: lo entregado pasa a subido, como tras una subida de PrimeNG que sale bien. */
  protected onUploadHandler(files: File[]): void {
    this.uploaded.emit(files);
    if (this.url() || this.clearAfterSelect()) return;
    const fu = this.fu();
    if (!fu) return;
    if (this.saved() === undefined) fu.uploadedFiles.update((ya) => [...ya, ...files]);
    queueMicrotask(() => fu.clear());
  }

  protected onRemoveUploaded(file: File): void {
    if (this.saved() !== undefined) this.savedRemoved.emit({ name: file.name, size: file.size });
  }

  protected onSelect(event: { currentFiles: File[] }): void {
    if (event.currentFiles.length === 0) return; // todo rechazado: PrimeNG ya dice por qué, y vaciar borraría el aviso
    this.filesSelected.emit(event.currentFiles);
    // `auto` entrega en la misma llamada de PrimeNG; vaciar después, ya con el evento fuera.
    if (this.clearAfterSelect()) queueMicrotask(() => this.fu()?.clear());
  }
}
