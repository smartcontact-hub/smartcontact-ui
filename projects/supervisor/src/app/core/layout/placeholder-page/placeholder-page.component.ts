import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Generic "section under construction" page used for routes that exist in the
 * navigation tree but are not yet implemented (mirrors PlaceholderPage in the
 * React prototype).
 */
@Component({
  selector: 'sc-placeholder-page',
  imports: [TranslateModule],
  templateUrl: './placeholder-page.component.html',
  styleUrl: './placeholder-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceholderPageComponent {}
