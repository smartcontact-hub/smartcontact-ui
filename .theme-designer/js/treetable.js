export default {
    root: {
        borderColor: "light-dark({content.border.color}, {surface.800})",
        transitionDuration: "{transition.duration}"
    },
    header: {
        background: "{content.background}",
        borderColor: "{treetable.border.color}",
        color: "{content.color}",
        borderWidth: "1px",
        padding: "0.75rem 1rem"
    },
    headerCell: {
        background: "{content.background}",
        hoverBackground: "{content.hover.background}",
        selectedBackground: "{highlight.background}",
        borderColor: "{treetable.border.color}",
        color: "{content.color}",
        hoverColor: "{content.hover.color}",
        selectedColor: "{highlight.color}",
        gap: "0.5rem",
        padding: "0.75rem 1rem",
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
        borderColor: "{treetable.border.color}",
        selectedBorderColor: "light-dark({primary.100}, {primary.900})",
        padding: "0.75rem 1rem",
        gap: "0.5rem"
    },
    footerCell: {
        background: "{content.background}",
        borderColor: "{treetable.border.color}",
        color: "{content.color}",
        padding: "0.75rem 1rem"
    },
    columnFooter: {
        fontWeight: "{primitive.typography.font.weight.semibold}"
    },
    footer: {
        background: "{content.background}",
        borderColor: "{treetable.border.color}",
        color: "{content.color}",
        borderWidth: "1px",
        padding: "0.75rem 1rem"
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
    nodeToggleButton: {
        hoverBackground: "{content.hover.background}",
        selectedHoverBackground: "{content.background}",
        color: "{text.muted.color}",
        hoverColor: "{text.color}",
        selectedHoverColor: "{primary.color}",
        size: "1.75rem",
        borderRadius: "0.875rem",
        focusRing: {
            width: "{focus.ring.width}",
            style: "{focus.ring.style}",
            color: "{focus.ring.color}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        }
    },
    paginatorTop: {
        borderColor: "{content.border.color}",
        borderWidth: "1px"
    },
    paginatorBottom: {
        borderColor: "{content.border.color}",
        borderWidth: "1px"
    }
}