import type { MenuDesignTokens } from '@primeuix/themes/types/menu';

 export default {
    item: {
        gap: "{navigation.item.gap}",
        icon: {
            color: "{navigation.item.icon.color}",
            focusColor: "{navigation.item.icon.focus.color}"
        },
        color: "{navigation.item.color}",
        padding: "{navigation.item.padding}",
        focusColor: "{navigation.item.focus.color}",
        borderRadius: "{navigation.item.border.radius}",
        focusBackground: "{navigation.item.focus.background}"
    },
    list: {
        gap: "{navigation.list.gap}",
        padding: "{navigation.list.padding}"
    },
    root: {
        color: "{content.color}",
        shadow: "0 2px 4px -2px #0000001a, 0 4px 6px -1px #0000001a",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}",
        transitionDuration: "{transition.duration}"
    },
    separator: {
        borderColor: "{content.border.color}"
    },
    submenuLabel: {
        color: "{navigation.submenu.label.color}",
        padding: "{navigation.submenu.label.padding}",
        background: "{navigation.submenu.label.background}",
        fontWeight: "{navigation.submenu.label.font.weight}"
    }
} satisfies MenuDesignTokens;