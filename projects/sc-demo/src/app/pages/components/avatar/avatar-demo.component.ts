import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScAvatarComponent, ScAvatarGroupComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-avatar-demo',
  imports: [ScAvatarComponent, ScAvatarGroupComponent],
  templateUrl: './avatar-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarDemoComponent {}
