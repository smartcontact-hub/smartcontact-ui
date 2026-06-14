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
        padding: "0.75rem 1rem",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderWidth: "1px",
        borderRadius: "0"
    },
    header: {
        color: "{content.color}",
        padding: "0.75rem 1rem",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderWidth: "1px",
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
        borderWidth: "1px"
    },
    paginatorBottom: {
        borderColor: "{content.border.color}",
        borderWidth: "1px"
    }
} satisfies DataViewDesignTokens;