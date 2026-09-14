import type { DataViewDesignTokens } from '@primeuix/themes/types/dataview';

 export default {
    root: {
        padding: "0",
        borderColor: "#00000000",
        borderWidth: "0",
        borderRadius: "0"
    },
    footer: {
        color: "{content.color}",
        padding: "var(--sc-cmp-dataview-footer-padding-y) var(--sc-cmp-dataview-footer-padding-x)",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderWidth: "0.071429rem",
        borderRadius: "0"
    },
    header: {
        color: "{content.color}",
        padding: "var(--sc-cmp-dataview-header-padding-y) var(--sc-cmp-dataview-header-padding-x)",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderWidth: "0.071429rem",
        borderRadius: "0"
    },
    content: {
        color: "{content.color}",
        padding: "0",
        background: "{content.background}",
        borderColor: "#00000000",
        borderWidth: "0",
        borderRadius: "0"
    },
    paginatorTop: {
        borderColor: "{content.border.color}",
        borderWidth: "0.071429rem"
    },
    paginatorBottom: {
        borderColor: "{content.border.color}",
        borderWidth: "0.071429rem"
    }
} satisfies DataViewDesignTokens;