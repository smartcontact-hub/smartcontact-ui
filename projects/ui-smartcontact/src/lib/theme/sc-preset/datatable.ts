import type { DataTableDesignTokens } from '@primeuix/themes/types/datatable';

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
    filter: {
        rule: {
            borderColor: "{content.border.color}"
        },
        inlineGap: "var(--sc-scale-0-5)",
        constraint: {
            color: "{list.option.color}",
            padding: "{list.option.padding}",
            separator: {
                borderColor: "{content.border.color}"
            },
            focusColor: "{list.option.focus.color}",
            borderRadius: "{list.option.border.radius}",
            selectedColor: "{list.option.selected.color}",
            focusBackground: "{list.option.focus.background}",
            selectedBackground: "{list.option.selected.background}",
            selectedFocusColor: "{list.option.selected.focus.color}",
            selectedFocusBackground: "{list.option.selected.focus.background}"
        },
        overlaySelect: {
            color: "{overlay.select.color}",
            shadow: "0 0.142857rem 0.285714rem -0.142857rem #0000001a, 0 0.285714rem 0.428571rem -0.071429rem #0000001a",
            background: "{overlay.select.background}",
            borderColor: "{overlay.select.border.color}",
            borderRadius: "{overlay.select.border.radius}"
        },
        constraintList: {
            gap: "{list.gap}",
            padding: "{list.padding}"
        },
        overlayPopover: {
            gap: "var(--sc-scale-0-5)",
            color: "{overlay.popover.color}",
            shadow: "0 0.142857rem 0.285714rem -0.142857rem #0000001a, 0 0.285714rem 0.428571rem -0.071429rem #0000001a",
            padding: "{overlay.popover.padding}",
            background: "{overlay.popover.background}",
            borderColor: "{overlay.popover.border.color}",
            borderRadius: "{overlay.popover.border.radius}"
        }
    },
    footer: {
        lg: {
            padding: "var(--sc-scale-1) var(--sc-scale-1-25)"
        },
        sm: {
            padding: "var(--sc-scale-0-375) var(--sc-scale-0-5)"
        },
        color: "{content.color}",
        padding: "var(--sc-scale-0-75) var(--sc-scale-1)",
        background: "{content.background}",
        borderColor: "{datatable.border.color}",
        borderWidth: "0.071429rem"
    },
    header: {
        lg: {
            padding: "var(--sc-scale-1) var(--sc-scale-1-25)"
        },
        sm: {
            padding: "var(--sc-scale-0-375) var(--sc-scale-0-5)"
        },
        color: "{content.color}",
        padding: "var(--sc-scale-0-75) var(--sc-scale-1)",
        background: "{content.background}",
        borderColor: "{datatable.border.color}",
        borderWidth: "0.071429rem"
    },
    bodyCell: {
        lg: {
            padding: "var(--sc-scale-1) var(--sc-scale-1-25)"
        },
        sm: {
            padding: "var(--sc-scale-0-375) var(--sc-scale-0-5)"
        },
        padding: "var(--sc-scale-0-75) var(--sc-scale-1)",
        borderColor: "{datatable.border.color}"
    },
    sortIcon: {
        size: "var(--sc-scale-0-875)",
        color: "{text.muted.color}",
        hoverColor: "{text.hover.muted.color}"
    },
    dropPoint: {
        color: "{primary.color}"
    },
    footerCell: {
        lg: {
            padding: "var(--sc-scale-1) var(--sc-scale-1-25)"
        },
        sm: {
            padding: "var(--sc-scale-0-375) var(--sc-scale-0-5)"
        },
        color: "{content.color}",
        padding: "var(--sc-scale-0-75) var(--sc-scale-1)",
        background: "{content.background}",
        borderColor: "{datatable.border.color}"
    },
    headerCell: {
        lg: {
            padding: "var(--sc-scale-1) var(--sc-scale-1-25)"
        },
        sm: {
            padding: "var(--sc-scale-0-375) var(--sc-scale-0-5)"
        },
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
        borderColor: "{datatable.border.color}",
        selectedColor: "{highlight.color}",
        hoverBackground: "{content.hover.background}",
        selectedBackground: "{highlight.background}"
    },
    colorScheme: {
        dark: {
            row: {
                stripedBackground: "{surface.950}"
            },
            root: {
                borderColor: "{surface.800}"
            },
            bodyCell: {
                selectedBorderColor: "{primary.900}"
            }
        },
        light: {
            row: {
                stripedBackground: "var(--sc-cmp-datatable-row-striped-background)"
            },
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
        borderColor: "{datatable.border.color}",
        borderWidth: "0.071429rem"
    },
    columnResizer: {
        width: "var(--sc-scale-0-5)"
    },
    paginatorBottom: {
        borderColor: "{datatable.border.color}",
        borderWidth: "0.071429rem"
    },
    resizeIndicator: {
        color: "{primary.color}",
        width: "0.071429rem"
    },
    rowToggleButton: {
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
} satisfies DataTableDesignTokens;