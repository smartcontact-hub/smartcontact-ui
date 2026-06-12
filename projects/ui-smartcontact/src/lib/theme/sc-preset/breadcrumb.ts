import type { BreadcrumbDesignTokens } from '@primeuix/themes/types/breadcrumb';

 export default {
    item: {
        gap: "{navigation.item.gap}",
        icon: {
            color: "{navigation.item.icon.color}",
            hoverColor: "{navigation.item.icon.focus.color}"
        },
        color: "{text.muted.color}",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        hoverColor: "{text.color}",
        borderRadius: "{content.border.radius}"
    },
    root: {
        gap: "var(--sc-scale-0-5)",
        padding: "var(--sc-scale-1)",
        background: "{content.background}",
        transitionDuration: "{transition.duration}"
    },
    separator: {
        color: "{navigation.item.icon.color}"
    }
} satisfies BreadcrumbDesignTokens;