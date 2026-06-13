import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AvatarGroupModule } from 'primeng/avatargroup';

/**
 * Grupo de avatares (spec Figma AvatarGroup): apila `sc-avatar` proyectados
 * con el offset del Kit (`avatar.group.offset` vía preset).
 */
@Component({
    selector: 'sc-avatargroup',
    standalone: true,
    imports: [AvatarGroupModule],
    template: `
        <p-avatar-group>
            <ng-content></ng-content>
        </p-avatar-group>
    `,
    // El offset estructural de PrimeUIX (.p-avatar + .p-avatar) no atraviesa
    // los hosts <sc-avatar> proyectados: se re-aplica aquí con los valores del
    // Kit (avatar.group.offset / lg / xl) vía aliases semánticos.
    styles: `
        :host ::ng-deep sc-avatar + sc-avatar .p-avatar {
            margin-left: var(--sc-spacing-neg-0-75);
        }
        :host ::ng-deep sc-avatar + sc-avatar .p-avatar-lg {
            margin-left: var(--sc-spacing-neg-1);
        }
        :host ::ng-deep sc-avatar + sc-avatar .p-avatar-xl {
            margin-left: var(--sc-spacing-neg-1-5);
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScAvatarGroupComponent {}
