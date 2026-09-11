export default {
    root: {
        background: "{content.background}",
        borderColor: "{content.border.color}",
        color: "{content.color}",
        borderRadius: "{content.border.radius}",
        shadow: "0 2px 4px -2px #0000001a, 0 4px 6px -1px #0000001a",
        transitionDuration: "{transition.duration}"
    },
    list: {
        padding: "{navigation.list.padding}",
        gap: "{navigation.list.gap}"
    },
    item: {
        focusBackground: "{navigation.item.focus.background}",
        activeBackground: "{navigation.item.active.background}",
        color: "{navigation.item.color}",
        focusColor: "{navigation.item.focus.color}",
        activeColor: "{navigation.item.active.color}",
        padding: "0.5rem 0.75rem",
        borderRadius: "{navigation.item.border.radius}",
        gap: "{navigation.item.gap}",
        icon: {
            color: "{navigation.item.icon.color}",
            focusColor: "{navigation.item.icon.focus.color}",
            activeColor: "{navigation.item.icon.active.color}"
        }
    },
    submenu: {
        mobileIndent: "1rem"
    },
    submenuIcon: {
        size: "{navigation.submenu.icon.size}",
        color: "{navigation.submenu.icon.color}",
        focusColor: "{navigation.submenu.icon.focus.color}",
        activeColor: "{navigation.submenu.icon.active.color}"
    },
    separator: {
        borderColor: "{content.border.color}"
    }
}