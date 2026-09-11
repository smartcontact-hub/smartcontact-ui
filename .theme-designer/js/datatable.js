export default {
    root: {
        transitionDuration: "{transition.duration}",
        borderColor: "light-dark({content.border.color}, {surface.800})"
    },
    header: {
        background: "{content.background}",
        borderColor: "{datatable.border.color}",
        color: "{content.color}",
        borderWidth: "1px",
        padding: "0.75rem 1rem",
        sm: {
            padding: "0.375rem 0.5rem"
        },
        lg: {
            padding: "1rem 1.25rem"
        }
    },
    headerCell: {
        background: "{content.background}",
        hoverBackground: "{content.hover.background}",
        selectedBackground: "{highlight.background}",
        borderColor: "{datatable.border.color}",
        color: "{content.color}",
        hoverColor: "{content.hover.color}",
        selectedColor: "{highlight.color}",
        gap: "0.5rem",
        padding: "0.75rem 1rem",
        sm: {
            padding: "0.375rem 0.5rem"
        },
        lg: {
            padding: "1rem 1.25rem"
        },
        focusRing: {
            width: "{focus.ring.width}",
            style: "{focus.ring.style}",
            color: "{focus.ring.color}",
            offset: "-1px",
            shadow: "none"
        }
    },
    columnTitle: {
        fontWeight: "{primitive.typography.font.weight.semibold}"
    },
    row: {
        background: "{content.background}",
        hoverBackground: "{content.hover.background}",
        selectedBackground: "{highlight.background}",
        stripedBackground: "light-dark({surface.50}, {surface.950})",
        color: "{content.color}",
        hoverColor: "{content.hover.color}",
        selectedColor: "{highlight.color}",
        focusRing: {
            width: "{focus.ring.width}",
            style: "{focus.ring.style}",
            color: "{focus.ring.color}",
            offset: "-1px",
            shadow: "none"
        }
    },
    bodyCell: {
        borderColor: "{datatable.border.color}",
        selectedBorderColor: "light-dark({primary.100}, {primary.900})",
        padding: "0.75rem 1rem",
        sm: {
            padding: "0.375rem 0.5rem"
        },
        lg: {
            padding: "1rem 1.25rem"
        }
    },
    footerCell: {
        background: "{content.background}",
        borderColor: "{datatable.border.color}",
        color: "{content.color}",
        padding: "0.75rem 1rem",
        sm: {
            padding: "0.375rem 0.5rem"
        },
        lg: {
            padding: "1rem 1.25rem"
        }
    },
    columnFooter: {
        fontWeight: "{primitive.typography.font.weight.semibold}"
    },
    footer: {
        background: "{content.background}",
        borderColor: "{datatable.border.color}",
        color: "{content.color}",
        borderWidth: "1px",
        padding: "0.75rem 1rem",
        sm: {
            padding: "0.375rem 0.5rem"
        },
        lg: {
            padding: "1rem 1.25rem"
        }
    },
    dropPoint: {
        color: "{primary.color}"
    },
    columnResizer: {
        width: "0.5rem"
    },
    resizeIndicator: {
        width: "1px",
        color: "{primary.color}"
    },
    sortIcon: {
        color: "{text.muted.color}",
        hoverColor: "{text.hover.muted.color}",
        size: "0.875rem"
    },
    loadingIcon: {
        size: "2rem"
    },
    rowToggleButton: {
        hoverBackground: "{content.hover.background}",
        selectedHoverBackground: "{content.background}",
        color: "{text.muted.color}",
        hoverColor: "{text.color}",
        selectedHoverColor: "{primary.color}",
        size: "1.75rem",
        borderRadius: "12.25px",
        focusRing: {
            width: "{focus.ring.width}",
            style: "{focus.ring.style}",
            color: "{focus.ring.color}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        }
    },
    filter: {
        inlineGap: "0.5rem",
        overlaySelect: {
            background: "{overlay.select.background}",
            borderColor: "{overlay.select.border.color}",
            borderRadius: "{overlay.select.border.radius}",
            color: "{overlay.select.color}",
            shadow: "0 2px 4px -2px #0000001a, 0 4px 6px -1px #0000001a"
        },
        overlayPopover: {
            background: "{overlay.popover.background}",
            borderColor: "{overlay.popover.border.color}",
            borderRadius: "{overlay.popover.border.radius}",
            color: "{overlay.popover.color}",
            shadow: "0 2px 4px -2px #0000001a, 0 4px 6px -1px #0000001a",
            padding: "{overlay.popover.padding}",
            gap: "0.5rem"
        },
        rule: {
            borderColor: "{content.border.color}"
        },
        constraintList: {
            padding: "{list.padding}",
            gap: "{list.gap}"
        },
        constraint: {
            focusBackground: "{list.option.focus.background}",
            selectedBackground: "{list.option.selected.background}",
            selectedFocusBackground: "{list.option.selected.focus.background}",
            color: "{list.option.color}",
            focusColor: "{list.option.focus.color}",
            selectedColor: "{list.option.selected.color}",
            selectedFocusColor: "{list.option.selected.focus.color}",
            separator: {
                borderColor: "{content.border.color}"
            },
            padding: "{list.option.padding}",
            borderRadius: "{list.option.border.radius}"
        }
    },
    paginatorTop: {
        borderColor: "{datatable.border.color}",
        borderWidth: "1px"
    },
    paginatorBottom: {
        borderColor: "{datatable.border.color}",
        borderWidth: "1px"
    }
}