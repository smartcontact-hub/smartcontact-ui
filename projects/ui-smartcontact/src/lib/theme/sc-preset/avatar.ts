import type { AvatarDesignTokens } from '@primeuix/themes/types/avatar';

 export default {
    lg: {
        icon: {
            size: "var(--sc-cmp-avatar-lg-icon-size)"
        },
        group: {
            offset: "var(--sc-cmp-avatar-lg-group-offset)"
        },
        width: "var(--sc-cmp-avatar-lg-width)",
        height: "var(--sc-cmp-avatar-lg-height)",
        fontSize: "var(--sc-scale-1-5)"
    },
    xl: {
        icon: {
            size: "var(--sc-cmp-avatar-xl-icon-size)"
        },
        group: {
            offset: "var(--sc-cmp-avatar-xl-group-offset)"
        },
        width: "var(--sc-cmp-avatar-xl-width)",
        height: "var(--sc-cmp-avatar-xl-height)",
        fontSize: "var(--sc-scale-2)"
    },
    icon: {
        size: "var(--sc-cmp-avatar-icon-size)"
    },
    root: {
        color: "{content.color}",
        width: "var(--sc-cmp-avatar-width)",
        height: "var(--sc-cmp-avatar-height)",
        fontSize: "var(--sc-scale-1)",
        background: "{content.border.color}",
        borderRadius: "{content.border.radius}"
    },
    group: {
        offset: "var(--sc-cmp-avatar-group-offset)",
        borderColor: "{content.background}"
    }
} satisfies AvatarDesignTokens;