import type { ButtonDesignTokens } from '@primeuix/themes/types/button';

 export default {
    root: {
        lg: {
            fontSize: "var(--sc-cmp-button-lg-font-size)",
            paddingX: "var(--sc-cmp-button-lg-padding-x)",
            paddingY: "var(--sc-cmp-button-lg-padding-y)",
            iconOnlyWidth: "var(--sc-cmp-button-lg-icon-only-width)"
        },
        sm: {
            fontSize: "var(--sc-cmp-button-sm-font-size)",
            paddingX: "var(--sc-cmp-button-sm-padding-x)",
            paddingY: "var(--sc-cmp-button-sm-padding-y)",
            iconOnlyWidth: "var(--sc-cmp-button-sm-icon-only-width)"
        },
        gap: "var(--sc-cmp-button-gap)",
        help: {
            focusRing: {
                shadow: "none"
            }
        },
        info: {
            focusRing: {
                shadow: "none"
            }
        },
        warn: {
            focusRing: {
                shadow: "none"
            }
        },
        label: {
            fontWeight: "500"
        },
        danger: {
            focusRing: {
                shadow: "none"
            }
        },
        primary: {
            focusRing: {
                shadow: "none"
            }
        },
        success: {
            focusRing: {
                shadow: "none"
            }
        },
        contrast: {
            focusRing: {
                shadow: "none"
            }
        },
        paddingX: "var(--sc-cmp-button-padding-x)",
        paddingY: "var(--sc-cmp-button-padding-y)",
        badgeSize: "var(--sc-scale-1)",
        focusRing: {
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}"
        },
        secondary: {
            focusRing: {
                shadow: "none"
            }
        },
        borderRadius: "var(--sc-cmp-button-border-radius)",
        raisedShadow: "0 0.071429rem 0.357143rem 0 #0000001f, 0 0.142857rem 0.142857rem 0 #00000024, 0 0.214286rem 0.071429rem -0.142857rem #00000033",
        iconOnlyWidth: "var(--sc-cmp-button-icon-only-width)",
        transitionDuration: "{form.field.transition.duration}",
        roundedBorderRadius: "var(--sc-cmp-button-rounded-border-radius)"
    },
    colorScheme: {
        dark: {
            link: {
                color: "{primary.color}",
                hoverColor: "{primary.color}",
                activeColor: "{primary.color}"
            },
            root: {
                help: {
                    color: "{purple.950}",
                    focusRing: {
                        color: "{purple.400}"
                    },
                    background: "{purple.400}",
                    hoverColor: "{purple.950}",
                    activeColor: "{purple.950}",
                    borderColor: "{purple.400}",
                    hoverBackground: "{purple.300}",
                    activeBackground: "{purple.200}",
                    hoverBorderColor: "{purple.300}",
                    activeBorderColor: "{purple.200}"
                },
                info: {
                    color: "{sky.950}",
                    focusRing: {
                        color: "{sky.400}"
                    },
                    background: "{sky.400}",
                    hoverColor: "{sky.950}",
                    activeColor: "{sky.950}",
                    borderColor: "{sky.400}",
                    hoverBackground: "{sky.300}",
                    activeBackground: "{sky.200}",
                    hoverBorderColor: "{sky.300}",
                    activeBorderColor: "{sky.200}"
                },
                warn: {
                    color: "{orange.950}",
                    focusRing: {
                        color: "{orange.400}"
                    },
                    background: "{orange.400}",
                    hoverColor: "{orange.950}",
                    activeColor: "{orange.950}",
                    borderColor: "{orange.400}",
                    hoverBackground: "{orange.300}",
                    activeBackground: "{orange.200}",
                    hoverBorderColor: "{orange.300}",
                    activeBorderColor: "{orange.200}"
                },
                danger: {
                    color: "{red.950}",
                    focusRing: {
                        color: "{red.400}"
                    },
                    background: "{red.400}",
                    hoverColor: "{red.950}",
                    activeColor: "{red.950}",
                    borderColor: "{red.400}",
                    hoverBackground: "{red.300}",
                    activeBackground: "{red.200}",
                    hoverBorderColor: "{red.300}",
                    activeBorderColor: "{red.200}"
                },
                primary: {
                    color: "{primary.contrast.color}",
                    focusRing: {
                        color: "{primary.color}"
                    },
                    background: "{primary.color}",
                    hoverColor: "{primary.contrast.color}",
                    activeColor: "{primary.contrast.color}",
                    borderColor: "{primary.color}",
                    hoverBackground: "{primary.hover.color}",
                    activeBackground: "{primary.active.color}",
                    hoverBorderColor: "{primary.hover.color}",
                    activeBorderColor: "{primary.active.color}"
                },
                success: {
                    color: "{green.950}",
                    focusRing: {
                        color: "{green.400}"
                    },
                    background: "{green.400}",
                    hoverColor: "{green.950}",
                    activeColor: "{green.950}",
                    borderColor: "{green.400}",
                    hoverBackground: "{green.300}",
                    activeBackground: "{green.200}",
                    hoverBorderColor: "{green.300}",
                    activeBorderColor: "{green.200}"
                },
                contrast: {
                    color: "{surface.950}",
                    focusRing: {
                        color: "{surface.0}"
                    },
                    background: "{surface.0}",
                    hoverColor: "{surface.950}",
                    activeColor: "{surface.950}",
                    borderColor: "{surface.0}",
                    hoverBackground: "{surface.100}",
                    activeBackground: "{surface.200}",
                    hoverBorderColor: "{surface.100}",
                    activeBorderColor: "{surface.200}"
                },
                secondary: {
                    color: "{surface.300}",
                    focusRing: {
                        color: "{surface.300}"
                    },
                    background: "{surface.800}",
                    hoverColor: "{surface.200}",
                    activeColor: "{surface.100}",
                    borderColor: "{surface.800}",
                    hoverBackground: "{surface.700}",
                    activeBackground: "{surface.600}",
                    hoverBorderColor: "{surface.700}",
                    activeBorderColor: "{surface.600}"
                }
            },
            text: {
                help: {
                    color: "var(--sc-cmp-button-text-help-color)",
                    hoverBackground: "var(--sc-cmp-button-text-help-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-help-active-background)"
                },
                info: {
                    color: "var(--sc-cmp-button-text-info-color)",
                    hoverBackground: "#38bdf80a",
                    activeBackground: "#38bdf829"
                },
                warn: {
                    color: "{orange.400}",
                    hoverBackground: "var(--sc-cmp-button-text-warn-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-warn-active-background)"
                },
                plain: {
                    color: "var(--sc-cmp-button-text-plain-color)",
                    hoverBackground: "{surface.800}",
                    activeBackground: "{surface.700}"
                },
                danger: {
                    color: "var(--sc-cmp-button-text-danger-color)",
                    hoverBackground: "var(--sc-cmp-button-text-danger-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-danger-active-background)"
                },
                primary: {
                    color: "{primary.color}",
                    hoverBackground: "var(--sc-cmp-button-text-primary-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-primary-active-background)"
                },
                success: {
                    color: "var(--sc-cmp-button-text-success-color)",
                    hoverBackground: "var(--sc-cmp-button-text-success-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-success-active-background)"
                },
                contrast: {
                    color: "var(--sc-cmp-button-text-contrast-color)",
                    hoverBackground: "{surface.800}",
                    activeBackground: "{surface.700}"
                },
                secondary: {
                    color: "{surface.400}",
                    hoverBackground: "{surface.800}",
                    activeBackground: "{surface.700}"
                }
            },
            outlined: {
                help: {
                    color: "var(--sc-cmp-button-outlined-help-color)",
                    borderColor: "var(--sc-cmp-button-outlined-help-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-help-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-help-active-background)"
                },
                info: {
                    color: "var(--sc-cmp-button-outlined-info-color)",
                    borderColor: "var(--sc-cmp-button-outlined-info-border-color)",
                    hoverBackground: "#38bdf80a",
                    activeBackground: "#38bdf829"
                },
                warn: {
                    color: "{orange.400}",
                    borderColor: "{orange.700}",
                    hoverBackground: "var(--sc-cmp-button-outlined-warn-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-warn-active-background)"
                },
                plain: {
                    color: "var(--sc-cmp-button-outlined-plain-color)",
                    borderColor: "{surface.600}",
                    hoverBackground: "{surface.800}",
                    activeBackground: "{surface.700}"
                },
                danger: {
                    color: "var(--sc-cmp-button-outlined-danger-color)",
                    borderColor: "var(--sc-cmp-button-outlined-danger-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-danger-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-danger-active-background)"
                },
                primary: {
                    color: "{primary.color}",
                    borderColor: "{primary.700}",
                    hoverBackground: "var(--sc-cmp-button-outlined-primary-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-primary-active-background)"
                },
                success: {
                    color: "var(--sc-cmp-button-outlined-success-color)",
                    borderColor: "var(--sc-cmp-button-outlined-success-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-success-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-success-active-background)"
                },
                contrast: {
                    color: "var(--sc-cmp-button-outlined-contrast-color)",
                    borderColor: "{surface.500}",
                    hoverBackground: "{surface.800}",
                    activeBackground: "{surface.700}"
                },
                secondary: {
                    color: "{surface.400}",
                    borderColor: "{surface.700}",
                    hoverBackground: "var(--sc-cmp-button-outlined-secondary-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-secondary-active-background)"
                }
            }
        },
        light: {
            link: {
                color: "{primary.color}",
                hoverColor: "{primary.color}",
                activeColor: "{primary.color}"
            },
            root: {
                help: {
                    color: "#ffffffff",
                    focusRing: {
                        color: "{purple.500}"
                    },
                    background: "{purple.500}",
                    hoverColor: "#ffffffff",
                    activeColor: "#ffffffff",
                    borderColor: "{purple.500}",
                    hoverBackground: "{purple.600}",
                    activeBackground: "{purple.700}",
                    hoverBorderColor: "{purple.600}",
                    activeBorderColor: "{purple.700}"
                },
                info: {
                    color: "#ffffffff",
                    focusRing: {
                        color: "{sky.500}"
                    },
                    background: "{sky.500}",
                    hoverColor: "#ffffffff",
                    activeColor: "#ffffffff",
                    borderColor: "{sky.500}",
                    hoverBackground: "{sky.600}",
                    activeBackground: "{sky.700}",
                    hoverBorderColor: "{sky.600}",
                    activeBorderColor: "{sky.700}"
                },
                warn: {
                    color: "#ffffffff",
                    focusRing: {
                        color: "{orange.500}"
                    },
                    background: "{orange.500}",
                    hoverColor: "#ffffffff",
                    activeColor: "#ffffffff",
                    borderColor: "{orange.500}",
                    hoverBackground: "{orange.600}",
                    activeBackground: "{orange.700}",
                    hoverBorderColor: "{orange.600}",
                    activeBorderColor: "{orange.700}"
                },
                danger: {
                    color: "#ffffffff",
                    focusRing: {
                        color: "{red.500}"
                    },
                    background: "{red.500}",
                    hoverColor: "#ffffffff",
                    activeColor: "#ffffffff",
                    borderColor: "{red.500}",
                    hoverBackground: "{red.600}",
                    activeBackground: "{red.700}",
                    hoverBorderColor: "{red.600}",
                    activeBorderColor: "{red.700}"
                },
                primary: {
                    color: "{primary.contrast.color}",
                    focusRing: {
                        color: "{primary.color}"
                    },
                    background: "{primary.color}",
                    hoverColor: "{primary.contrast.color}",
                    activeColor: "{primary.contrast.color}",
                    borderColor: "{primary.color}",
                    hoverBackground: "{primary.hover.color}",
                    activeBackground: "{primary.active.color}",
                    hoverBorderColor: "{primary.hover.color}",
                    activeBorderColor: "{primary.active.color}"
                },
                success: {
                    color: "#ffffffff",
                    focusRing: {
                        color: "{green.500}"
                    },
                    background: "{green.500}",
                    hoverColor: "#ffffffff",
                    activeColor: "#ffffffff",
                    borderColor: "{green.500}",
                    hoverBackground: "{green.600}",
                    activeBackground: "{green.700}",
                    hoverBorderColor: "{green.600}",
                    activeBorderColor: "{green.700}"
                },
                contrast: {
                    color: "{surface.0}",
                    focusRing: {
                        color: "{surface.950}"
                    },
                    background: "{surface.950}",
                    hoverColor: "{surface.0}",
                    activeColor: "{surface.0}",
                    borderColor: "{surface.950}",
                    hoverBackground: "{surface.900}",
                    activeBackground: "{surface.800}",
                    hoverBorderColor: "{surface.900}",
                    activeBorderColor: "{surface.800}"
                },
                secondary: {
                    color: "{surface.600}",
                    focusRing: {
                        color: "{surface.600}"
                    },
                    background: "{surface.100}",
                    hoverColor: "{surface.700}",
                    activeColor: "{surface.800}",
                    borderColor: "{surface.100}",
                    hoverBackground: "{surface.200}",
                    activeBackground: "{surface.300}",
                    hoverBorderColor: "{surface.200}",
                    activeBorderColor: "{surface.300}"
                }
            },
            text: {
                help: {
                    color: "var(--sc-cmp-button-text-help-color)",
                    hoverBackground: "var(--sc-cmp-button-text-help-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-help-active-background)"
                },
                info: {
                    color: "var(--sc-cmp-button-text-info-color)",
                    hoverBackground: "var(--sc-cmp-button-text-info-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-info-active-background)"
                },
                warn: {
                    color: "{orange.500}",
                    hoverBackground: "{orange.50}",
                    activeBackground: "{orange.100}"
                },
                plain: {
                    color: "var(--sc-cmp-button-text-plain-color)",
                    hoverBackground: "var(--sc-cmp-button-text-plain-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-plain-active-background)"
                },
                danger: {
                    color: "var(--sc-cmp-button-text-danger-color)",
                    hoverBackground: "var(--sc-cmp-button-text-danger-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-danger-active-background)"
                },
                primary: {
                    color: "{primary.color}",
                    hoverBackground: "{primary.50}",
                    activeBackground: "{primary.100}"
                },
                success: {
                    color: "var(--sc-cmp-button-text-success-color)",
                    hoverBackground: "var(--sc-cmp-button-text-success-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-success-active-background)"
                },
                contrast: {
                    color: "var(--sc-cmp-button-text-contrast-color)",
                    hoverBackground: "var(--sc-cmp-button-text-contrast-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-contrast-active-background)"
                },
                secondary: {
                    color: "var(--sc-cmp-button-text-secondary-color)",
                    hoverBackground: "var(--sc-cmp-button-text-secondary-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-secondary-active-background)"
                }
            },
            outlined: {
                help: {
                    color: "var(--sc-cmp-button-outlined-help-color)",
                    borderColor: "var(--sc-cmp-button-outlined-help-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-help-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-help-active-background)"
                },
                info: {
                    color: "var(--sc-cmp-button-outlined-info-color)",
                    borderColor: "var(--sc-cmp-button-outlined-info-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-info-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-info-active-background)"
                },
                warn: {
                    color: "{orange.500}",
                    borderColor: "{orange.200}",
                    hoverBackground: "{orange.50}",
                    activeBackground: "{orange.100}"
                },
                plain: {
                    color: "var(--sc-cmp-button-outlined-plain-color)",
                    borderColor: "var(--sc-cmp-button-outlined-plain-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-plain-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-plain-active-background)"
                },
                danger: {
                    color: "var(--sc-cmp-button-outlined-danger-color)",
                    borderColor: "var(--sc-cmp-button-outlined-danger-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-danger-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-danger-active-background)"
                },
                primary: {
                    color: "{primary.color}",
                    borderColor: "{primary.200}",
                    hoverBackground: "{primary.50}",
                    activeBackground: "{primary.100}"
                },
                success: {
                    color: "var(--sc-cmp-button-outlined-success-color)",
                    borderColor: "var(--sc-cmp-button-outlined-success-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-success-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-success-active-background)"
                },
                contrast: {
                    color: "var(--sc-cmp-button-outlined-contrast-color)",
                    borderColor: "var(--sc-cmp-button-outlined-contrast-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-contrast-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-contrast-active-background)"
                },
                secondary: {
                    color: "var(--sc-cmp-button-outlined-secondary-color)",
                    borderColor: "var(--sc-cmp-button-outlined-secondary-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-secondary-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-secondary-active-background)"
                }
            }
        }
    }
} satisfies ButtonDesignTokens;
