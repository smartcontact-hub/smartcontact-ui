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
        padding: "var(--sc-cmp-galleria-caption-padding)",
        background: "#00000080"
    },
    navIcon: {
        size: "var(--sc-cmp-galleria-nav-icon-size)"
    },
    navButton: {
        next: {
            borderRadius: "var(--sc-cmp-galleria-nav-button-next-border-radius)"
        },
        prev: {
            borderRadius: "var(--sc-cmp-galleria-nav-button-prev-border-radius)"
        },
        size: "var(--sc-cmp-galleria-nav-button-size)",
        color: "{surface.100}",
        gutter: "var(--sc-cmp-galleria-nav-button-gutter)",
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
        size: "var(--sc-cmp-galleria-close-button-size)",
        color: "{surface.50}",
        gutter: "var(--sc-cmp-galleria-close-button-gutter)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        background: "#ffffff1a",
        hoverColor: "{surface.0}",
        borderRadius: "var(--sc-cmp-galleria-close-button-border-radius)",
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
        gap: "var(--sc-cmp-galleria-indicator-list-gap)",
        padding: "var(--sc-cmp-galleria-indicator-list-padding)"
    },
    closeButtonIcon: {
        size: "var(--sc-cmp-galleria-close-button-icon-size)"
    },
    indicatorButton: {
        width: "var(--sc-cmp-galleria-indicator-button-width)",
        height: "var(--sc-cmp-galleria-indicator-button-height)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        borderRadius: "var(--sc-cmp-galleria-indicator-button-border-radius)",
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
        size: "var(--sc-cmp-galleria-thumbnail-nav-button-size)",
        gutter: "var(--sc-cmp-galleria-thumbnail-nav-button-gutter)",
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
        size: "var(--sc-cmp-galleria-thumbnail-nav-button-icon-size)"
    }
} satisfies GalleriaDesignTokens;