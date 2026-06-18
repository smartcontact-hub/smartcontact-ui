import type { MessageDesignTokens } from '@primeuix/themes/types/message';

 export default {
    icon: {
        lg: {
            size: "var(--sc-scale-1-25)"
        },
        sm: {
            size: "var(--sc-scale-1)"
        },
        size: "var(--sc-scale-1-125)"
    },
    info: {
        shadow: "var(--sc-cmp-message-info-shadow)",
        closeButton: {
            focusRing: {
                shadow: "none"
            }
        }
    },
    root: {
        borderWidth: "0.071429rem",
        borderRadius: "{content.border.radius}",
        transitionDuration: "{transition.duration}"
    },
    text: {
        lg: {
            fontSize: "var(--sc-font-size-300)"
        },
        sm: {
            fontSize: "var(--sc-font-size-100)"
        },
        fontSize: "var(--sc-scale-1)",
        fontWeight: "500"
    },
    warn: {
        shadow: "var(--sc-cmp-message-warn-shadow)",
        closeButton: {
            focusRing: {
                shadow: "none"
            }
        }
    },
    error: {
        shadow: "var(--sc-cmp-message-error-shadow)",
        closeButton: {
            focusRing: {
                shadow: "none"
            }
        }
    },
    simple: {
        content: {
            padding: "0"
        }
    },
    content: {
        lg: {
            padding: "var(--sc-scale-0-625) var(--sc-scale-0-875)"
        },
        sm: {
            padding: "var(--sc-scale-0-375) var(--sc-scale-0-625)"
        },
        gap: "var(--sc-scale-0-5)",
        padding: "var(--sc-scale-0-5) var(--sc-scale-0-75)"
    },
    success: {
        shadow: "var(--sc-cmp-message-success-shadow)",
        closeButton: {
            focusRing: {
                shadow: "none"
            }
        }
    },
    contrast: {
        shadow: "var(--sc-cmp-message-contrast-shadow)",
        closeButton: {
            focusRing: {
                shadow: "none"
            }
        }
    },
    outlined: {
        root: {
            borderWidth: "0.071429rem"
        }
    },
    closeIcon: {
        lg: {
            size: "var(--sc-scale-1-125)"
        },
        sm: {
            size: "var(--sc-scale-0-875)"
        },
        size: "var(--sc-scale-1)"
    },
    secondary: {
        shadow: "var(--sc-cmp-message-secondary-shadow)",
        closeButton: {
            focusRing: {
                shadow: "none"
            }
        }
    },
    closeButton: {
        width: "var(--sc-scale-1-75)",
        height: "var(--sc-scale-1-75)",
        focusRing: {
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}"
        },
        borderRadius: "var(--sc-scale-0-875)"
    },
    colorScheme: {
        dark: {
            info: {
                color: "var(--sc-cmp-message-info-color)",
                simple: {
                    color: "var(--sc-cmp-message-info-simple-color)"
                },
                outlined: {
                    color: "var(--sc-cmp-message-info-outlined-color)",
                    borderColor: "var(--sc-cmp-message-info-outlined-border-color)"
                },
                background: "var(--sc-cmp-message-info-background)",
                borderColor: "var(--sc-cmp-message-info-border-color)",
                closeButton: {
                    focusRing: {
                        color: "var(--sc-cmp-message-info-close-button-focus-ring-color)"
                    },
                    hoverBackground: "var(--sc-cmp-message-info-close-button-hover-background)"
                }
            },
            warn: {
                color: "{yellow.500}",
                simple: {
                    color: "{yellow.500}"
                },
                outlined: {
                    color: "{yellow.500}",
                    borderColor: "{yellow.500}"
                },
                background: "var(--sc-cmp-message-warn-background)",
                borderColor: "var(--sc-cmp-message-warn-border-color)",
                closeButton: {
                    focusRing: {
                        color: "{yellow.500}"
                    },
                    hoverBackground: "var(--sc-cmp-message-warn-close-button-hover-background)"
                }
            },
            error: {
                color: "var(--sc-cmp-message-error-color)",
                simple: {
                    color: "var(--sc-cmp-message-error-simple-color)"
                },
                outlined: {
                    color: "var(--sc-cmp-message-error-outlined-color)",
                    borderColor: "var(--sc-cmp-message-error-outlined-border-color)"
                },
                background: "var(--sc-cmp-message-error-background)",
                borderColor: "var(--sc-cmp-message-error-border-color)",
                closeButton: {
                    focusRing: {
                        color: "var(--sc-cmp-message-error-close-button-focus-ring-color)"
                    },
                    hoverBackground: "var(--sc-cmp-message-error-close-button-hover-background)"
                }
            },
            success: {
                color: "var(--sc-cmp-message-success-color)",
                simple: {
                    color: "var(--sc-cmp-message-success-simple-color)"
                },
                outlined: {
                    color: "var(--sc-cmp-message-success-outlined-color)",
                    borderColor: "var(--sc-cmp-message-success-outlined-border-color)"
                },
                background: "var(--sc-cmp-message-success-background)",
                borderColor: "var(--sc-cmp-message-success-border-color)",
                closeButton: {
                    focusRing: {
                        color: "var(--sc-cmp-message-success-close-button-focus-ring-color)"
                    },
                    hoverBackground: "var(--sc-cmp-message-success-close-button-hover-background)"
                }
            },
            contrast: {
                color: "{surface.950}",
                simple: {
                    color: "var(--sc-cmp-message-contrast-simple-color)"
                },
                outlined: {
                    color: "var(--sc-cmp-message-contrast-outlined-color)",
                    borderColor: "var(--sc-cmp-message-contrast-outlined-border-color)"
                },
                background: "var(--sc-cmp-message-contrast-background)",
                borderColor: "{surface.100}",
                closeButton: {
                    focusRing: {
                        color: "{surface.950}"
                    },
                    hoverBackground: "{surface.100}"
                }
            },
            secondary: {
                color: "{surface.300}",
                simple: {
                    color: "{surface.400}"
                },
                outlined: {
                    color: "{surface.400}",
                    borderColor: "{surface.400}"
                },
                background: "{surface.800}",
                borderColor: "{surface.700}",
                closeButton: {
                    focusRing: {
                        color: "{surface.300}"
                    },
                    hoverBackground: "{surface.700}"
                }
            }
        },
        light: {
            info: {
                color: "var(--sc-cmp-message-info-color)",
                simple: {
                    color: "var(--sc-cmp-message-info-simple-color)"
                },
                outlined: {
                    color: "var(--sc-cmp-message-info-outlined-color)",
                    borderColor: "var(--sc-cmp-message-info-outlined-border-color)"
                },
                background: "var(--sc-cmp-message-info-background)",
                borderColor: "var(--sc-cmp-message-info-border-color)",
                closeButton: {
                    focusRing: {
                        color: "var(--sc-cmp-message-info-close-button-focus-ring-color)"
                    },
                    hoverBackground: "var(--sc-cmp-message-info-close-button-hover-background)"
                }
            },
            warn: {
                color: "{yellow.600}",
                simple: {
                    color: "{yellow.600}"
                },
                outlined: {
                    color: "{yellow.600}",
                    borderColor: "{yellow.600}"
                },
                background: "var(--sc-cmp-message-warn-background)",
                borderColor: "{yellow.200}",
                closeButton: {
                    focusRing: {
                        color: "{yellow.600}"
                    },
                    hoverBackground: "{yellow.100}"
                }
            },
            error: {
                color: "var(--sc-cmp-message-error-color)",
                simple: {
                    color: "var(--sc-cmp-message-error-simple-color)"
                },
                outlined: {
                    color: "var(--sc-cmp-message-error-outlined-color)",
                    borderColor: "var(--sc-cmp-message-error-outlined-border-color)"
                },
                background: "var(--sc-cmp-message-error-background)",
                borderColor: "var(--sc-cmp-message-error-border-color)",
                closeButton: {
                    focusRing: {
                        color: "var(--sc-cmp-message-error-close-button-focus-ring-color)"
                    },
                    hoverBackground: "var(--sc-cmp-message-error-close-button-hover-background)"
                }
            },
            success: {
                color: "var(--sc-cmp-message-success-color)",
                simple: {
                    color: "var(--sc-cmp-message-success-simple-color)"
                },
                outlined: {
                    color: "var(--sc-cmp-message-success-outlined-color)",
                    borderColor: "var(--sc-cmp-message-success-outlined-border-color)"
                },
                background: "var(--sc-cmp-message-success-background)",
                borderColor: "var(--sc-cmp-message-success-border-color)",
                closeButton: {
                    focusRing: {
                        color: "var(--sc-cmp-message-success-close-button-focus-ring-color)"
                    },
                    hoverBackground: "var(--sc-cmp-message-success-close-button-hover-background)"
                }
            },
            contrast: {
                color: "var(--sc-cmp-message-contrast-color)",
                simple: {
                    color: "var(--sc-cmp-message-contrast-simple-color)"
                },
                outlined: {
                    color: "var(--sc-cmp-message-contrast-outlined-color)",
                    borderColor: "var(--sc-cmp-message-contrast-outlined-border-color)"
                },
                background: "var(--sc-cmp-message-contrast-background)",
                borderColor: "var(--sc-cmp-message-contrast-border-color)",
                closeButton: {
                    focusRing: {
                        color: "var(--sc-cmp-message-contrast-close-button-focus-ring-color)"
                    },
                    hoverBackground: "var(--sc-cmp-message-contrast-close-button-hover-background)"
                }
            },
            secondary: {
                color: "var(--sc-cmp-message-secondary-color)",
                simple: {
                    color: "var(--sc-cmp-message-secondary-simple-color)"
                },
                outlined: {
                    color: "var(--sc-cmp-message-secondary-outlined-color)",
                    borderColor: "var(--sc-cmp-message-secondary-outlined-border-color)"
                },
                background: "var(--sc-cmp-message-secondary-background)",
                borderColor: "var(--sc-cmp-message-secondary-border-color)",
                closeButton: {
                    focusRing: {
                        color: "var(--sc-cmp-message-secondary-close-button-focus-ring-color)"
                    },
                    hoverBackground: "var(--sc-cmp-message-secondary-close-button-hover-background)"
                }
            }
        }
    }
} satisfies MessageDesignTokens;