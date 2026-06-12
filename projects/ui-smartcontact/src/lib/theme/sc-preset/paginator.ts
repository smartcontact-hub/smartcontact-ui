import type { PaginatorDesignTokens } from '@primeuix/themes/types/paginator';

 export default {
    root: {
        gap: "var(--sc-scale-0-25)",
        color: "{content.color}",
        padding: "var(--sc-scale-0-5) var(--sc-scale-1)",
        background: "{content.background}",
        borderRadius: "{content.border.radius}",
        transitionDuration: "{transition.duration}"
    },
    navButton: {
        color: "{text.muted.color}",
        width: "var(--sc-scale-2-5)",
        height: "var(--sc-scale-2-5)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        background: "#00000000",
        hoverColor: "{text.hover.muted.color}",
        borderRadius: "var(--sc-scale-1-25)",
        selectedColor: "{highlight.color}",
        hoverBackground: "{content.hover.background}",
        selectedBackground: "{highlight.background}"
    },
    jumpToPageInput: {
        maxWidth: "var(--sc-scale-2-5)"
    },
    currentPageReport: {
        color: "{text.muted.color}"
    }
} satisfies PaginatorDesignTokens;