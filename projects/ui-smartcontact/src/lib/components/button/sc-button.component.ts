import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output
} from '@angular/core';
import { ButtonModule } from 'primeng/button';

import { resolveScComponentIconClass } from '../../core/icons/sc-component-icon-resolver';
import {
    ScButtonAppearance,
    ScButtonIconPosition,
    ScButtonIconSize,
    ScButtonSize,
    ScButtonType,
    ScButtonVariant
} from '../../core/types/button.types';

type PrimeButtonSeverity = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast';
type PrimeButtonSize = 'small' | 'large' | undefined;

@Component({
    selector: 'sc-button',
    standalone: true,
    imports: [ButtonModule],
    templateUrl: './sc-button.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScButtonComponent {
    @Input() label = '';

    @Input() variant: ScButtonVariant = 'primary';

    @Input() appearance: ScButtonAppearance = 'filled';

    @Input() size: ScButtonSize = 'md';

    @Input() disabled = false;

    @Input() loading = false;

    @Input() fullWidth = false;

    @Input() type: ScButtonType = 'button';

    @Input() icon: string | null = null;

    @Input() iconPosition: ScButtonIconPosition = 'left';

    @Input() iconSize: ScButtonIconSize | null = null;

    @Input() iconFilled = false;

    @Input() iconAriaLabel: string | null = null;

    @Input() ariaLabel: string | null = null;

    @Input() rounded = false;

    @Output() clicked = new EventEmitter<MouseEvent>();

    protected get isInteractionDisabled(): boolean {
        return this.disabled || this.loading;
    }

    protected get buttonSeverity(): PrimeButtonSeverity {
        return this.variant;
    }

    protected get buttonSize(): PrimeButtonSize {
        if (this.size === 'sm') {
            return 'small';
        }

        if (this.size === 'lg') {
            return 'large';
        }

        return undefined;
    }

    protected get outlined(): boolean {
        return this.appearance === 'outlined';
    }

    protected get text(): boolean {
        return this.appearance === 'text';
    }

    protected get link(): boolean {
        return this.appearance === 'link';
    }

    protected get buttonIcon(): string | undefined {
        return resolveScComponentIconClass(this.icon, {
            filled: this.iconFilled,
            size: this.iconSize
        });
    }

    protected get buttonAriaLabel(): string | undefined {
        const ariaLabel = this.ariaLabel?.trim();

        if (ariaLabel) {
            return ariaLabel;
        }

        if (!this.label.trim()) {
            return this.iconAccessibleLabel ?? undefined;
        }

        return undefined;
    }

    protected get iconAccessibleLabel(): string | null {
        return this.iconAriaLabel?.trim() || null;
    }

    protected get iconAriaHidden(): 'true' | null {
        return this.iconAccessibleLabel ? null : 'true';
    }

    protected get iconRole(): 'img' | null {
        return this.iconAccessibleLabel ? 'img' : null;
    }

    protected buttonIconClass(iconClass: string, buttonIcon: string): string {
        return [iconClass, buttonIcon].filter(Boolean).join(' ');
    }

    protected onClick(event: MouseEvent): void {
        if (this.isInteractionDisabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        this.clicked.emit(event);
    }
}
