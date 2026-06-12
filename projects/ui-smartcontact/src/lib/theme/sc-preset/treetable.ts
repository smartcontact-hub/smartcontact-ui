import type { TreeTableDesignTokens } from '@primeuix/themes/types/treetable';

 export default {
    row: {
        color: "{content.color}",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "-0.071429rem",
            shadow: "none"
        },
        background: "{content.background}",
        hoverColor: "{content.hover.color}",
        selectedColor: "{highlight.color}",
        hoverBackground: "{content.hover.background}",
        selectedBackground: "{highlight.background}"
    },
    root: {
        transitionDuration: "{transition.duration}"
    },
    footer: {
        color: "{content.color}",
        padding: "var(--sc-scale-0-75) var(--sc-scale-1)",
        background: "{content.background}",
        borderColor: "{treetable.border.color}",
        borderWidth: "0.071429rem"
    },
    header: {
        color: "{content.color}",
        padding: "var(--sc-scale-0-75) var(--sc-scale-1)",
        background: "{content.background}",
        borderColor: "{treetable.border.color}",
        borderWidth: "0.071429rem"
    },
    bodyCell: {
        gap: "var(--sc-scale-0-5)",
        padding: "var(--sc-scale-0-75) var(--sc-scale-1)",
        borderColor: "{treetable.border.color}"
    },
    sortIcon: {
        size: "var(--sc-scale-0-875)",
        color: "{text.muted.color}",
        hoverColor: "{text.hover.muted.color}"
    },
    footerCell: {
        color: "{content.color}",
        padding: "var(--sc-scale-0-75) var(--sc-scale-1)",
        background: "{content.background}",
        borderColor: "{treetable.border.color}"
    },
    headerCell: {
        gap: "var(--sc-scale-0-5)",
        color: "{content.color}",
        padding: "var(--sc-scale-0-75) var(--sc-scale-1)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "-0.071429rem",
            shadow: "none"
        },
        background: "{content.background}",
        hoverColor: "{content.hover.color}",
        borderColor: "{treetable.border.color}",
        selectedColor: "{highlight.color}",
        hoverBackground: "{content.hover.background}",
        selectedBackground: "{highlight.background}"
    },
    colorScheme: {
        dark: {
            root: {
                borderColor: "{surface.800}"
            },
            bodyCell: {
                selectedBorderColor: "{primary.900}"
            }
        },
        light: {
            root: {
                borderColor: "{content.border.color}"
            },
            bodyCell: {
                selectedBorderColor: "{primary.100}"
            }
        }
    },
    columnTitle: {
        fontWeight: "600"
    },
    loadingIcon: {
        size: "var(--sc-scale-2)"
    },
    columnFooter: {
        fontWeight: "600"
    },
    paginatorTop: {
        borderColor: "{content.border.color}",
        borderWidth: "0.071429rem"
    },
    columnResizer: {
        width: "var(--sc-scale-0-5)"
    },
    paginatorBottom: {
        borderColor: "{content.border.color}",
        borderWidth: "0.071429rem"
    },
    resizeIndicator: {
        color: "{primary.color}",
        width: "0.071429rem"
    },
    nodeToggleButton: {
        size: "var(--sc-scale-1-75)",
        color: "{text.muted.color}",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        hoverColor: "{text.color}",
        borderRadius: "var(--sc-scale-0-875)",
        hoverBackground: "{content.hover.background}",
        selectedHoverColor: "{primary.color}",
        selectedHoverBackground: "{content.background}"
    }
} satisfies TreeTableDesignTokens;