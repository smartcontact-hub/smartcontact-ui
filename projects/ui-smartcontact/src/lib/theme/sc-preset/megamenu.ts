import type { MegaMenuDesignTokens } from '@primeuix/themes/types/megamenu';

 export default {
    item: {
        gap: "{navigation.item.gap}",
        icon: {
            color: "{navigation.item.icon.color}",
            focusColor: "{navigation.item.icon.focus.color}",
            activeColor: "{navigation.item.icon.active.color}"
        },
        color: "{navigation.item.color}",
        padding: "{navigation.item.padding}",
        focusColor: "{navigation.item.focus.color}",
        activeColor: "{navigation.item.active.color}",
        borderRadius: "{navigation.item.border.radius}",
        focusBackground: "{navigation.item.focus.background}",
        activeBackground: "{navigation.item.active.background}"
    },
    root: {
        gap: "var(--sc-scale-0-5)",
        color: "{content.color}",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}",
        transitionDuration: "{transition.duration}",
        verticalOrientation: {
            gap: "{navigation.list.gap}",
            padding: "{navigation.list.padding}"
        },
        horizontalOrientation: {
            gap: "var(--sc-scale-0-5)",
            padding: "var(--sc-scale-0-5) var(--sc-scale-0-75)"
        }
    },
    overlay: {
        gap: "var(--sc-scale-0-5)",
        color: "{content.color}",
        shadow: "0 0.142857rem 0.285714rem -0.142857rem #0000001a, 0 0.285714rem 0.428571rem -0.071429rem #0000001a",
        padding: "0",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}"
    },
    submenu: {
        gap: "{navigation.list.gap}",
        padding: "{navigation.list.padding}"
    },
    baseItem: {
        padding: "{navigation.item.padding}",
        borderRadius: "{content.border.radius}"
    },
    separator: {
        borderColor: "{content.border.color}"
    },
    submenuIcon: {
        size: "{navigation.submenu.icon.size}",
        color: "{navigation.submenu.icon.color}",
        focusColor: "{navigation.submenu.icon.focus.color}",
        activeColor: "{navigation.submenu.icon.active.color}"
    },
    mobileButton: {
        size: "var(--sc-scale-1-75)",
        color: "{text.muted.color}",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        hoverColor: "{text.hover.muted.color}",
        borderRadius: "var(--sc-scale-0-875)",
        hoverBackground: "{content.hover.background}"
    },
    submenuLabel: {
        color: "{navigation.submenu.label.color}",
        padding: "{navigation.submenu.label.padding}",
        background: "{navigation.submenu.label.background}",
        fontWeight: "{navigation.submenu.label.font.weight}"
    }
} satisfies MegaMenuDesignTokens;