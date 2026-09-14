import type { ImageDesignTokens } from '@primeuix/themes/types/image';

 export default {
    root: {
        transitionDuration: "{transition.duration}"
    },
    action: {
        size: "var(--sc-cmp-image-action-size)",
        color: "{surface.50}",
        iconSize: "var(--sc-cmp-image-action-icon-size)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        hoverColor: "{surface.0}",
        borderRadius: "var(--sc-cmp-image-action-border-radius)",
        hoverBackground: "#ffffff1a"
    },
    preview: {
        icon: {
            size: "var(--sc-cmp-image-preview-icon-size)"
        },
        mask: {
            color: "{mask.color}",
            background: "{mask.background}"
        }
    },
    toolbar: {
        gap: "var(--sc-cmp-image-toolbar-gap)",
        blur: "0.571429rem",
        padding: "var(--sc-cmp-image-toolbar-padding)",
        position: {
            top: "var(--sc-cmp-image-toolbar-position-top)",
            left: "auto",
            right: "var(--sc-cmp-image-toolbar-position-right)",
            bottom: "auto"
        },
        background: "#ffffff1a",
        borderColor: "#ffffff33",
        borderWidth: "0.071429rem",
        borderRadius: "2.142857rem"
    }
} satisfies ImageDesignTokens;