import type { DataTableDesignTokens } from '@primeuix/themes/types/datatable';

 export default {
    row: {
        color: "{content.color}",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "-1px",
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
        inlineGap: "0.5rem",
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
            shadow: "0 2px 4px -2px #0000001a, 0 4px 6px -1px #0000001a",
            background: "{overlay.select.background}",
            borderColor: "{overlay.select.border.color}",
            borderRadius: "{overlay.select.border.radius}"
        },
        constraintList: {
            gap: "{list.gap}",
            padding: "{list.padding}"
        },
        overlayPopover: {
            gap: "0.5rem",
            color: "{overlay.popover.color}",
            shadow: "0 2px 4px -2px #0000001a, 0 4px 6px -1px #0000001a",
            padding: "{overlay.popover.padding}",
            background: "{overlay.popover.background}",
            borderColor: "{overlay.popover.border.color}",
            borderRadius: "{overlay.popover.border.radius}"
        }
    },
    footer: {
        lg: {
            padding: "1rem 1.25rem"
        },
        sm: {
            padding: "0.375rem 0.5rem"
        },
        color: "{content.color}",
        padding: "0.75rem 1rem",
        background: "{content.background}",
        borderColor: "{datatable.border.color}",
        borderWidth: "1px"
    },
    header: {
        lg: {
            padding: "1rem 1.25rem"
        },
        sm: {
            padding: "0.375rem 0.5rem"
        },
        color: "{content.color}",
        padding: "0.75rem 1rem",
        background: "{content.background}",
        borderColor: "{datatable.border.color}",
        borderWidth: "1px"
    },
    bodyCell: {
        lg: {
            padding: "1rem 1.25rem"
        },
        sm: {
            padding: "0.375rem 0.5rem"
        },
        padding: "0.75rem 1rem",
        borderColor: "{datatable.border.color}"
    },
    sortIcon: {
        size: "0.875rem",
        color: "{text.muted.color}",
        hoverColor: "{text.hover.muted.color}"
    },
    dropPoint: {
        color: "{primary.color}"
    },
    footerCell: {
        lg: {
            padding: "1rem 1.25rem"
        },
        sm: {
            padding: "0.375rem 0.5rem"
        },
        color: "{content.color}",
        padding: "0.75rem 1rem",
        background: "{content.background}",
        borderColor: "{datatable.border.color}"
    },
    headerCell: {
        lg: {
            padding: "1rem 1.25rem"
        },
        sm: {
            padding: "0.375rem 0.5rem"
        },
        gap: "0.5rem",
        color: "{content.color}",
        padding: "0.75rem 1rem",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "-1px",
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
                stripedBackground: "{surface.50}"
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
        size: "2rem"
    },
    columnFooter: {
        fontWeight: "600"
    },
    paginatorTop: {
        borderColor: "{datatable.border.color}",
        borderWidth: "1px"
    },
    columnResizer: {
        width: "0.5rem"
    },
    paginatorBottom: {
        borderColor: "{datatable.border.color}",
        borderWidth: "1px"
    },
    resizeIndicator: {
        color: "{primary.color}",
        width: "1px"
    },
    rowToggleButton: {
        size: "1.75rem",
        color: "{text.muted.color}",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        hoverColor: "{text.color}",
        borderRadius: "12.25px",
        hoverBackground: "{content.hover.background}",
        selectedHoverColor: "{primary.color}",
        selectedHoverBackground: "{content.background}"
    }
} satisfies DataTableDesignTokens;