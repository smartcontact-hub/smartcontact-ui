import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';

import { ScInputGroupComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-inputgroup-demo',
  imports: [ScInputGroupComponent, InputGroupAddonModule, InputTextModule],
  templateUrl: './inputgroup-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputGroupDemoComponent {}
