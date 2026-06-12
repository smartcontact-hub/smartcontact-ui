import type { ImageDesignTokens } from '@primeuix/themes/types/image';

 export default {
    root: {
        transitionDuration: "{transition.duration}"
    },
    action: {
        size: "var(--sc-scale-3)",
        color: "{surface.50}",
        iconSize: "var(--sc-scale-1-5)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        hoverColor: "{surface.0}",
        borderRadius: "var(--sc-scale-1-5)",
        hoverBackground: "#ffffff1a"
    },
    preview: {
        icon: {
            size: "var(--sc-scale-1-5)"
        },
        mask: {
            color: "{mask.color}",
            background: "{mask.background}"
        }
    },
    toolbar: {
        gap: "var(--sc-scale-0-5)",
        blur: "0.571429rem",
        padding: "var(--sc-scale-0-5)",
        position: {
            top: "var(--sc-scale-1)",
            left: "auto",
            right: "var(--sc-scale-1)",
            bottom: "auto"
        },
        background: "#ffffff1a",
        borderColor: "#ffffff33",
        borderWidth: "0.071429rem",
        borderRadius: "2.142857rem"
    }
} satisfies ImageDesignTokens;