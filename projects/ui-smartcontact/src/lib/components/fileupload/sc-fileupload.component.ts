import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';

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
 *   - **`auto` por defecto**: el archivo se entrega al elegirlo y desaparecen los botones «Subir» y «Cancelar».
 *   - **`clearAfterSelect`** para quien guarda el archivo en otro sitio (un campo del formulario): la lista se vacía
 *     tras entregar, así el nombre no se pinta dos veces.
 *   - **Los textos llegan traducidos.** PrimeNG los toma de su locale (inglés); `chooseLabel`, `dropLabel` y los
 *     avisos de tipo y tamaño se pasan escritos en el idioma de la pantalla.
 *   - **La plantilla `#empty` va dentro**, con el texto de `dropLabel` (la consulta de `p-fileupload` no ve una
 *     plantilla que atraviesa dos proyecciones, como en `sc-selectbutton`).
 *
 * Uso:
 * ```html
 * <sc-fileupload
 *   accept=".wav,audio/wav"
 *   chooseLabel="Elegir .wav"
 *   dropLabel="o suelta un .wav aquí."
 *   [clearAfterSelect]="true"
 *   (filesSelected)="onFiles($event)"
 * />
 * ```
 *
 * Figma: `❖ FileUpload` del Smart Contact Prime kit (pendiente de nodo, `docs/figma-pendiente.md`).
 */
@Component({
  selector: 'sc-fileupload',
  standalone: true,
  imports: [FileUploadModule],
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

  /** Texto del botón de elegir, traducido. */
  readonly chooseLabel = input<string>();
  /** Icono del botón de elegir (por defecto, el de PrimeNG). */
  readonly chooseIcon = input<string>();
  /** Texto de la zona de soltar, traducido. Sin él, la zona queda vacía. */
  readonly dropLabel = input<string>();
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

  private readonly fu = viewChild<FileUpload>('fu');

  protected onSelect(event: { currentFiles: File[] }): void {
    if (event.currentFiles.length === 0) return; // todo rechazado: PrimeNG ya dice por qué, y vaciar borraría el aviso
    this.filesSelected.emit(event.currentFiles);
    // `auto` entrega en la misma llamada de PrimeNG; vaciar después, ya con el evento fuera.
    if (this.clearAfterSelect()) queueMicrotask(() => this.fu()?.clear());
  }
}
