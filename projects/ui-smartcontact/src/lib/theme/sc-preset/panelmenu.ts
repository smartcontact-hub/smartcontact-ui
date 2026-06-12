import type { PanelMenuDesignTokens } from '@primeuix/themes/types/panelmenu';

 export default {
    item: {
        gap: "var(--sc-scale-0-5)",
        icon: {
            color: "{navigation.item.icon.color}",
            focusColor: "{navigation.item.icon.focus.color}"
        },
        color: "{navigation.item.color}",
        padding: "{navigation.item.padding}",
        focusColor: "{navigation.item.focus.color}",
        borderRadius: "{content.border.radius}",
        focusBackground: "{navigation.item.focus.background}"
    },
    root: {
        gap: "var(--sc-scale-0-5)",
        transitionDuration: "{transition.duration}"
    },
    panel: {
        last: {
            borderWidth: "0.071429rem",
            bottomBorderRadius: "{content.border.radius}"
        },
        color: "{content.color}",
        first: {
            borderWidth: "0.071429rem",
            topBorderRadius: "{content.border.radius}"
        },
        padding: "var(--sc-scale-0-25)",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderWidth: "0.071429rem",
        borderRadius: "{content.border.radius}"
    },
    submenu: {
        indent: "var(--sc-scale-1)"
    },
    submenuIcon: {
        color: "{navigation.submenu.icon.color}",
        focusColor: "{navigation.submenu.icon.focus.color}"
    }
} satisfies PanelMenuDesignTokens;