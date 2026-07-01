import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';

import { ScClipboardService } from '../../../../ui-smartcontact/src/public-api';
import { ScIconComponent } from '../../../../ui-smartcontact-icons/src/public-api';

/** Bloque de código de una story + botón copiar (vía ScClipboardService, con feedback). */
@Component({
  selector: 'app-story-snippet',
  imports: [ScIconComponent],
  styleUrl: './storybook.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-snippet">
      <button type="button" class="sb-snippet__copy" (click)="copy()">
        <sc-icon [name]="copied() ? 'check' : 'content_copy'" [size]="13" />
        {{ copied() ? 'Copiado' : 'Copiar' }}
      </button>
      <pre><code>{{ code() }}</code></pre>
    </div>
  `,
})
export class StorySnippetComponent {
  private readonly clipboard = inject(ScClipboardService);

  readonly code = input.required<string>();
  protected readonly copied = signal(false);

  protected async copy(): Promise<void> {
    const ok = await this.clipboard.copy(this.code());
    if (!ok) return;
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1600);
  }
}
