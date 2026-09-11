export default {
    root: {
        transitionDuration: "{transition.duration}"
    },
    track: {
        background: "{content.border.color}",
        borderRadius: "{content.border.radius}",
        size: "3px"
    },
    range: {
        background: "{primary.color}"
    },
    handle: {
        width: "20px",
        height: "20px",
        borderRadius: "10px",
        background: "{content.border.color}",
        hoverBackground: "{content.border.color}",
        content: {
            borderRadius: "8px",
            background: "light-dark({surface.0}, {surface.950})",
            hoverBackground: "{content.background}",
            width: "16px",
            height: "16px",
            shadow: "0 1px 1px 0 #00000024, 0 1px 0 0 #00000014"
        },
        focusRing: {
            width: "{focus.ring.width}",
            style: "{focus.ring.style}",
            color: "{focus.ring.color}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        }
    }
}