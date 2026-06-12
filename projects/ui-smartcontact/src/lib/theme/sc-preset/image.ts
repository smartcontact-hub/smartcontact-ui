import type { ImageDesignTokens } from '@primeuix/themes/types/image';

 export default {
    root: {
        transitionDuration: "{transition.duration}"
    },
    action: {
        size: "3rem",
        color: "{surface.50}",
        iconSize: "1.5rem",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        hoverColor: "{surface.0}",
        borderRadius: "1.5rem",
        hoverBackground: "#ffffff1a"
    },
    preview: {
        icon: {
            size: "1.5rem"
        },
        mask: {
            color: "{mask.color}",
            background: "{mask.background}"
        }
    },
    toolbar: {
        gap: "0.5rem",
        blur: "0.571429rem",
        padding: "0.5rem",
        position: {
            top: "1rem",
            left: "auto",
            right: "1rem",
            bottom: "auto"
        },
        background: "#ffffff1a",
        borderColor: "#ffffff33",
        borderWidth: "0.071429rem",
        borderRadius: "2.142857rem"
    }
} satisfies ImageDesignTokens;