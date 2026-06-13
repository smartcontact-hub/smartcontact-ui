import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ScPhotoUploadComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-photoupload-demo',
  imports: [ScPhotoUploadComponent],
  templateUrl: './photoupload-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoUploadDemoComponent {
  readonly photo = signal<string | null>(null);

  onPhotoChange(p: string | null): void {
    this.photo.set(p);
  }
}
