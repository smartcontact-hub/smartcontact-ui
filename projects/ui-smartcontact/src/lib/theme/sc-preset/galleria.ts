import type { GalleriaDesignTokens } from '@primeuix/themes/types/galleria';

 export default {
    root: {
        borderColor: "{content.border.color}",
        borderWidth: "0.071429rem",
        borderRadius: "{content.border.radius}",
        transitionDuration: "{transition.duration}"
    },
    caption: {
        color: "{surface.100}",
        padding: "var(--sc-scale-1)",
        background: "#00000080"
    },
    navIcon: {
        size: "var(--sc-scale-1-5)"
    },
    navButton: {
        next: {
            borderRadius: "var(--sc-scale-1-5)"
        },
        prev: {
            borderRadius: "var(--sc-scale-1-5)"
        },
        size: "var(--sc-scale-3)",
        color: "{surface.100}",
        gutter: "var(--sc-scale-0-5)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        background: "#ffffff1a",
        hoverColor: "{surface.0}",
        hoverBackground: "#ffffff33"
    },
    closeButton: {
        size: "var(--sc-scale-3)",
        color: "{surface.50}",
        gutter: "var(--sc-scale-0-5)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        background: "#ffffff1a",
        hoverColor: "{surface.0}",
        borderRadius: "var(--sc-scale-1-5)",
        hoverBackground: "#ffffff33"
    },
    colorScheme: {
        dark: {
            indicatorButton: {
                background: "{surface.700}",
                hoverBackground: "{surface.600}"
            },
            thumbnailNavButton: {
                color: "{surface.400}",
                hoverColor: "var(--sc-cmp-galleria-thumbnail-nav-button-hover-color)",
                hoverBackground: "{surface.700}"
            }
        },
        light: {
            indicatorButton: {
                background: "var(--sc-cmp-galleria-indicator-button-background)",
                hoverBackground: "var(--sc-cmp-galleria-indicator-button-hover-background)"
            },
            thumbnailNavButton: {
                color: "var(--sc-cmp-galleria-thumbnail-nav-button-color)",
                hoverColor: "var(--sc-cmp-galleria-thumbnail-nav-button-hover-color)",
                hoverBackground: "var(--sc-cmp-galleria-thumbnail-nav-button-hover-background)"
            }
        }
    },
    indicatorList: {
        gap: "var(--sc-scale-0-5)",
        padding: "var(--sc-scale-1)"
    },
    closeButtonIcon: {
        size: "var(--sc-scale-1-5)"
    },
    indicatorButton: {
        width: "var(--sc-scale-1)",
        height: "var(--sc-scale-1)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        borderRadius: "var(--sc-scale-0-5)",
        activeBackground: "{primary.color}"
    },
    thumbnailsContent: {
        padding: "var(--sc-scale-1) var(--sc-scale-0-25)",
        background: "{content.background}"
    },
    insetIndicatorList: {
        background: "#00000080"
    },
    thumbnailNavButton: {
        size: "var(--sc-scale-2)",
        gutter: "var(--sc-scale-0-5)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        borderRadius: "{content.border.radius}"
    },
    insetIndicatorButton: {
        background: "#ffffff66",
        hoverBackground: "#ffffff99",
        activeBackground: "#ffffffe5"
    },
    thumbnailNavButtonIcon: {
        size: "var(--sc-scale-1)"
    }
} satisfies GalleriaDesignTokens;