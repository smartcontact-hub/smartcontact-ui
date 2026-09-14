import type { PaginatorDesignTokens } from '@primeuix/themes/types/paginator';

 export default {
    root: {
        gap: "var(--sc-cmp-paginator-gap)",
        color: "{content.color}",
        padding: "var(--sc-cmp-paginator-padding-y) var(--sc-cmp-paginator-padding-x)",
        background: "{content.background}",
        borderRadius: "{content.border.radius}",
        transitionDuration: "{transition.duration}"
    },
    navButton: {
        color: "{text.muted.color}",
        width: "var(--sc-cmp-paginator-nav-button-width)",
        height: "var(--sc-cmp-paginator-nav-button-height)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        background: "#00000000",
        hoverColor: "{text.hover.muted.color}",
        borderRadius: "var(--sc-cmp-paginator-nav-button-border-radius)",
        selectedColor: "{highlight.color}",
        hoverBackground: "{content.hover.background}",
        selectedBackground: "{highlight.background}"
    },
    jumpToPageInput: {
        maxWidth: "var(--sc-cmp-paginator-jump-to-page-input-max-width)"
    },
    currentPageReport: {
        color: "{text.muted.color}"
    }
} satisfies PaginatorDesignTokens;