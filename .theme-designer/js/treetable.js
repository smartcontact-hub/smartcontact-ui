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
    footer: {
        color: "{content.color}",
        padding: "0.75rem 1rem",
        background: "{content.background}",
        borderColor: "{treetable.border.color}",
        borderWidth: "1px"
    },
    header: {
        color: "{content.color}",
        padding: "0.75rem 1rem",
        background: "{content.background}",
        borderColor: "{treetable.border.color}",
        borderWidth: "1px"
    },
    bodyCell: {
        gap: "0.5rem",
        padding: "0.75rem 1rem",
        borderColor: "{treetable.border.color}"
    },
    sortIcon: {
        size: "0.875rem",
        color: "{text.muted.color}",
        hoverColor: "{text.hover.muted.color}"
    },
    footerCell: {
        color: "{content.color}",
        padding: "0.75rem 1rem",
        background: "{content.background}",
        borderColor: "{treetable.border.color}"
    },
    headerCell: {
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
        size: "2rem"
    },
    columnFooter: {
        fontWeight: "600"
    },
    paginatorTop: {
        borderColor: "{content.border.color}",
        borderWidth: "1px"
    },
    columnResizer: {
        width: "0.5rem"
    },
    paginatorBottom: {
        borderColor: "{content.border.color}",
        borderWidth: "1px"
    },
    resizeIndicator: {
        color: "{primary.color}",
        width: "1px"
    },
    nodeToggleButton: {
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
        borderRadius: "0.875rem",
        hoverBackground: "{content.hover.background}",
        selectedHoverColor: "{primary.color}",
        selectedHoverBackground: "{content.background}"
    }
}