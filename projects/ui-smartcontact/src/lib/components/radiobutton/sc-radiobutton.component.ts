import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RadioButtonModule } from 'primeng/radiobutton';

import { ScComponentSize, ScInputVariant } from '../../core/types/theme-component.types';

type PrimeRadioButtonSize = 'small' | 'large' | undefined;

@Component({
    selector: 'sc-radiobutton',
    standalone: true,
    imports: [FormsModule, RadioButtonModule],
    templateUrl: './sc-radiobutton.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScRadioButtonComponent {
    @Input() value: unknown = null;

    @Input() modelValue: unknown = null;

    @Input() inputId: string | null = null;

    @Input() name: string | null = null;

    @Input() ariaLabel: string | null = null;

    @Input() size: ScComponentSize = 'md';

    @Input() variant: ScInputVariant = 'outlined';

    @Output() modelValueChange = new EventEmitter<unknown>();

    @Output() clicked = new EventEmitter<unknown>();

    protected get radioName(): string {
        return this.name ?? '';
    }

    protected get radioSize(): PrimeRadioButtonSize {
        if (this.size === 'sm') {
            return 'small';
        }

        if (this.size === 'lg') {
            return 'large';
        }

        return undefined;
    }

    protected onModelValueChange(value: unknown): void {
        this.modelValue = value;
        this.modelValueChange.emit(value);
    }
}
