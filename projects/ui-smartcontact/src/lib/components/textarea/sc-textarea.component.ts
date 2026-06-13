import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TextareaModule } from 'primeng/textarea';

import { ScComponentSize, ScInputVariant } from '../../core/types/theme-component.types';

type PrimeTextareaSize = 'small' | 'large' | undefined;

@Component({
    selector: 'sc-textarea',
    standalone: true,
    imports: [TextareaModule],
    templateUrl: './sc-textarea.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScTextareaComponent {
    @Input() value = '';

    @Input() placeholder = '';

    @Input() rows = 3;

    @Input() cols: number | null = null;

    @Input() inputId: string | null = null;

    @Input() name: string | null = null;

    @Input() disabled = false;

    @Input() readonly = false;

    @Input() invalid = false;

    @Input() fluid = false;

    @Input() autoResize = false;

    @Input() size: ScComponentSize = 'md';

    @Input() variant: ScInputVariant = 'outlined';

    @Output() valueChange = new EventEmitter<string>();

    @Output() resized = new EventEmitter<unknown>();

    protected get textareaSize(): PrimeTextareaSize {
        if (this.size === 'sm') {
            return 'small';
        }

        if (this.size === 'lg') {
            return 'large';
        }

        return undefined;
    }

    protected onInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        this.value = textarea.value;
        this.valueChange.emit(textarea.value);
    }
}
