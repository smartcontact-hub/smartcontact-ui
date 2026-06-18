import type { TieredMenuDesignTokens } from '@primeuix/themes/types/tieredmenu';

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
    list: {
        gap: "{navigation.list.gap}",
        padding: "{navigation.list.padding}"
    },
    root: {
        color: "{content.color}",
        shadow: "var(--sc-cmp-tieredmenu-shadow)",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}",
        transitionDuration: "{transition.duration}"
    },
    submenu: {
        mobileIndent: "var(--sc-scale-1)"
    },
    separator: {
        borderColor: "{content.border.color}"
    },
    submenuIcon: {
        size: "{navigation.submenu.icon.size}",
        color: "{navigation.submenu.icon.color}",
        focusColor: "{navigation.submenu.icon.focus.color}",
        activeColor: "{navigation.submenu.icon.active.color}"
    }
} satisfies TieredMenuDesignTokens;