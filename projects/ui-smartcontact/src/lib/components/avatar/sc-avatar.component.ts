import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { OverlayBadgeModule } from 'primeng/overlaybadge';

import { resolveScComponentIconClass } from '../../core/icons/sc-component-icon-resolver';
import { ScAvatarShape, ScAvatarSize, ScSeverity } from '../../core/types/theme-component.types';
import { AvatarIllustrationPool, buildIllustrationSrc } from '../../core/avatar-illustration';

type PrimeBadgeSeverity = 'secondary' | 'info' | 'success' | 'warn' | 'danger' | 'contrast' | undefined;

/**
 * Avatar 1:1 con la spec del Kit (Type Label/Icon/Image · Size 28/42/56 ·
 * Circle). El Badge de la spec se compone sobre `p-overlaybadge` cuando se
 * informa `badge`; el agrupado vive en `sc-avatargroup`.
 *
 * Fallback de ilustración (§4.2): si no hay `image` pero sí `illustrationName`,
 * el avatar pinta una ilustración SVG estable por hash del nombre (cara Image).
 * El paquete NO empaqueta los SVG — el consumidor los sirve bajo
 * `illustrationBase` (default `assets/avatars`). Ver `core/avatar-illustration`.
 */
@Component({
    selector: 'sc-avatar',
    standalone: true,
    imports: [NgTemplateOutlet, AvatarModule, OverlayBadgeModule],
    templateUrl: './sc-avatar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScAvatarComponent {
    @Input() label: string | null = null;

    @Input() icon: string | null = null;

    @Input() image: string | null = null;

    @Input() size: ScAvatarSize = 'normal';

    @Input() shape: ScAvatarShape = 'circle';

    @Input() ariaLabel: string | null = null;

    /** Badge superpuesto (spec Figma Avatar+Badge). `null` = sin badge. */
    @Input() badge: string | number | null = null;

    @Input() badgeVariant: ScSeverity = 'danger';

    /**
     * Nombre para el fallback de ilustración (§4.2). Cuando `image` es null y
     * esto está informado, el avatar pinta el SVG hasheado del pool elegido.
     */
    @Input() illustrationName: string | null = null;

    @Input() illustrationPool: AvatarIllustrationPool = 'illustrated';

    /** Base de los assets de ilustración (el consumidor los sirve). */
    @Input() illustrationBase = 'assets/avatars';

    @Output() imageError = new EventEmitter<unknown>();

    protected get avatarIcon(): string | undefined {
        return resolveScComponentIconClass(this.icon);
    }

    /** Image src efectiva: la foto si existe, si no el fallback de ilustración. */
    protected get resolvedImage(): string | null {
        if (this.image) {
            return this.image;
        }
        if (this.illustrationName) {
            return buildIllustrationSrc(this.illustrationName, this.illustrationPool, this.illustrationBase);
        }
        return null;
    }

    protected get badgeValue(): string {
        return this.badge == null ? '' : String(this.badge);
    }

    protected get badgeSeverity(): PrimeBadgeSeverity {
        if (this.badgeVariant === 'primary') {
            return undefined;
        }

        if (this.badgeVariant === 'warning') {
            return 'warn';
        }

        return this.badgeVariant;
    }
}
