import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import {
    resolveScIconGlyph,
    ScIconGrade,
    ScIconName,
    ScIconOpticalSize,
    ScIconSize,
    ScIconWeight
} from '../../icons/sc-icon.types';

@Component({
    selector: 'sc-icon',
    standalone: true,
    imports: [NgClass],
    templateUrl: './sc-icon.component.html',
    styleUrls: ['./sc-icon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScIconComponent {
    @Input() name: ScIconName | string | null = null;

    @Input() size: ScIconSize = 'md';

    @Input() filled = false;

    @Input() weight: ScIconWeight = 400;

    @Input() grade: ScIconGrade = 0;

    @Input() opticalSize: ScIconOpticalSize = 24;

    @Input() ariaLabel: string | null = null;

    protected get glyph(): string {
        return resolveScIconGlyph(this.name);
    }

    protected get ariaHidden(): 'true' | null {
        return this.ariaLabel ? null : 'true';
    }

    protected get iconRole(): 'img' | null {
        return this.ariaLabel ? 'img' : null;
    }

    protected get iconClasses(): Record<string, boolean> {
        return {
            'sc-icon--sm': this.size === 'sm',
            'sc-icon--md': this.size === 'md',
            'sc-icon--lg': this.size === 'lg',
            'sc-icon--filled': this.filled,
            [`sc-icon--weight-${this.weight}`]: true,
            [`sc-icon--grade-${this.grade < 0 ? 'negative-25' : this.grade}`]: true,
            [`sc-icon--optical-${this.opticalSize}`]: true
        };
    }
}
