import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

import { SC_ICON_SIZE_3XL, SC_ICON_SIZE_LG, ScIconComponent } from '@smartcontact/icons';

import { AvatarIllustrationPool, buildIllustrationSrc } from '../../core/avatar-illustration';
import { SC_PHOTO_UPLOAD_TRANSLATIONS } from './i18n/sc-photo-upload.translations';

const MAX_BYTES = 800 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

/**
 * Selector de foto de entidad. **Bespoke as-is** (decisión §10): input file
 * nativo + `FileReader` (no `p-fileupload`) — 1:1 con el origen. Preview circular
 * con overlay de cámara en hover; sin foto cae al **fallback de ilustración**
 * (§4.2) por hash del nombre, usando el helper compartido
 * `buildIllustrationSrc` (misma fuente que `sc-avatar`).
 *
 * `MessageService` (PrimeNG) se inyecta **opcional**: los toasts de validación
 * degradan si no hay infra de toast. i18n colocado en `sc.photoUpload.*`. Iconos
 * vía `@smartcontact/icons` (§4.6).
 */
@Component({
  selector: 'sc-photo-upload',
  standalone: true,
  imports: [ScIconComponent, TranslateModule],
  templateUrl: './sc-photo-upload.component.html',
  styleUrl: './sc-photo-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScPhotoUploadComponent {
  private readonly messages = inject(MessageService, { optional: true });
  private readonly translate = inject(TranslateService);

  readonly photo = input<string | null | undefined>(null);
  readonly name = input<string | null | undefined>(null);
  /** Override del aria-label cuando hay foto; default colocado `…changePhoto`. */
  readonly ariaLabel = input<string | null>(null);
  readonly size = input<'md' | 'sm'>('md');
  readonly illustrationPool = input<AvatarIllustrationPool>('illustrated');
  readonly illustrationBase = input<string>('assets/avatars');

  readonly photoChange = output<string | null>();

  protected readonly cameraIcon = 'photo_camera';
  protected readonly placeholderIcon = 'manage_accounts';
  protected readonly iconSize3xl = SC_ICON_SIZE_3XL;
  protected readonly iconSizeLg = SC_ICON_SIZE_LG;
  protected readonly hovering = signal(false);

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  constructor() {
    // Copy fijo colocado: registra solo el diccionario del componente.
    for (const [language, dict] of Object.entries(SC_PHOTO_UPLOAD_TRANSLATIONS)) {
      this.translate.setTranslation(language, dict, true);
    }
  }

  protected illustrationSrc(name: string): string {
    return buildIllustrationSrc(name, this.illustrationPool(), this.illustrationBase());
  }

  protected openPicker(): void {
    this.fileInput().nativeElement.click();
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.messages?.add({
        severity: 'error',
        summary: this.translate.instant('sc.photoUpload.invalidType'),
        life: 3500,
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      this.messages?.add({
        severity: 'error',
        summary: this.translate.instant('sc.photoUpload.tooLarge'),
        life: 3500,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') this.photoChange.emit(result);
    };
    reader.readAsDataURL(file);
  }

  protected onRemove(): void {
    this.photoChange.emit(null);
  }
}
