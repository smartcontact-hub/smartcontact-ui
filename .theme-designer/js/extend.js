export default {
    primitive: {
        typography: {
            font: {
                weight: {
                    regular: "400px",
                    medium: "500px",
                    semibold: "600px",
                    bold: "700px"
                },
                size: {
                    100: "12px",
                    200: "14px",
                    300: "16px",
                    400: "18px",
                    450: "20px",
                    500: "24px",
                    650: "32px",
                    800: "48px",
                    900: "64px"
                },
                family: {
                    inter: "Inter"
                },
                style: {
                    regular: "Regular",
                    medium: "Medium",
                    semibold: "Semi Bold",
                    bold: "Bold"
                }
            },
            line: {
                height: {
                    100: "18px",
                    200: "20px",
                    300: "24px",
                    450: "28px",
                    500: "36px",
                    650: "40px",
                    800: "58px",
                    900: "78px"
                }
            }
        }
    },
    semantic: {
        text: {
            accent: "{violet.400}"
        },
        presence: {
            available: "{green.400}",
            unavailable: "{red.400}",
            administrative: "{red.600}",
            talking: "{cyan.400}",
            wrapup: "{cyan.600}"
        }
    },
    component: {
        custommodal: {
            background: "{overlay.modal.background}",
            color: "{overlay.modal.color}",
            border: {
                color: "{overlay.modal.border.color}",
                radius: "{overlay.modal.border.radius}"
            },
            header: {
                padding: "{overlay.modal.padding}",
                gap: "0.5rem"
            },
            subheader: {
                padding: "{overlay.modal.padding}",
                gap: "0.5rem",
                color: "{form.field.float.label.color}"
            },
            title: {
                font: {
                    size: "{primitive.typography.font.size.400}",
                    weight: "{primitive.typography.font.weight.semibold}"
                }
            },
            footer: {
                gap: "0.5rem",
                padding: {
                    top: "0",
                    right: "{overlay.modal.padding}",
                    bottom: "{overlay.modal.padding}",
                    left: "{overlay.modal.padding}"
                }
            },
            content: {
                padding: {
                    top: "0",
                    right: "{overlay.modal.padding}",
                    bottom: "{overlay.modal.padding}",
                    left: "{overlay.modal.padding}"
                }
            },
            error: {
                background: "#ef444429",
                color: "{red.500}",
                border: {
                    color: "#b91c1c5c"
                }
            },
            warn: {
                background: "#eab30829",
                color: "{yellow.300}",
                border: {
                    color: "#a162075c"
                }
            }
        },
        dialog: {
            icon: {
                color: "{overlay.modal.color}"
            }
        }
    },
    app: {
        typography: {
            sm: {
                fontSize: "{primitive.typography.font.size.100}",
                lineHeight: "{primitive.typography.line.height.100}"
            },
            md: {
                fontSize: "{primitive.typography.font.size.200}",
                lineHeight: "{primitive.typography.line.height.200}"
            },
            lg: {
                fontSize: "{primitive.typography.font.size.300}",
                lineHeight: "{primitive.typography.line.height.300}"
            },
            xl: {
                fontSize: "{primitive.typography.font.size.400}",
                lineHeight: "{primitive.typography.line.height.300}"
            },
            xxl: {
                fontSize: "{primitive.typography.font.size.450}",
                lineHeight: "{primitive.typography.line.height.450}"
            }
        }
    }
}