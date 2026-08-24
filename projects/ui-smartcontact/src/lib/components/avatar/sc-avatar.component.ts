import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
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
    readonly label = input<string | null>(null);

    readonly icon = input<string | null>(null);

    readonly image = input<string | null>(null);

    readonly size = input<ScAvatarSize>('normal');

    readonly shape = input<ScAvatarShape>('circle');

    readonly ariaLabel = input<string | null>(null);

    /** Badge superpuesto (spec Figma Avatar+Badge). `null` = sin badge. */
    readonly badge = input<string | number | null>(null);

    readonly badgeVariant = input<ScSeverity>('danger');

    /**
     * Nombre para el fallback de ilustración (§4.2). Cuando `image` es null y
     * esto está informado, el avatar pinta el SVG hasheado del pool elegido.
     */
    readonly illustrationName = input<string | null>(null);

    readonly illustrationPool = input<AvatarIllustrationPool>('illustrated');

    /** Base de los assets de ilustración (el consumidor los sirve). */
    readonly illustrationBase = input('assets/avatars');

    readonly imageError = output<unknown>();

    protected readonly avatarIcon = computed<string | undefined>(() =>
        resolveScComponentIconClass(this.icon())
    );

    /** Image src efectiva: la foto si existe, si no el fallback de ilustración. */
    protected readonly resolvedImage = computed<string | null>(() => {
        const image = this.image();

        if (image) {
            return image;
        }

        const illustrationName = this.illustrationName();

        if (illustrationName) {
            return buildIllustrationSrc(illustrationName, this.illustrationPool(), this.illustrationBase());
        }

        return null;
    });

    /**
     * Accessible name efectivo. Cuando se pinta la ILUSTRACIÓN (sin foto) y el
     * consumidor no dio `ariaLabel`, el nombre ES el accesible name — paridad con
     * el `role="img" aria-label="{name}"` del retirado `sc-illustrated-avatar`.
     * Sin esto, el `<img>` del p-avatar (que no lleva `alt`, solo
     * `[attr.aria-label]="ariaLabel"`) quedaría sin nombre accesible.
     */
    protected readonly resolvedAriaLabel = computed<string | null>(() => {
        const ariaLabel = this.ariaLabel();

        if (ariaLabel) {
            return ariaLabel;
        }

        const illustrationName = this.illustrationName();

        if (!this.image() && illustrationName) {
            return illustrationName;
        }

        return null;
    });

    protected readonly badgeValue = computed<string>(() => {
        const badge = this.badge();

        return badge == null ? '' : String(badge);
    });

    protected readonly badgeSeverity = computed<PrimeBadgeSeverity>(() => {
        const badgeVariant = this.badgeVariant();

        if (badgeVariant === 'primary') {
            return undefined;
        }

        if (badgeVariant === 'warning') {
            return 'warn';
        }

        return badgeVariant;
    });
}
