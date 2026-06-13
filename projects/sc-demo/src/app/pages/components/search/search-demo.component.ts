import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ScSearchComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-search-demo',
  imports: [ScSearchComponent, FormsModule],
  templateUrl: './search-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchDemoComponent {
  readonly term = signal('');
}
