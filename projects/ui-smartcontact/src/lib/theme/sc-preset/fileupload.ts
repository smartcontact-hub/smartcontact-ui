import type { FileUploadDesignTokens } from '@primeuix/themes/types/fileupload';

 export default {
    file: {
        gap: "var(--sc-scale-1)",
        info: {
            gap: "var(--sc-scale-0-5)"
        },
        padding: "var(--sc-scale-1)",
        borderColor: "{content.border.color}"
    },
    root: {
        color: "{content.color}",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}",
        transitionDuration: "{transition.duration}"
    },
    basic: {
        gap: "var(--sc-scale-0-5)"
    },
    header: {
        gap: "var(--sc-scale-0-5)",
        color: "{text.color}",
        padding: "var(--sc-scale-1-125)",
        background: "#00000000",
        borderColor: "#00000000",
        borderWidth: "0",
        borderRadius: "0"
    },
    content: {
        gap: "var(--sc-scale-1)",
        padding: "0 var(--sc-scale-1-125) var(--sc-scale-1-125)",
        highlightBorderColor: "{primary.color}"
    },
    fileList: {
        gap: "var(--sc-scale-0-5)"
    },
    progressbar: {
        height: "var(--sc-scale-0-25)"
    }
} satisfies FileUploadDesignTokens;