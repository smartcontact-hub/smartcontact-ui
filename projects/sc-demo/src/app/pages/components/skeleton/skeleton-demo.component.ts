import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScSkeletonComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-skeleton-demo',
  imports: [ScSkeletonComponent],
  templateUrl: './skeleton-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonDemoComponent {}
