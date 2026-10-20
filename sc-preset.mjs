// <stdin>
import { definePreset as definePreset2 } from "@primeuix/themes";

// projects/ui-smartcontact/src/lib/theme/sc-preset/index.ts
import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

// projects/ui-smartcontact/src/lib/theme/sc-preset/base.ts
var families = {
  red: "red",
  sky: "sky",
  blue: "blue",
  slate: "slate",
  zinc: "zinc",
  // `amber` ya no lo referencia nada nuestro (0 `{amber.N}` en el repo tras mover
  // warn a yellow), pero se queda: esto alimenta el bloque `primitive` del preset y
  // Aura puede resolver `{amber.N}` por dentro. Borrarlo ahorra una rampa de
  // custom properties y arriesga un slot de PrimeNG que no podemos enumerar.
  amber: "amber",
  green: "green",
  purple: "purple",
  orange: "yellow",
  yellow: "yellow"
};
var STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
var ramp = (scToken) => Object.fromEntries(STEPS.map((step) => [step, `var(--sc-color-${scToken}-${step})`]));
var surface = {
  0: "var(--sc-color-slate-0)",
  ...ramp("slate")
};
var surfaceDark = {
  0: "var(--sc-color-slate-0)",
  ...ramp("zinc")
};
var primaryScheme = {
  color: "var(--sc-bg-primary)",
  contrastColor: "var(--sc-text-on-primary)",
  hoverColor: "var(--sc-bg-primary-hover)",
  activeColor: "var(--sc-bg-primary-active)"
};
var textScheme = {
  color: "var(--sc-text-primary)",
  mutedColor: "var(--sc-text-secondary)"
};
var contentScheme = {
  background: "var(--sc-bg-surface)",
  hoverBackground: "var(--sc-bg-secondary-hover)",
  borderColor: "var(--sc-border-default)",
  color: "var(--sc-text-primary)"
};
var overlayScheme = {
  modal: {
    background: "var(--sc-bg-surface)",
    borderColor: "var(--sc-border-default)",
    color: "var(--sc-text-primary)"
  },
  popover: {
    background: "var(--sc-bg-surface)",
    borderColor: "var(--sc-border-default)",
    color: "var(--sc-text-primary)"
  },
  select: {
    background: "var(--sc-bg-elevated)",
    borderColor: "var(--sc-border-default)",
    color: "var(--sc-text-primary)"
  }
};
var listScheme = {
  option: {
    icon: {
      color: "var(--sc-icon-subtle)",
      focusColor: "var(--sc-text-secondary)"
    },
    color: "{text.color}",
    focusColor: "{text.hover.color}",
    selectedColor: "{highlight.color}",
    focusBackground: "var(--sc-bg-secondary-hover)",
    selectedBackground: "{highlight.background}",
    selectedFocusColor: "{highlight.focus.color}",
    selectedFocusBackground: "{highlight.focus.background}"
  },
  optionGroup: {
    color: "{text.muted.color}",
    background: "transparent"
  }
};
var navigationScheme = {
  item: {
    icon: {
      color: "var(--sc-icon-subtle)",
      focusColor: "var(--sc-text-secondary)",
      activeColor: "var(--sc-text-secondary)"
    },
    color: "{text.color}",
    focusColor: "{text.hover.color}",
    activeColor: "{text.hover.color}",
    focusBackground: "var(--sc-bg-secondary-hover)",
    activeBackground: "var(--sc-bg-secondary-hover)"
  },
  submenuIcon: {
    color: "var(--sc-icon-subtle)",
    focusColor: "var(--sc-text-secondary)",
    activeColor: "var(--sc-text-secondary)"
  },
  submenuLabel: {
    color: "{text.muted.color}",
    background: "transparent"
  }
};
var formFieldScheme = {
  color: "var(--sc-text-primary)",
  iconColor: "var(--sc-icon-subtle)",
  disabledBackground: "var(--sc-bg-disabled)",
  disabledColor: "var(--sc-text-disabled)",
  placeholderColor: "var(--sc-text-subtle)",
  focusBorderColor: "var(--sc-bg-primary)",
  invalidPlaceholderColor: "var(--sc-text-danger)",
  floatLabelColor: "var(--sc-text-subtle)",
  floatLabelFocusColor: "var(--sc-text-subtle)",
  floatLabelActiveColor: "var(--sc-text-subtle)",
  floatLabelInvalidColor: "{form.field.invalid.placeholder.color}",
  shadow: "var(--sc-cmp-form-field-shadow)"
};
var base_default = {
  primitive: {
    ...Object.fromEntries(Object.entries(families).map(([kit, sc]) => [kit, ramp(sc)])),
    borderRadius: {
      none: "0",
      xs: "var(--sc-radius-xs)",
      sm: "var(--sc-radius-sm)",
      md: "var(--sc-radius-md)",
      lg: "var(--sc-radius-lg)",
      xl: "var(--sc-radius-xl)"
    }
  },
  semantic: {
    primary: ramp("blue"),
    iconSize: "var(--sc-cmp-icon-size)",
    /*
     * `lineHeight: 'inherit'` DEVUELVE LA HERENCIA que había antes de Aura (2026-09-13).
     * PrimeNG pone en la raíz de TODOS sus componentes
     * `.p-component { line-height: var(--p-typography-line-height) }`. Sin Aura esa variable
     * no existía, el valor salía inválido y cada componente heredaba el de su página. Aura
     * la define a `1.5`, que en el Supervisor no se nota (su body ya va a 1.5) pero en sc-docs
     * movió 15 componentes de 20px a 21px, medido por `component-styles`.
     * Cómo funciona: `inherit` en una variable declarada en `:root` no tiene de quién
     * heredar, así que la variable queda sin valor y `var()` vuelve a ser inválido, que es
     * justo el estado de antes. Los tamaños de letra de Aura SÍ se quedan: esos arreglaban
     * menús y desplegables que se abrían a 16px en el `<body>`.
     */
    typography: {
      lineHeight: "inherit"
    },
    focusRing: {
      // Divergencia consciente vs Kit (navy, width 1): sky-500 más ancho por
      // contraste a11y — customs-catalog §1.1.
      color: "var(--sc-border-focus)",
      style: "solid",
      width: "var(--sc-focus-ring-width)",
      offset: "var(--sc-focus-ring-offset)",
      shadow: "none"
    },
    disabledOpacity: "0.6",
    transitionDuration: "var(--sc-transition-base)",
    anchorGutter: "0.142857rem",
    content: {
      borderRadius: "{border.radius.md}"
    },
    list: {
      gap: "0.142857rem",
      padding: "var(--sc-scale-0-25)",
      header: {
        padding: "var(--sc-scale-0-5) var(--sc-scale-1) var(--sc-scale-0-25)"
      },
      option: {
        padding: "var(--sc-cmp-list-option-padding-y) var(--sc-cmp-list-option-padding-x)",
        borderRadius: "{border.radius.sm}"
      },
      optionGroup: {
        padding: "var(--sc-cmp-list-option-group-padding-y) var(--sc-cmp-list-option-group-padding-x)",
        fontWeight: "600"
      }
    },
    overlay: {
      modal: {
        padding: "var(--sc-cmp-overlay-modal-padding)",
        borderRadius: "var(--sc-cmp-overlay-modal-border-radius)",
        shadow: "var(--sc-cmp-overlay-modal-shadow)"
      },
      popover: {
        padding: "var(--sc-cmp-overlay-popover-padding)",
        borderRadius: "var(--sc-cmp-overlay-popover-border-radius)",
        shadow: "var(--sc-cmp-overlay-popover-shadow)"
      },
      select: {
        borderRadius: "var(--sc-cmp-overlay-select-border-radius)",
        shadow: "var(--sc-cmp-overlay-select-shadow)"
      },
      navigation: {
        shadow: "var(--sc-cmp-overlay-navigation-shadow)"
      }
    },
    formField: {
      // Padding 10/6 + sm/lg 1:1 del export del Kit (valores de Aura desde DD-81) (form.field.*) — los
      // tokens de escala caen exactos. Aplica a todos los form fields PrimeNG.
      paddingX: "var(--sc-cmp-form-field-padding-x)",
      paddingY: "var(--sc-cmp-form-field-padding-y)",
      sm: {
        fontSize: "var(--sc-cmp-form-field-sm-font-size)",
        paddingX: "var(--sc-cmp-form-field-sm-padding-x)",
        paddingY: "var(--sc-cmp-form-field-sm-padding-y)"
      },
      lg: {
        fontSize: "var(--sc-cmp-form-field-lg-font-size)",
        paddingX: "var(--sc-cmp-form-field-lg-padding-x)",
        paddingY: "var(--sc-cmp-form-field-lg-padding-y)"
      },
      borderRadius: "var(--sc-cmp-form-field-border-radius)",
      transitionDuration: "var(--sc-transition-base)",
      shadow: "var(--sc-cmp-form-field-shadow)"
    },
    navigation: {
      item: {
        gap: "var(--sc-scale-0-5)",
        padding: "var(--sc-cmp-navigation-item-padding-y) var(--sc-cmp-navigation-item-padding-x)",
        borderRadius: "{border.radius.sm}"
      },
      list: {
        gap: "0.142857rem",
        padding: "var(--sc-scale-0-25)"
      },
      submenuIcon: {
        size: "var(--sc-cmp-navigation-submenu-icon-size)"
      },
      submenuLabel: {
        padding: "var(--sc-cmp-navigation-submenu-label-padding-y) var(--sc-cmp-navigation-submenu-label-padding-x)",
        fontWeight: "600"
      }
    },
    colorScheme: {
      light: {
        surface,
        primary: primaryScheme,
        text: textScheme,
        content: contentScheme,
        overlay: overlayScheme,
        list: listScheme,
        navigation: navigationScheme,
        formField: {
          ...formFieldScheme,
          background: "var(--sc-bg-surface)"
        },
        highlight: {
          color: "{primary.700}",
          background: "{primary.50}",
          focusColor: "{primary.800}",
          focusBackground: "{primary.100}"
        }
      },
      dark: {
        surface: surfaceDark,
        primary: primaryScheme,
        text: textScheme,
        content: contentScheme,
        overlay: overlayScheme,
        list: listScheme,
        navigation: navigationScheme,
        formField: {
          ...formFieldScheme,
          // Inputs "embebidos" en dark: mismo fondo que el lienzo (frame
          // 9795:26786 del Kit), no un paso más claro.
          background: "var(--sc-bg-default)"
        },
        // Sin token semántico propio: receta de Aura (el primario oscuro translúcido
        // al 16 % y al 24 %). Hasta DD-81 era esmeralda-400, copiado tal cual del
        // verde de Aura: los seleccionados en oscuro salían verdes. Ahora cuelga del
        // primario, que en oscuro es sky-300.
        highlight: {
          color: "color-mix(in srgb, var(--sc-color-slate-0) 87%, transparent)",
          background: "color-mix(in srgb, var(--sc-bg-primary) 16%, transparent)",
          focusColor: "color-mix(in srgb, var(--sc-color-slate-0) 87%, transparent)",
          focusBackground: "color-mix(in srgb, var(--sc-bg-primary) 24%, transparent)"
        }
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/tag.ts
var tag_default = {
  icon: {
    size: "var(--sc-cmp-tag-icon-size)"
  },
  root: {
    gap: "var(--sc-cmp-tag-gap)",
    /* `tag/padding/y` = scale/0-125 (1.75) y `tag/padding/x` = scale/0-5 (7) en el
     * maestro del Kit (DS › ❖ Tag, set 373:13337, leído el 2026-09-13). Aquí ponía
     * 0-25 (3.5): el tag medía 25 de alto contra los 21.5 del Kit. */
    padding: "var(--sc-cmp-tag-padding-y) var(--sc-cmp-tag-padding-x)",
    fontSize: "var(--sc-font-size-100)",
    fontWeight: "700",
    borderRadius: "{content.border.radius}",
    roundedBorderRadius: "{border.radius.xl}"
  },
  colorScheme: {
    dark: {
      info: {
        color: "var(--sc-cmp-tag-info-color)",
        background: "color-mix(in srgb, {sky.500}, transparent 84%)"
      },
      warn: {
        color: "var(--sc-cmp-tag-warn-color)",
        background: "var(--sc-cmp-tag-warn-background)"
      },
      danger: {
        color: "var(--sc-cmp-tag-danger-color)",
        background: "var(--sc-cmp-tag-danger-background)"
      },
      primary: {
        color: "var(--sc-cmp-tag-primary-color)",
        background: "var(--sc-cmp-tag-primary-background)"
      },
      success: {
        color: "var(--sc-cmp-tag-success-color)",
        background: "var(--sc-cmp-tag-success-background)"
      },
      contrast: {
        color: "{surface.950}",
        background: "var(--sc-cmp-tag-contrast-background)"
      },
      secondary: {
        color: "{surface.300}",
        background: "{surface.800}"
      }
    },
    light: {
      info: {
        color: "var(--sc-cmp-tag-info-color)",
        background: "var(--sc-cmp-tag-info-background)"
      },
      warn: {
        color: "var(--sc-cmp-tag-warn-color)",
        background: "var(--sc-cmp-tag-warn-background)"
      },
      danger: {
        color: "var(--sc-cmp-tag-danger-color)",
        background: "var(--sc-cmp-tag-danger-background)"
      },
      primary: {
        color: "{primary.700}",
        background: "{primary.100}"
      },
      success: {
        color: "var(--sc-cmp-tag-success-color)",
        background: "var(--sc-cmp-tag-success-background)"
      },
      contrast: {
        color: "var(--sc-cmp-tag-contrast-color)",
        background: "var(--sc-cmp-tag-contrast-background)"
      },
      secondary: {
        color: "var(--sc-cmp-tag-secondary-color)",
        background: "var(--sc-cmp-tag-secondary-background)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/card.ts
var card_default = {
  body: {
    gap: "var(--sc-scale-0-5)",
    padding: "var(--sc-cmp-card-body-padding)"
  },
  root: {
    color: "{content.color}",
    shadow: "var(--sc-cmp-card-shadow)",
    background: "{content.background}",
    borderRadius: "{border.radius.xl}"
  },
  title: {
    fontSize: "var(--sc-font-size-400)",
    fontWeight: "500"
  },
  caption: {
    gap: "var(--sc-cmp-card-caption-gap)"
  },
  /* `fontSize: "1em"` = el de la tarjeta, como antes de Aura (2026-09-13). El Kit no le
   * da tamaño al subtítulo; Aura sí (`1rem`, 16px) y un valor propio le gana al heredado:
   * medido en la página de `sc-card` de sc-docs, el subtítulo creció y descuadró la
   * captura. Misma receta que título, mes y año de `datepicker.ts`. */
  subtitle: {
    fontSize: "1em",
    color: "{text.muted.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/chip.ts
var chip_default = {
  icon: {
    size: "var(--sc-cmp-chip-icon-size)"
  },
  root: {
    gap: "var(--sc-cmp-chip-gap)",
    paddingX: "var(--sc-cmp-chip-padding-x)",
    paddingY: "var(--sc-cmp-chip-padding-y)",
    borderRadius: "var(--sc-cmp-chip-border-radius)",
    transitionDuration: "{transition.duration}"
  },
  image: {
    width: "var(--sc-cmp-chip-image-width)",
    height: "var(--sc-cmp-chip-image-height)"
  },
  removeIcon: {
    size: "var(--sc-cmp-chip-remove-icon-size)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    }
  },
  colorScheme: {
    dark: {
      icon: {
        color: "var(--sc-cmp-chip-icon-color)"
      },
      root: {
        color: "var(--sc-cmp-chip-color)",
        background: "var(--sc-cmp-chip-background)"
      },
      removeIcon: {
        color: "var(--sc-cmp-chip-remove-icon-color)"
      }
    },
    light: {
      icon: {
        color: "var(--sc-cmp-chip-icon-color)"
      },
      root: {
        color: "var(--sc-cmp-chip-color)",
        background: "var(--sc-cmp-chip-background)"
      },
      removeIcon: {
        color: "var(--sc-cmp-chip-remove-icon-color)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/dock.ts
var dock_default = {
  item: {
    size: "var(--sc-cmp-dock-item-size)",
    padding: "var(--sc-cmp-dock-item-padding)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    borderRadius: "{content.border.radius}"
  },
  root: {
    padding: "var(--sc-cmp-dock-padding)",
    background: "#ffffff1a",
    borderColor: "#ffffff33",
    borderRadius: "{border.radius.xl}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/knob.ts
var knob_default = {
  root: {
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    transitionDuration: "{transition.duration}"
  },
  text: {
    color: "{text.muted.color}"
  },
  range: {
    background: "{content.border.color}"
  },
  value: {
    background: "{primary.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/menu.ts
var menu_default = {
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
    shadow: "var(--sc-cmp-menu-shadow)",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}"
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
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/tabs.ts
var tabs_default = {
  tab: {
    gap: "var(--sc-cmp-tabs-tab-gap)",
    color: "{text.muted.color}",
    margin: "0",
    padding: "var(--sc-cmp-tabs-tab-padding-y) var(--sc-cmp-tabs-tab-padding-x)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "-0.071429rem",
      shadow: "none"
    },
    background: "#00000000",
    fontWeight: "600",
    hoverColor: "{text.color}",
    activeColor: "{primary.color}",
    borderColor: "transparent",
    borderWidth: "0",
    hoverBackground: "#00000000",
    activeBackground: "#00000000",
    hoverBorderColor: "transparent",
    activeBorderColor: "transparent"
  },
  root: {
    transitionDuration: "{transition.duration}"
  },
  tablist: {
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderWidth: "0 0 0.071429rem 0"
  },
  tabpanel: {
    color: "{content.color}",
    padding: "var(--sc-cmp-tabs-tabpanel-padding-top) var(--sc-cmp-tabs-tabpanel-padding-right) var(--sc-cmp-tabs-tabpanel-padding-bottom) var(--sc-cmp-tabs-tabpanel-padding-left)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "{content.background}"
  },
  activeBar: {
    bottom: "0",
    height: "0.071429rem",
    background: "{primary.color}"
  },
  navButton: {
    color: "{text.muted.color}",
    width: "var(--sc-cmp-tabs-nav-button-width)",
    shadow: "var(--sc-cmp-tabs-nav-button-shadow)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "-0.071429rem",
      shadow: "none"
    },
    background: "{content.background}",
    hoverColor: "{text.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/tree.ts
var tree_default = {
  node: {
    gap: "var(--sc-cmp-tree-node-gap)",
    color: "{text.color}",
    padding: "var(--sc-cmp-tree-node-padding-y) var(--sc-cmp-tree-node-padding-x)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "-0.071429rem",
      shadow: "none"
    },
    hoverColor: "{text.hover.color}",
    borderRadius: "{content.border.radius}",
    selectedColor: "{highlight.color}",
    hoverBackground: "{content.hover.background}",
    selectedBackground: "{highlight.background}"
  },
  root: {
    gap: "0.142857rem",
    color: "{content.color}",
    indent: "var(--sc-cmp-tree-indent)",
    padding: "var(--sc-cmp-tree-padding)",
    background: "{content.background}",
    transitionDuration: "{transition.duration}"
  },
  filter: {
    margin: "var(--sc-cmp-tree-filter-margin)"
  },
  nodeIcon: {
    color: "{text.muted.color}",
    hoverColor: "{text.hover.muted.color}",
    selectedColor: "{highlight.color}"
  },
  loadingIcon: {
    size: "var(--sc-cmp-tree-loading-icon-size)"
  },
  nodeToggleButton: {
    size: "var(--sc-cmp-tree-node-toggle-button-size)",
    color: "{text.muted.color}",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    hoverColor: "{text.hover.muted.color}",
    borderRadius: "var(--sc-cmp-tree-node-toggle-button-border-radius)",
    hoverBackground: "{content.hover.background}",
    selectedHoverColor: "{primary.color}",
    selectedHoverBackground: "{content.background}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/badge.ts
var badge_default = {
  lg: {
    height: "var(--sc-cmp-badge-lg-height)",
    fontSize: "var(--sc-cmp-badge-lg-font-size)",
    minWidth: "var(--sc-cmp-badge-lg-min-width)"
  },
  sm: {
    height: "var(--sc-cmp-badge-sm-height)",
    fontSize: "var(--sc-cmp-badge-sm-font-size)",
    minWidth: "var(--sc-cmp-badge-sm-min-width)"
  },
  xl: {
    height: "var(--sc-cmp-badge-xl-height)",
    fontSize: "var(--sc-cmp-badge-xl-font-size)",
    minWidth: "var(--sc-cmp-badge-xl-min-width)"
  },
  dot: {
    size: "var(--sc-cmp-badge-dot-size)"
  },
  root: {
    height: "var(--sc-cmp-badge-height)",
    padding: "var(--sc-cmp-badge-padding-y) var(--sc-cmp-badge-padding-x)",
    fontSize: "var(--sc-cmp-badge-font-size)",
    minWidth: "var(--sc-cmp-badge-min-width)",
    fontWeight: "700",
    borderRadius: "{border.radius.md}"
  },
  colorScheme: {
    dark: {
      info: {
        color: "var(--sc-cmp-badge-info-color)",
        background: "var(--sc-cmp-badge-info-background)"
      },
      warn: {
        color: "var(--sc-cmp-badge-warn-color)",
        background: "var(--sc-cmp-badge-warn-background)"
      },
      danger: {
        color: "var(--sc-cmp-badge-danger-color)",
        background: "var(--sc-cmp-badge-danger-background)"
      },
      primary: {
        color: "{primary.contrast.color}",
        background: "{primary.color}"
      },
      success: {
        color: "{green.950}",
        background: "var(--sc-cmp-badge-success-background)"
      },
      contrast: {
        color: "{surface.950}",
        background: "var(--sc-cmp-badge-contrast-background)"
      },
      secondary: {
        color: "{surface.300}",
        background: "{surface.800}"
      }
    },
    light: {
      info: {
        color: "var(--sc-cmp-badge-info-color)",
        background: "var(--sc-cmp-badge-info-background)"
      },
      warn: {
        color: "var(--sc-cmp-badge-warn-color)",
        background: "var(--sc-cmp-badge-warn-background)"
      },
      danger: {
        color: "var(--sc-cmp-badge-danger-color)",
        background: "var(--sc-cmp-badge-danger-background)"
      },
      primary: {
        color: "{primary.contrast.color}",
        background: "{primary.color}"
      },
      success: {
        color: "var(--sc-cmp-badge-success-color)",
        background: "var(--sc-cmp-badge-success-background)"
      },
      contrast: {
        color: "var(--sc-cmp-badge-contrast-color)",
        background: "var(--sc-cmp-badge-contrast-background)"
      },
      secondary: {
        color: "var(--sc-cmp-badge-secondary-color)",
        background: "var(--sc-cmp-badge-secondary-background)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/image.ts
var image_default = {
  root: {
    transitionDuration: "{transition.duration}"
  },
  action: {
    size: "var(--sc-cmp-image-action-size)",
    color: "{surface.50}",
    iconSize: "var(--sc-cmp-image-action-icon-size)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    hoverColor: "{surface.0}",
    borderRadius: "var(--sc-cmp-image-action-border-radius)",
    hoverBackground: "#ffffff1a"
  },
  preview: {
    icon: {
      size: "var(--sc-cmp-image-preview-icon-size)"
    },
    mask: {
      color: "{mask.color}",
      background: "{mask.background}"
    }
  },
  toolbar: {
    gap: "var(--sc-cmp-image-toolbar-gap)",
    blur: "0.571429rem",
    padding: "var(--sc-cmp-image-toolbar-padding)",
    position: {
      top: "var(--sc-cmp-image-toolbar-position-top)",
      left: "auto",
      right: "var(--sc-cmp-image-toolbar-position-right)",
      bottom: "auto"
    },
    background: "#ffffff1a",
    borderColor: "#ffffff33",
    borderWidth: "0.071429rem",
    borderRadius: "2.142857rem"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/panel.ts
var panel_default = {
  root: {
    color: "{content.color}",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  },
  title: {
    fontWeight: "600"
  },
  footer: {
    padding: "var(--sc-cmp-panel-footer-padding-top) var(--sc-cmp-panel-footer-padding-right) var(--sc-cmp-panel-footer-padding-bottom) var(--sc-cmp-panel-footer-padding-left)"
  },
  header: {
    color: "{text.color}",
    padding: "var(--sc-cmp-panel-header-padding)",
    background: "#00000000",
    borderColor: "{content.border.color}",
    borderWidth: "0",
    borderRadius: "0"
  },
  content: {
    padding: "var(--sc-cmp-panel-content-padding-top) var(--sc-cmp-panel-content-padding-right) var(--sc-cmp-panel-content-padding-bottom) var(--sc-cmp-panel-content-padding-left)"
  },
  toggleableHeader: {
    padding: "var(--sc-cmp-panel-toggleable-header-padding-y) var(--sc-cmp-panel-toggleable-header-padding-x)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/toast.ts
var toast_default = {
  icon: {
    size: "var(--sc-cmp-toast-icon-size)"
  },
  info: {
    shadow: "var(--sc-cmp-toast-info-shadow)",
    closeButton: {
      focusRing: {
        shadow: "none"
      }
    }
  },
  root: {
    width: "var(--sc-cmp-toast-width)",
    borderWidth: "0.071429rem",
    borderRadius: "{content.border.radius}"
  },
  text: {
    gap: "var(--sc-cmp-toast-text-gap)"
  },
  warn: {
    shadow: "var(--sc-cmp-toast-warn-shadow)",
    closeButton: {
      focusRing: {
        shadow: "none"
      }
    }
  },
  error: {
    shadow: "var(--sc-cmp-toast-error-shadow)",
    closeButton: {
      focusRing: {
        shadow: "none"
      }
    }
  },
  detail: {
    fontSize: "var(--sc-font-size-100)",
    fontWeight: "500"
  },
  content: {
    gap: "var(--sc-cmp-toast-content-gap)",
    padding: "{overlay.popover.padding}"
  },
  success: {
    shadow: "var(--sc-cmp-toast-success-shadow)",
    closeButton: {
      focusRing: {
        shadow: "none"
      }
    }
  },
  summary: {
    fontSize: "var(--sc-scale-1)",
    fontWeight: "500"
  },
  contrast: {
    shadow: "var(--sc-cmp-toast-contrast-shadow)",
    closeButton: {
      focusRing: {
        shadow: "none"
      }
    }
  },
  closeIcon: {
    size: "var(--sc-cmp-toast-close-icon-size)"
  },
  secondary: {
    shadow: "var(--sc-cmp-toast-secondary-shadow)",
    closeButton: {
      focusRing: {
        shadow: "none"
      }
    }
  },
  closeButton: {
    width: "var(--sc-cmp-toast-close-button-width)",
    height: "var(--sc-cmp-toast-close-button-height)",
    focusRing: {
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}"
    },
    borderRadius: "var(--sc-cmp-toast-close-button-border-radius)"
  },
  colorScheme: {
    dark: {
      info: {
        color: "var(--sc-cmp-toast-info-color)",
        background: "var(--sc-cmp-toast-info-background)",
        borderColor: "var(--sc-cmp-toast-info-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-toast-info-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-toast-info-close-button-hover-background)"
        },
        detailColor: "var(--sc-cmp-toast-info-detail-color)"
      },
      root: {
        blur: "0.714286rem"
      },
      warn: {
        color: "var(--sc-cmp-toast-warn-color)",
        background: "var(--sc-cmp-toast-warn-background)",
        borderColor: "var(--sc-cmp-toast-warn-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-toast-warn-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-toast-warn-close-button-hover-background)"
        },
        detailColor: "var(--sc-cmp-toast-warn-detail-color)"
      },
      error: {
        color: "var(--sc-cmp-toast-error-color)",
        background: "var(--sc-cmp-toast-error-background)",
        borderColor: "var(--sc-cmp-toast-error-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-toast-error-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-toast-error-close-button-hover-background)"
        },
        detailColor: "var(--sc-cmp-toast-error-detail-color)"
      },
      success: {
        color: "var(--sc-cmp-toast-success-color)",
        background: "var(--sc-cmp-toast-success-background)",
        borderColor: "var(--sc-cmp-toast-success-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-toast-success-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-toast-success-close-button-hover-background)"
        },
        detailColor: "var(--sc-cmp-toast-success-detail-color)"
      },
      contrast: {
        color: "{surface.950}",
        background: "var(--sc-cmp-toast-contrast-background)",
        borderColor: "{surface.100}",
        closeButton: {
          focusRing: {
            color: "{surface.950}"
          },
          hoverBackground: "{surface.100}"
        },
        detailColor: "{surface.950}"
      },
      secondary: {
        color: "{surface.300}",
        background: "{surface.800}",
        borderColor: "{surface.700}",
        closeButton: {
          focusRing: {
            color: "{surface.300}"
          },
          hoverBackground: "{surface.700}"
        },
        detailColor: "var(--sc-cmp-toast-secondary-detail-color)"
      }
    },
    light: {
      info: {
        color: "var(--sc-cmp-toast-info-color)",
        background: "var(--sc-cmp-toast-info-background)",
        borderColor: "var(--sc-cmp-toast-info-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-toast-info-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-toast-info-close-button-hover-background)"
        },
        detailColor: "var(--sc-cmp-toast-info-detail-color)"
      },
      root: {
        blur: "0.714286rem"
      },
      warn: {
        color: "var(--sc-cmp-toast-warn-color)",
        background: "var(--sc-cmp-toast-warn-background)",
        borderColor: "var(--sc-cmp-toast-warn-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-toast-warn-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-toast-warn-close-button-hover-background)"
        },
        detailColor: "var(--sc-cmp-toast-warn-detail-color)"
      },
      error: {
        color: "var(--sc-cmp-toast-error-color)",
        background: "var(--sc-cmp-toast-error-background)",
        borderColor: "var(--sc-cmp-toast-error-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-toast-error-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-toast-error-close-button-hover-background)"
        },
        detailColor: "var(--sc-cmp-toast-error-detail-color)"
      },
      success: {
        color: "var(--sc-cmp-toast-success-color)",
        background: "var(--sc-cmp-toast-success-background)",
        borderColor: "var(--sc-cmp-toast-success-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-toast-success-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-toast-success-close-button-hover-background)"
        },
        detailColor: "var(--sc-cmp-toast-success-detail-color)"
      },
      contrast: {
        color: "var(--sc-cmp-toast-contrast-color)",
        background: "var(--sc-cmp-toast-contrast-background)",
        borderColor: "var(--sc-cmp-toast-contrast-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-toast-contrast-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-toast-contrast-close-button-hover-background)"
        },
        detailColor: "var(--sc-cmp-toast-contrast-detail-color)"
      },
      secondary: {
        color: "var(--sc-cmp-toast-secondary-color)",
        background: "var(--sc-cmp-toast-secondary-background)",
        borderColor: "var(--sc-cmp-toast-secondary-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-toast-secondary-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-toast-secondary-close-button-hover-background)"
        },
        detailColor: "var(--sc-cmp-toast-secondary-detail-color)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/avatar.ts
var avatar_default = {
  lg: {
    icon: {
      size: "var(--sc-cmp-avatar-lg-icon-size)"
    },
    group: {
      offset: "var(--sc-cmp-avatar-lg-group-offset)"
    },
    width: "var(--sc-cmp-avatar-lg-width)",
    height: "var(--sc-cmp-avatar-lg-height)",
    fontSize: "var(--sc-cmp-avatar-lg-font-size)"
  },
  xl: {
    icon: {
      size: "var(--sc-cmp-avatar-xl-icon-size)"
    },
    group: {
      offset: "var(--sc-cmp-avatar-xl-group-offset)"
    },
    width: "var(--sc-cmp-avatar-xl-width)",
    height: "var(--sc-cmp-avatar-xl-height)",
    fontSize: "var(--sc-cmp-avatar-xl-font-size)"
  },
  icon: {
    size: "var(--sc-cmp-avatar-icon-size)"
  },
  root: {
    color: "{content.color}",
    width: "var(--sc-cmp-avatar-width)",
    height: "var(--sc-cmp-avatar-height)",
    fontSize: "var(--sc-cmp-avatar-font-size)",
    background: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  },
  group: {
    offset: "var(--sc-cmp-avatar-group-offset)",
    borderColor: "{content.background}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/button.ts
var button_default = {
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
    raisedShadow: "var(--sc-cmp-button-raised-shadow)",
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
          color: "var(--sc-cmp-button-help-color)",
          focusRing: {
            color: "var(--sc-cmp-button-help-focus-ring-color)"
          },
          background: "var(--sc-cmp-button-help-background)",
          hoverColor: "var(--sc-cmp-button-help-hover-color)",
          activeColor: "var(--sc-cmp-button-help-active-color)",
          borderColor: "var(--sc-cmp-button-help-border-color)",
          hoverBackground: "var(--sc-cmp-button-help-hover-background)",
          activeBackground: "var(--sc-cmp-button-help-active-background)",
          hoverBorderColor: "var(--sc-cmp-button-help-hover-border-color)",
          activeBorderColor: "var(--sc-cmp-button-help-active-border-color)"
        },
        info: {
          color: "var(--sc-cmp-button-info-color)",
          focusRing: {
            color: "var(--sc-cmp-button-info-focus-ring-color)"
          },
          background: "var(--sc-cmp-button-info-background)",
          hoverColor: "var(--sc-cmp-button-info-hover-color)",
          activeColor: "var(--sc-cmp-button-info-active-color)",
          borderColor: "var(--sc-cmp-button-info-border-color)",
          hoverBackground: "var(--sc-cmp-button-info-hover-background)",
          activeBackground: "var(--sc-cmp-button-info-active-background)",
          hoverBorderColor: "var(--sc-cmp-button-info-hover-border-color)",
          activeBorderColor: "var(--sc-cmp-button-info-active-border-color)"
        },
        warn: {
          color: "var(--sc-cmp-button-warn-color)",
          focusRing: {
            color: "var(--sc-cmp-button-warn-focus-ring-color)"
          },
          background: "var(--sc-cmp-button-warn-background)",
          hoverColor: "var(--sc-cmp-button-warn-hover-color)",
          activeColor: "var(--sc-cmp-button-warn-active-color)",
          borderColor: "var(--sc-cmp-button-warn-border-color)",
          hoverBackground: "var(--sc-cmp-button-warn-hover-background)",
          activeBackground: "var(--sc-cmp-button-warn-active-background)",
          hoverBorderColor: "var(--sc-cmp-button-warn-hover-border-color)",
          activeBorderColor: "var(--sc-cmp-button-warn-active-border-color)"
        },
        danger: {
          color: "var(--sc-cmp-button-danger-color)",
          focusRing: {
            color: "var(--sc-cmp-button-danger-focus-ring-color)"
          },
          background: "var(--sc-cmp-button-danger-background)",
          hoverColor: "var(--sc-cmp-button-danger-hover-color)",
          activeColor: "var(--sc-cmp-button-danger-active-color)",
          borderColor: "var(--sc-cmp-button-danger-border-color)",
          hoverBackground: "var(--sc-cmp-button-danger-hover-background)",
          activeBackground: "var(--sc-cmp-button-danger-active-background)",
          hoverBorderColor: "var(--sc-cmp-button-danger-hover-border-color)",
          activeBorderColor: "var(--sc-cmp-button-danger-active-border-color)"
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
            color: "var(--sc-cmp-button-success-focus-ring-color)"
          },
          background: "var(--sc-cmp-button-success-background)",
          hoverColor: "{green.950}",
          activeColor: "{green.950}",
          borderColor: "var(--sc-cmp-button-success-border-color)",
          hoverBackground: "var(--sc-cmp-button-success-hover-background)",
          activeBackground: "var(--sc-cmp-button-success-active-background)",
          hoverBorderColor: "var(--sc-cmp-button-success-hover-border-color)",
          activeBorderColor: "var(--sc-cmp-button-success-active-border-color)"
        },
        contrast: {
          color: "var(--sc-cmp-button-contrast-color)",
          focusRing: {
            color: "var(--sc-cmp-button-contrast-focus-ring-color)"
          },
          background: "var(--sc-cmp-button-contrast-background)",
          hoverColor: "var(--sc-cmp-button-contrast-hover-color)",
          activeColor: "var(--sc-cmp-button-contrast-active-color)",
          borderColor: "var(--sc-cmp-button-contrast-border-color)",
          hoverBackground: "var(--sc-cmp-button-contrast-hover-background)",
          activeBackground: "var(--sc-cmp-button-contrast-active-background)",
          hoverBorderColor: "var(--sc-cmp-button-contrast-hover-border-color)",
          activeBorderColor: "var(--sc-cmp-button-contrast-active-border-color)"
        },
        secondary: {
          color: "var(--sc-cmp-button-secondary-color)",
          focusRing: {
            color: "var(--sc-cmp-button-secondary-focus-ring-color)"
          },
          background: "var(--sc-cmp-button-secondary-background)",
          hoverColor: "var(--sc-cmp-button-secondary-hover-color)",
          activeColor: "var(--sc-cmp-button-secondary-active-color)",
          borderColor: "var(--sc-cmp-button-secondary-border-color)",
          hoverBackground: "var(--sc-cmp-button-secondary-hover-background)",
          activeBackground: "var(--sc-cmp-button-secondary-active-background)",
          hoverBorderColor: "var(--sc-cmp-button-secondary-hover-border-color)",
          activeBorderColor: "var(--sc-cmp-button-secondary-active-border-color)"
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
          hoverBackground: "color-mix(in srgb, {sky.400}, transparent 96%)",
          activeBackground: "color-mix(in srgb, {sky.400}, transparent 84%)"
        },
        warn: {
          color: "var(--sc-cmp-button-text-warn-color)",
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
          hoverBackground: "color-mix(in srgb, {sky.400}, transparent 96%)",
          activeBackground: "color-mix(in srgb, {sky.400}, transparent 84%)"
        },
        warn: {
          color: "var(--sc-cmp-button-outlined-warn-color)",
          borderColor: "var(--sc-cmp-button-outlined-warn-border-color)",
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
          borderColor: "var(--sc-cmp-button-outlined-primary-border-color)",
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
          color: "var(--sc-cmp-button-help-color)",
          focusRing: {
            color: "var(--sc-cmp-button-help-focus-ring-color)"
          },
          background: "var(--sc-cmp-button-help-background)",
          hoverColor: "var(--sc-cmp-button-help-hover-color)",
          activeColor: "var(--sc-cmp-button-help-active-color)",
          borderColor: "var(--sc-cmp-button-help-border-color)",
          hoverBackground: "var(--sc-cmp-button-help-hover-background)",
          activeBackground: "var(--sc-cmp-button-help-active-background)",
          hoverBorderColor: "var(--sc-cmp-button-help-hover-border-color)",
          activeBorderColor: "var(--sc-cmp-button-help-active-border-color)"
        },
        info: {
          color: "var(--sc-cmp-button-info-color)",
          focusRing: {
            color: "var(--sc-cmp-button-info-focus-ring-color)"
          },
          background: "var(--sc-cmp-button-info-background)",
          hoverColor: "var(--sc-cmp-button-info-hover-color)",
          activeColor: "var(--sc-cmp-button-info-active-color)",
          borderColor: "var(--sc-cmp-button-info-border-color)",
          hoverBackground: "var(--sc-cmp-button-info-hover-background)",
          activeBackground: "var(--sc-cmp-button-info-active-background)",
          hoverBorderColor: "var(--sc-cmp-button-info-hover-border-color)",
          activeBorderColor: "var(--sc-cmp-button-info-active-border-color)"
        },
        /* AA · 2026-08-24 — mismo arreglo que `danger` de abajo y por el
         * mismo motivo, pero aquí ni siquiera hace falta divergir: el
         * warn sólido medía **1.92:1** con su texto blanco y el propio
         * Kit dice `{yellow.700}` para este slot (4.92 ✓). La rampa se
         * desplaza de 500/600/700 a 700/800/900 para conservar el
         * recorrido reposo → hover → pulsado.
         *
         * Se llama `orange` porque así llama PrimeNG al slot; `base.ts`
         * lo remapea a la familia yellow, que es lo que el Theme
         * Designer trajo el 24-ago. */
        warn: {
          color: "var(--sc-cmp-button-warn-color)",
          focusRing: {
            color: "var(--sc-cmp-button-warn-focus-ring-color)"
          },
          background: "var(--sc-cmp-button-warn-background)",
          hoverColor: "var(--sc-cmp-button-warn-hover-color)",
          activeColor: "var(--sc-cmp-button-warn-active-color)",
          borderColor: "var(--sc-cmp-button-warn-border-color)",
          hoverBackground: "var(--sc-cmp-button-warn-hover-background)",
          activeBackground: "var(--sc-cmp-button-warn-active-background)",
          hoverBorderColor: "var(--sc-cmp-button-warn-hover-border-color)",
          activeBorderColor: "var(--sc-cmp-button-warn-active-border-color)"
        },
        /* AA · 2026-07-19 — el botón `danger` sólido subía a 3.76:1 con
         * su texto blanco: era uno de los dos últimos fallos de
         * contraste de la app. La rampa entera se desplaza un escalón,
         * de 500/600/700 a 600/700/800, para conservar el recorrido
         * reposo → hover → pulsado. red-600 con blanco da **4.83:1**.
         *
         * Fue divergencia declarada (2026-09-15) hasta el export del
         * 2026-10-17, que trajo el Kit a esa misma rampa
         * (`figma-pendiente.md` §12): se lee la variable. Ver
         * customs-catalog §1.8.
         *
         * `focusRing` se queda en {red.500}: es un anillo, no lleva
         * texto encima, y no cambiarlo evita mover una señal de foco. */
        danger: {
          color: "var(--sc-cmp-button-danger-color)",
          focusRing: {
            color: "var(--sc-cmp-button-danger-focus-ring-color)"
          },
          background: "var(--sc-cmp-button-danger-background)",
          hoverColor: "var(--sc-cmp-button-danger-hover-color)",
          activeColor: "var(--sc-cmp-button-danger-active-color)",
          borderColor: "var(--sc-cmp-button-danger-border-color)",
          hoverBackground: "var(--sc-cmp-button-danger-hover-background)",
          activeBackground: "var(--sc-cmp-button-danger-active-background)",
          hoverBorderColor: "var(--sc-cmp-button-danger-hover-border-color)",
          activeBorderColor: "var(--sc-cmp-button-danger-active-border-color)"
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
          color: "var(--sc-cmp-button-success-color)",
          focusRing: {
            color: "var(--sc-cmp-button-success-focus-ring-color)"
          },
          background: "var(--sc-cmp-button-success-background)",
          hoverColor: "var(--sc-cmp-button-success-hover-color)",
          activeColor: "var(--sc-cmp-button-success-active-color)",
          borderColor: "var(--sc-cmp-button-success-border-color)",
          hoverBackground: "var(--sc-cmp-button-success-hover-background)",
          activeBackground: "var(--sc-cmp-button-success-active-background)",
          hoverBorderColor: "var(--sc-cmp-button-success-hover-border-color)",
          activeBorderColor: "var(--sc-cmp-button-success-active-border-color)"
        },
        contrast: {
          color: "var(--sc-cmp-button-contrast-color)",
          focusRing: {
            color: "var(--sc-cmp-button-contrast-focus-ring-color)"
          },
          background: "var(--sc-cmp-button-contrast-background)",
          hoverColor: "var(--sc-cmp-button-contrast-hover-color)",
          activeColor: "var(--sc-cmp-button-contrast-active-color)",
          borderColor: "var(--sc-cmp-button-contrast-border-color)",
          hoverBackground: "var(--sc-cmp-button-contrast-hover-background)",
          activeBackground: "var(--sc-cmp-button-contrast-active-background)",
          hoverBorderColor: "var(--sc-cmp-button-contrast-hover-border-color)",
          activeBorderColor: "var(--sc-cmp-button-contrast-active-border-color)"
        },
        secondary: {
          color: "var(--sc-cmp-button-secondary-color)",
          focusRing: {
            color: "var(--sc-cmp-button-secondary-focus-ring-color)"
          },
          background: "var(--sc-cmp-button-secondary-background)",
          hoverColor: "var(--sc-cmp-button-secondary-hover-color)",
          activeColor: "var(--sc-cmp-button-secondary-active-color)",
          borderColor: "var(--sc-cmp-button-secondary-border-color)",
          hoverBackground: "var(--sc-cmp-button-secondary-hover-background)",
          activeBackground: "var(--sc-cmp-button-secondary-active-background)",
          hoverBorderColor: "var(--sc-cmp-button-secondary-hover-border-color)",
          activeBorderColor: "var(--sc-cmp-button-secondary-active-border-color)"
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
          color: "var(--sc-cmp-button-text-warn-color)",
          hoverBackground: "var(--sc-cmp-button-text-warn-hover-background)",
          activeBackground: "var(--sc-cmp-button-text-warn-active-background)"
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
          color: "var(--sc-cmp-button-outlined-warn-color)",
          borderColor: "var(--sc-cmp-button-outlined-warn-border-color)",
          hoverBackground: "var(--sc-cmp-button-outlined-warn-hover-background)",
          activeBackground: "var(--sc-cmp-button-outlined-warn-active-background)"
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
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/dialog.ts
var dialog_default = {
  root: {
    color: "{overlay.modal.color}",
    shadow: "var(--sc-cmp-dialog-shadow)",
    background: "{overlay.modal.background}",
    borderColor: "{overlay.modal.border.color}",
    borderRadius: "{overlay.modal.border.radius}"
  },
  title: {
    fontSize: "var(--sc-font-size-400)",
    fontWeight: "600"
  },
  footer: {
    gap: "var(--sc-cmp-dialog-footer-gap)",
    padding: "0 {overlay.modal.padding} {overlay.modal.padding}"
  },
  header: {
    gap: "var(--sc-cmp-dialog-header-gap)",
    padding: "{overlay.modal.padding}"
  },
  content: {
    padding: "0 {overlay.modal.padding} {overlay.modal.padding}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/drawer.ts
var drawer_default = {
  root: {
    color: "{overlay.modal.color}",
    shadow: "var(--sc-cmp-drawer-shadow)",
    background: "{overlay.modal.background}",
    borderColor: "{overlay.modal.border.color}"
  },
  title: {
    fontSize: "var(--sc-font-size-450)",
    fontWeight: "600"
  },
  footer: {
    padding: "{overlay.modal.padding}"
  },
  header: {
    padding: "{overlay.modal.padding}"
  },
  content: {
    padding: "0 {overlay.modal.padding} {overlay.modal.padding}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/sidebar.ts
var sidebar_default = {
  root: {
    borderColor: "var(--sc-sidebar-border)"
  },
  layout: {
    background: "var(--sc-sidebar-bg)"
  },
  panel: {
    background: "var(--sc-sidebar-bg)",
    color: "var(--sc-sidebar-fg-muted)",
    floatingShadow: "var(--sc-shadow-xs)",
    floatingBorderRadius: "var(--sc-radius-xl)"
  },
  groupLabel: {
    color: "var(--sc-sidebar-fg-subtle)"
  },
  groupAction: {
    color: "var(--sc-sidebar-fg-faint)",
    focusColor: "var(--sc-sidebar-fg-hover)",
    focusBackground: "var(--sc-sidebar-item-hover-bg)"
  },
  menuButton: {
    padding: "{navigation.item.padding}",
    iconOnlyWidth: "var(--sc-scale-2-25)",
    color: "var(--sc-sidebar-fg-muted)",
    focusBackground: "var(--sc-sidebar-item-hover-bg)",
    focusColor: "var(--sc-sidebar-fg-hover)",
    activeBackground: "var(--sc-sidebar-item-active-bg)",
    activeColor: "var(--sc-sidebar-fg)",
    icon: {
      color: "var(--sc-sidebar-fg-subtle)",
      focusColor: "var(--sc-sidebar-fg-hover)"
    }
  },
  menuAction: {
    color: "var(--sc-sidebar-fg-faint)",
    focusColor: "var(--sc-sidebar-fg-hover)",
    focusBackground: "var(--sc-sidebar-item-hover-bg)"
  },
  menuBadge: {
    background: "var(--sc-sidebar-item-hover-bg)",
    borderColor: "var(--sc-sidebar-border)",
    color: "var(--sc-sidebar-fg-muted)"
  },
  menuSubButton: {
    color: "var(--sc-sidebar-fg-muted)",
    focusBackground: "var(--sc-sidebar-item-hover-bg)",
    focusColor: "var(--sc-sidebar-fg-hover)",
    activeBackground: "var(--sc-sidebar-item-active-bg)",
    activeColor: "var(--sc-sidebar-fg)",
    icon: {
      color: "var(--sc-sidebar-fg-subtle)",
      focusColor: "var(--sc-sidebar-fg-hover)"
    }
  },
  main: {
    background: "var(--sc-bg-canvas)",
    floatingBackground: "var(--sc-bg-canvas)",
    insetBackground: "var(--sc-bg-canvas)",
    shadow: "0 0 0 0.071429rem var(--sc-sidebar-border), var(--sc-shadow-xs)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/editor.ts
var editor_default = {
  content: {
    color: "{content.color}",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  },
  overlay: {
    color: "{overlay.select.color}",
    shadow: "var(--sc-cmp-editor-overlay-shadow)",
    padding: "{list.padding}",
    background: "{overlay.select.background}",
    borderColor: "{overlay.select.border.color}",
    borderRadius: "{overlay.select.border.radius}"
  },
  toolbar: {
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  },
  toolbarItem: {
    color: "{text.muted.color}",
    hoverColor: "{text.color}",
    activeColor: "{primary.color}"
  },
  overlayOption: {
    color: "{list.option.color}",
    padding: "{list.option.padding}",
    focusColor: "{list.option.focus.color}",
    borderRadius: "{list.option.border.radius}",
    focusBackground: "{list.option.focus.background}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/rating.ts
var rating_default = {
  icon: {
    size: "var(--sc-cmp-rating-icon-size)",
    color: "{text.muted.color}",
    hoverColor: "{primary.color}",
    activeColor: "{primary.color}"
  },
  root: {
    gap: "var(--sc-cmp-rating-gap)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    transitionDuration: "{transition.duration}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/ripple.ts
var ripple_default = {
  colorScheme: {
    dark: {
      root: {
        background: "rgba(255, 255, 255, 0.4)"
      }
    },
    light: {
      root: {
        background: "rgba(0, 0, 0, 0.1)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/select.ts
var select_default = {
  list: {
    gap: "{list.gap}",
    header: {
      padding: "{list.header.padding}"
    },
    padding: "{list.padding}"
  },
  root: {
    lg: {
      fontSize: "{form.field.lg.font.size}",
      paddingX: "{form.field.lg.padding.x}",
      paddingY: "{form.field.lg.padding.y}"
    },
    sm: {
      fontSize: "{form.field.sm.font.size}",
      paddingX: "{form.field.sm.padding.x}",
      paddingY: "{form.field.sm.padding.y}"
    },
    color: "{form.field.color}",
    shadow: "var(--sc-cmp-select-shadow)",
    paddingX: "{form.field.padding.x}",
    paddingY: "{form.field.padding.y}",
    focusRing: {
      color: "{form.field.focus.ring.color}",
      style: "{form.field.focus.ring.style}",
      width: "{form.field.focus.ring.width}",
      offset: "{form.field.focus.ring.offset}",
      shadow: "none"
    },
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}",
    disabledColor: "{form.field.disabled.color}",
    filledBackground: "{form.field.filled.background}",
    focusBorderColor: "{form.field.focus.border.color}",
    hoverBorderColor: "{form.field.hover.border.color}",
    placeholderColor: "{form.field.placeholder.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{form.field.transition.duration}",
    filledFocusBackground: "{form.field.filled.focus.background}",
    filledHoverBackground: "{form.field.filled.hover.background}",
    invalidPlaceholderColor: "{form.field.invalid.placeholder.color}"
  },
  option: {
    color: "{list.option.color}",
    padding: "{list.option.padding}",
    focusColor: "{list.option.focus.color}",
    borderRadius: "{list.option.border.radius}",
    selectedColor: "{list.option.selected.color}",
    focusBackground: "{list.option.focus.background}",
    selectedBackground: "{list.option.selected.background}",
    selectedFocusColor: "{list.option.selected.focus.color}",
    selectedFocusBackground: "{list.option.selected.focus.background}"
  },
  overlay: {
    color: "{overlay.select.color}",
    shadow: "var(--sc-cmp-select-overlay-shadow)",
    background: "{overlay.select.background}",
    borderColor: "{overlay.select.border.color}",
    borderRadius: "{overlay.select.border.radius}"
  },
  dropdown: {
    color: "{form.field.icon.color}",
    width: "var(--sc-cmp-select-dropdown-width)"
  },
  checkmark: {
    color: "{list.option.color}",
    gutterEnd: "var(--sc-cmp-select-checkmark-gutter-end)",
    gutterStart: "var(--sc-cmp-select-checkmark-gutter-start)"
  },
  clearIcon: {
    color: "{form.field.icon.color}"
  },
  optionGroup: {
    color: "{list.option.group.color}",
    padding: "{list.option.group.padding}",
    background: "{list.option.group.background}",
    fontWeight: "{list.option.group.font.weight}"
  },
  emptyMessage: {
    padding: "{list.option.padding}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/slider.ts
var slider_default = {
  root: {
    transitionDuration: "{transition.duration}"
  },
  range: {
    background: "{primary.color}"
  },
  track: {
    size: "0.214286rem",
    background: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  },
  handle: {
    width: "1.428571rem",
    height: "1.428571rem",
    content: {
      width: "var(--sc-cmp-slider-handle-content-width)",
      height: "var(--sc-cmp-slider-handle-content-height)",
      shadow: "var(--sc-cmp-slider-handle-content-shadow)",
      borderRadius: "0.571429rem",
      hoverBackground: "{content.background}"
    },
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "{content.border.color}",
    borderRadius: "0.714286rem",
    hoverBackground: "{content.border.color}"
  },
  colorScheme: {
    dark: {
      handle: {
        content: {
          background: "{surface.950}"
        }
      }
    },
    light: {
      handle: {
        content: {
          background: "var(--sc-cmp-slider-handle-content-background)"
        }
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/blockui.ts
var blockui_default = {
  root: {
    borderRadius: "{content.border.radius}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/divider.ts
var divider_default = {
  root: {
    borderColor: "{content.border.color}"
  },
  content: {
    color: "{text.color}",
    background: "{content.background}"
  },
  vertical: {
    margin: "var(--sc-cmp-divider-vertical-margin-y) var(--sc-cmp-divider-vertical-margin-x)",
    content: {
      padding: "var(--sc-cmp-divider-vertical-content-padding-y) var(--sc-cmp-divider-vertical-content-padding-x)"
    },
    padding: "var(--sc-cmp-divider-vertical-padding-y) var(--sc-cmp-divider-vertical-padding-x)"
  },
  horizontal: {
    margin: "var(--sc-cmp-divider-horizontal-margin-y) var(--sc-cmp-divider-horizontal-margin-x)",
    content: {
      padding: "var(--sc-cmp-divider-horizontal-content-padding-y) var(--sc-cmp-divider-horizontal-content-padding-x)"
    },
    padding: "var(--sc-cmp-divider-horizontal-padding-y) var(--sc-cmp-divider-horizontal-padding-x)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/inplace.ts
var inplace_default = {
  root: {
    padding: "{form.field.padding.y} {form.field.padding.x}",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    borderRadius: "{content.border.radius}",
    transitionDuration: "{transition.duration}"
  },
  display: {
    hoverColor: "{content.hover.color}",
    hoverBackground: "{content.hover.background}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/listbox.ts
var listbox_default = {
  list: {
    gap: "{list.gap}",
    header: {
      padding: "{list.header.padding}"
    },
    padding: "{list.padding}"
  },
  root: {
    color: "{form.field.color}",
    shadow: "var(--sc-cmp-listbox-shadow)",
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}",
    disabledColor: "{form.field.disabled.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{form.field.transition.duration}"
  },
  option: {
    color: "{list.option.color}",
    padding: "{list.option.padding}",
    focusColor: "{list.option.focus.color}",
    borderRadius: "{list.option.border.radius}",
    selectedColor: "{list.option.selected.color}",
    focusBackground: "{list.option.focus.background}",
    selectedBackground: "{list.option.selected.background}",
    selectedFocusColor: "{list.option.selected.focus.color}",
    selectedFocusBackground: "{list.option.selected.focus.background}"
  },
  checkmark: {
    color: "{list.option.color}",
    gutterEnd: "var(--sc-cmp-listbox-checkmark-gutter-end)",
    gutterStart: "var(--sc-cmp-listbox-checkmark-gutter-start)"
  },
  colorScheme: {
    dark: {
      option: {
        stripedBackground: "{surface.900}"
      }
    },
    light: {
      option: {
        stripedBackground: "var(--sc-cmp-listbox-option-striped-background)"
      }
    }
  },
  optionGroup: {
    color: "{list.option.group.color}",
    padding: "{list.option.group.padding}",
    background: "{list.option.group.background}",
    fontWeight: "{list.option.group.font.weight}"
  },
  emptyMessage: {
    padding: "{list.option.padding}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/menubar.ts
var menubar_default = {
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
  root: {
    gap: "var(--sc-cmp-menubar-gap)",
    color: "{content.color}",
    padding: "var(--sc-cmp-menubar-padding-y) var(--sc-cmp-menubar-padding-x)",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}",
    transitionDuration: "{transition.duration}"
  },
  submenu: {
    gap: "{navigation.list.gap}",
    icon: {
      size: "{navigation.submenu.icon.size}",
      color: "{navigation.submenu.icon.color}",
      focusColor: "{navigation.submenu.icon.focus.color}",
      activeColor: "{navigation.submenu.icon.active.color}"
    },
    shadow: "var(--sc-cmp-menubar-submenu-shadow)",
    padding: "{navigation.list.padding}",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}",
    mobileIndent: "var(--sc-cmp-menubar-submenu-mobile-indent)"
  },
  baseItem: {
    padding: "{navigation.item.padding}",
    borderRadius: "{content.border.radius}"
  },
  separator: {
    borderColor: "{content.border.color}"
  },
  mobileButton: {
    size: "var(--sc-cmp-menubar-mobile-button-size)",
    color: "{text.muted.color}",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    hoverColor: "{text.hover.muted.color}",
    borderRadius: "var(--sc-cmp-menubar-mobile-button-border-radius)",
    hoverBackground: "{content.hover.background}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/message.ts
var message_default = {
  icon: {
    lg: {
      size: "var(--sc-cmp-message-icon-lg-size)"
    },
    sm: {
      size: "var(--sc-cmp-message-icon-sm-size)"
    },
    size: "var(--sc-cmp-message-icon-size)"
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
      padding: "var(--sc-cmp-message-content-lg-padding-y) var(--sc-cmp-message-content-lg-padding-x)"
    },
    sm: {
      padding: "var(--sc-cmp-message-content-sm-padding-y) var(--sc-cmp-message-content-sm-padding-x)"
    },
    gap: "var(--sc-cmp-message-content-gap)",
    padding: "var(--sc-cmp-message-content-padding-y) var(--sc-cmp-message-content-padding-x)"
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
      size: "var(--sc-cmp-message-close-icon-lg-size)"
    },
    sm: {
      size: "var(--sc-cmp-message-close-icon-sm-size)"
    },
    size: "var(--sc-cmp-message-close-icon-size)"
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
    width: "var(--sc-cmp-message-close-button-width)",
    height: "var(--sc-cmp-message-close-button-height)",
    focusRing: {
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}"
    },
    borderRadius: "var(--sc-cmp-message-close-button-border-radius)"
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
        color: "var(--sc-cmp-message-warn-color)",
        simple: {
          color: "var(--sc-cmp-message-warn-simple-color)"
        },
        outlined: {
          color: "var(--sc-cmp-message-warn-outlined-color)",
          borderColor: "var(--sc-cmp-message-warn-outlined-border-color)"
        },
        background: "var(--sc-cmp-message-warn-background)",
        borderColor: "var(--sc-cmp-message-warn-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-message-warn-close-button-focus-ring-color)"
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
        color: "var(--sc-cmp-message-warn-color)",
        simple: {
          color: "var(--sc-cmp-message-warn-simple-color)"
        },
        outlined: {
          color: "var(--sc-cmp-message-warn-outlined-color)",
          borderColor: "var(--sc-cmp-message-warn-outlined-border-color)"
        },
        background: "var(--sc-cmp-message-warn-background)",
        borderColor: "var(--sc-cmp-message-warn-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-message-warn-close-button-focus-ring-color)"
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
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/popover.ts
var popover_default = {
  root: {
    color: "{overlay.popover.color}",
    gutter: "0.714286rem",
    shadow: "var(--sc-cmp-popover-shadow)",
    background: "{overlay.popover.background}",
    arrowOffset: "var(--sc-cmp-popover-arrow-offset)",
    borderColor: "{overlay.popover.border.color}",
    borderRadius: "{overlay.popover.border.radius}"
  },
  content: {
    padding: "{overlay.popover.padding}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/stepper.ts
var stepper_default = {
  root: {
    transitionDuration: "{transition.duration}"
  },
  step: {
    gap: "var(--sc-cmp-stepper-step-gap)",
    padding: "var(--sc-cmp-stepper-step-padding)"
  },
  separator: {
    size: "0.142857rem",
    margin: "var(--sc-cmp-stepper-separator-margin-top) var(--sc-cmp-stepper-separator-margin-right) var(--sc-cmp-stepper-separator-margin-bottom) var(--sc-cmp-stepper-separator-margin-left)",
    background: "{content.border.color}",
    activeBackground: "{primary.color}"
  },
  stepTitle: {
    color: "{text.muted.color}",
    fontWeight: "500",
    activeColor: "{primary.color}"
  },
  steppanel: {
    color: "{content.color}",
    indent: "var(--sc-scale-1)",
    padding: "0",
    background: "{content.background}"
  },
  stepHeader: {
    gap: "var(--sc-cmp-stepper-step-header-gap)",
    padding: "0",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    borderRadius: "{content.border.radius}"
  },
  stepNumber: {
    size: "var(--sc-cmp-stepper-step-number-size)",
    color: "{text.muted.color}",
    shadow: "var(--sc-cmp-stepper-step-number-shadow)",
    fontSize: "var(--sc-scale-1-143)",
    background: "{content.background}",
    fontWeight: "500",
    activeColor: "{primary.color}",
    borderColor: "{content.border.color}",
    borderRadius: "var(--sc-cmp-stepper-step-number-border-radius)",
    activeBackground: "{content.background}",
    activeBorderColor: "{content.border.color}"
  },
  steppanels: {
    padding: "var(--sc-cmp-stepper-steppanels-padding-top) var(--sc-cmp-stepper-steppanels-padding-right) var(--sc-cmp-stepper-steppanels-padding-bottom) var(--sc-cmp-stepper-steppanels-padding-left)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/toolbar.ts
var toolbar_default = {
  root: {
    gap: "var(--sc-cmp-toolbar-gap)",
    color: "{content.color}",
    padding: "var(--sc-cmp-toolbar-padding)",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/tooltip.ts
var tooltip_default = {
  root: {
    gutter: "var(--sc-cmp-tooltip-gutter)",
    shadow: "var(--sc-cmp-tooltip-shadow)",
    padding: "var(--sc-cmp-tooltip-padding-y) var(--sc-cmp-tooltip-padding-x)",
    maxWidth: "var(--sc-cmp-tooltip-max-width)",
    /* 14, no el 12 de Aura (2026-09-13): el Kit dibuja el texto del tooltip a 14 regular
     * (`tooltip-tooltip`, 623:36926) y así casa con menús y desplegables. Por TOKEN y no
     * con una regla en `css.ts`: la hoja de Aura ya lee `tooltip.font.size`, y una clase
     * `.p-tooltip-text` nuestra sería acoplamiento al DOM de PrimeNG que no hace falta
     * (`audit:primeng-coupling`). El interlineado no tiene token: heredaba el 1.5 de la página (21), y desde el
     * 2026-10-09 lo pone `css.ts`, el de la rampa (20), sin tocar la letra. */
    fontSize: "var(--sc-font-size-200)",
    borderRadius: "{overlay.popover.border.radius}"
  },
  colorScheme: {
    dark: {
      root: {
        color: "var(--sc-cmp-tooltip-color)",
        background: "var(--sc-cmp-tooltip-background)"
      }
    },
    light: {
      root: {
        color: "var(--sc-cmp-tooltip-color)",
        background: "var(--sc-cmp-tooltip-background)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/carousel.ts
var carousel_default = {
  root: {
    transitionDuration: "{transition.duration}"
  },
  content: {
    gap: "var(--sc-cmp-carousel-content-gap)"
  },
  indicator: {
    width: "var(--sc-cmp-carousel-indicator-width)",
    height: "var(--sc-cmp-carousel-indicator-height)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    borderRadius: "{content.border.radius}",
    activeBackground: "{primary.color}"
  },
  colorScheme: {
    dark: {
      indicator: {
        background: "{surface.700}",
        hoverBackground: "{surface.600}"
      }
    },
    light: {
      indicator: {
        background: "var(--sc-cmp-carousel-indicator-background)",
        hoverBackground: "var(--sc-cmp-carousel-indicator-hover-background)"
      }
    }
  },
  indicatorList: {
    gap: "var(--sc-cmp-carousel-indicator-list-gap)",
    padding: "var(--sc-cmp-carousel-indicator-list-padding)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/checkbox.ts
var checkbox_default = {
  icon: {
    lg: {
      size: "var(--sc-cmp-checkbox-icon-lg-size)"
    },
    sm: {
      size: "var(--sc-cmp-checkbox-icon-sm-size)"
    },
    size: "var(--sc-cmp-checkbox-icon-size)",
    color: "{form.field.color}",
    checkedColor: "{primary.contrast.color}",
    disabledColor: "{form.field.disabled.color}",
    checkedHoverColor: "{primary.contrast.color}"
  },
  root: {
    lg: {
      width: "var(--sc-cmp-checkbox-lg-width)",
      height: "var(--sc-cmp-checkbox-lg-height)"
    },
    sm: {
      width: "var(--sc-cmp-checkbox-sm-width)",
      height: "var(--sc-cmp-checkbox-sm-height)"
    },
    width: "var(--sc-cmp-checkbox-width)",
    height: "var(--sc-cmp-checkbox-height)",
    shadow: "var(--sc-cmp-checkbox-shadow)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{border.radius.sm}",
    filledBackground: "{form.field.filled.background}",
    focusBorderColor: "{form.field.border.color}",
    hoverBorderColor: "{form.field.hover.border.color}",
    checkedBackground: "{primary.color}",
    checkedBorderColor: "{primary.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{form.field.transition.duration}",
    checkedHoverBackground: "{primary.hover.color}",
    checkedFocusBorderColor: "{primary.color}",
    checkedHoverBorderColor: "{primary.hover.color}",
    checkedDisabledBorderColor: "{form.field.border.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/dataview.ts
var dataview_default = {
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
    borderWidth: "0.071429rem 0 0 0",
    borderRadius: "0"
  },
  header: {
    color: "{content.color}",
    padding: "var(--sc-cmp-dataview-header-padding-y) var(--sc-cmp-dataview-header-padding-x)",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderWidth: "0 0 0.071429rem 0",
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
    borderWidth: "0 0 0.071429rem 0"
  },
  paginatorBottom: {
    borderColor: "{content.border.color}",
    borderWidth: "0.071429rem 0 0 0"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/fieldset.ts
var fieldset_default = {
  root: {
    color: "{content.color}",
    padding: "var(--sc-scale-1-125)",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}",
    transitionDuration: "{transition.duration}"
  },
  legend: {
    gap: "var(--sc-cmp-fieldset-legend-gap)",
    color: "{content.color}",
    padding: "var(--sc-cmp-fieldset-legend-padding-y) var(--sc-cmp-fieldset-legend-padding-x)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "{content.background}",
    fontWeight: "600",
    hoverColor: "{content.hover.color}",
    borderColor: "#00000000",
    borderWidth: "0.071429rem",
    borderRadius: "{content.border.radius}",
    hoverBackground: "{content.hover.background}"
  },
  content: {
    padding: "0"
  },
  toggleIcon: {
    color: "{text.muted.color}",
    hoverColor: "{text.hover.muted.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/galleria.ts
var galleria_default = {
  root: {
    borderColor: "{content.border.color}",
    borderWidth: "0.071429rem",
    borderRadius: "{content.border.radius}",
    transitionDuration: "{transition.duration}"
  },
  caption: {
    color: "{surface.100}",
    padding: "var(--sc-cmp-galleria-caption-padding)",
    background: "#00000080"
  },
  navIcon: {
    size: "var(--sc-cmp-galleria-nav-icon-size)"
  },
  navButton: {
    next: {
      borderRadius: "var(--sc-cmp-galleria-nav-button-next-border-radius)"
    },
    prev: {
      borderRadius: "var(--sc-cmp-galleria-nav-button-prev-border-radius)"
    },
    size: "var(--sc-cmp-galleria-nav-button-size)",
    color: "{surface.100}",
    gutter: "var(--sc-cmp-galleria-nav-button-gutter)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "#ffffff1a",
    hoverColor: "{surface.0}",
    hoverBackground: "#ffffff33"
  },
  closeButton: {
    size: "var(--sc-cmp-galleria-close-button-size)",
    color: "{surface.50}",
    gutter: "var(--sc-cmp-galleria-close-button-gutter)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "#ffffff1a",
    hoverColor: "{surface.0}",
    borderRadius: "var(--sc-cmp-galleria-close-button-border-radius)",
    hoverBackground: "#ffffff33"
  },
  colorScheme: {
    dark: {
      indicatorButton: {
        background: "{surface.700}",
        hoverBackground: "{surface.600}"
      },
      thumbnailNavButton: {
        color: "{surface.400}",
        hoverColor: "var(--sc-cmp-galleria-thumbnail-nav-button-hover-color)",
        hoverBackground: "{surface.700}"
      }
    },
    light: {
      indicatorButton: {
        background: "var(--sc-cmp-galleria-indicator-button-background)",
        hoverBackground: "var(--sc-cmp-galleria-indicator-button-hover-background)"
      },
      thumbnailNavButton: {
        color: "var(--sc-cmp-galleria-thumbnail-nav-button-color)",
        hoverColor: "var(--sc-cmp-galleria-thumbnail-nav-button-hover-color)",
        hoverBackground: "var(--sc-cmp-galleria-thumbnail-nav-button-hover-background)"
      }
    }
  },
  indicatorList: {
    gap: "var(--sc-cmp-galleria-indicator-list-gap)",
    padding: "var(--sc-cmp-galleria-indicator-list-padding)"
  },
  closeButtonIcon: {
    size: "var(--sc-cmp-galleria-close-button-icon-size)"
  },
  indicatorButton: {
    width: "var(--sc-cmp-galleria-indicator-button-width)",
    height: "var(--sc-cmp-galleria-indicator-button-height)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    borderRadius: "var(--sc-cmp-galleria-indicator-button-border-radius)",
    activeBackground: "{primary.color}"
  },
  thumbnailsContent: {
    padding: "var(--sc-cmp-galleria-thumbnails-content-padding-y) var(--sc-cmp-galleria-thumbnails-content-padding-x)",
    background: "{content.background}"
  },
  insetIndicatorList: {
    background: "#00000080"
  },
  thumbnailNavButton: {
    size: "var(--sc-cmp-galleria-thumbnail-nav-button-size)",
    gutter: "var(--sc-cmp-galleria-thumbnail-nav-button-gutter)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    borderRadius: "{content.border.radius}"
  },
  insetIndicatorButton: {
    background: "#ffffff66",
    hoverBackground: "#ffffff99",
    activeBackground: "#ffffffe5"
  },
  thumbnailNavButtonIcon: {
    size: "var(--sc-cmp-galleria-thumbnail-nav-button-icon-size)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/inputotp.ts
var inputotp_default = {
  root: {
    gap: "var(--sc-cmp-inputotp-gap)"
  },
  input: {
    lg: {
      width: "var(--sc-cmp-inputotp-input-lg-width)"
    },
    sm: {
      width: "var(--sc-cmp-inputotp-input-sm-width)"
    },
    width: "var(--sc-cmp-inputotp-input-width)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/megamenu.ts
var megamenu_default = {
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
  root: {
    gap: "var(--sc-cmp-megamenu-gap)",
    color: "{content.color}",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}",
    transitionDuration: "{transition.duration}",
    verticalOrientation: {
      gap: "{navigation.list.gap}",
      padding: "{navigation.list.padding}"
    },
    horizontalOrientation: {
      gap: "var(--sc-cmp-megamenu-horizontal-orientation-gap)",
      padding: "var(--sc-cmp-megamenu-horizontal-orientation-padding-y) var(--sc-cmp-megamenu-horizontal-orientation-padding-x)"
    }
  },
  overlay: {
    gap: "var(--sc-cmp-megamenu-overlay-gap)",
    color: "{content.color}",
    shadow: "var(--sc-cmp-megamenu-overlay-shadow)",
    padding: "0",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  },
  submenu: {
    gap: "{navigation.list.gap}",
    padding: "{navigation.list.padding}"
  },
  baseItem: {
    padding: "{navigation.item.padding}",
    borderRadius: "{content.border.radius}"
  },
  separator: {
    borderColor: "{content.border.color}"
  },
  submenuIcon: {
    size: "{navigation.submenu.icon.size}",
    color: "{navigation.submenu.icon.color}",
    focusColor: "{navigation.submenu.icon.focus.color}",
    activeColor: "{navigation.submenu.icon.active.color}"
  },
  mobileButton: {
    size: "var(--sc-cmp-megamenu-mobile-button-size)",
    color: "{text.muted.color}",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    hoverColor: "{text.hover.muted.color}",
    borderRadius: "var(--sc-cmp-megamenu-mobile-button-border-radius)",
    hoverBackground: "{content.hover.background}"
  },
  submenuLabel: {
    color: "{navigation.submenu.label.color}",
    padding: "{navigation.submenu.label.padding}",
    background: "{navigation.submenu.label.background}",
    fontWeight: "{navigation.submenu.label.font.weight}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/password.ts
var password_default = {
  icon: {
    color: "{form.field.icon.color}"
  },
  meter: {
    height: "var(--sc-cmp-password-meter-height)",
    background: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  },
  content: {
    gap: "var(--sc-cmp-password-content-gap)"
  },
  overlay: {
    color: "{overlay.popover.color}",
    shadow: "var(--sc-cmp-password-overlay-shadow)",
    padding: "{overlay.popover.padding}",
    background: "{overlay.popover.background}",
    borderColor: "{overlay.popover.border.color}",
    borderRadius: "{overlay.popover.border.radius}"
  },
  colorScheme: {
    dark: {
      strength: {
        weakBackground: "var(--sc-cmp-password-strength-weak-background)",
        mediumBackground: "var(--sc-cmp-password-strength-medium-background)",
        strongBackground: "var(--sc-cmp-password-strength-strong-background)"
      }
    },
    light: {
      strength: {
        weakBackground: "var(--sc-cmp-password-strength-weak-background)",
        mediumBackground: "var(--sc-cmp-password-strength-medium-background)",
        strongBackground: "var(--sc-cmp-password-strength-strong-background)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/picklist.ts
var picklist_default = {
  root: {
    gap: "var(--sc-cmp-picklist-gap)"
  },
  controls: {
    gap: "var(--sc-cmp-picklist-controls-gap)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/skeleton.ts
var skeleton_default = {
  root: {
    borderRadius: "{content.border.radius}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/splitter.ts
var splitter_default = {
  root: {
    color: "{content.color}",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    transitionDuration: "{transition.duration}"
  },
  gutter: {
    background: "{content.border.color}"
  },
  handle: {
    size: "1.714286rem",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "#00000000",
    borderRadius: "{content.border.radius}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/terminal.ts
var terminal_default = {
  root: {
    color: "{form.field.color}",
    height: "var(--sc-cmp-terminal-height)",
    padding: "{form.field.padding.y} {form.field.padding.x}",
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}"
  },
  prompt: {
    gap: "var(--sc-cmp-terminal-prompt-gap)"
  },
  commandResponse: {
    margin: "0.142857rem 0"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/textarea.ts
var textarea_default = {
  root: {
    lg: {
      fontSize: "{form.field.lg.font.size}",
      paddingX: "{form.field.lg.padding.x}",
      paddingY: "{form.field.lg.padding.y}"
    },
    sm: {
      fontSize: "{form.field.sm.font.size}",
      paddingX: "{form.field.sm.padding.x}",
      paddingY: "{form.field.sm.padding.y}"
    },
    color: "{form.field.color}",
    shadow: "var(--sc-cmp-textarea-shadow)",
    paddingX: "{form.field.padding.x}",
    paddingY: "{form.field.padding.y}",
    focusRing: {
      color: "{form.field.focus.ring.color}",
      style: "{form.field.focus.ring.style}",
      width: "{form.field.focus.ring.width}",
      offset: "{form.field.focus.ring.offset}",
      shadow: "none"
    },
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}",
    disabledColor: "{form.field.disabled.color}",
    filledBackground: "{form.field.filled.background}",
    focusBorderColor: "{form.field.focus.border.color}",
    hoverBorderColor: "{form.field.hover.border.color}",
    placeholderColor: "{form.field.placeholder.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{form.field.transition.duration}",
    filledFocusBackground: "{form.field.filled.focus.background}",
    filledHoverBackground: "{form.field.filled.hover.background}",
    invalidPlaceholderColor: "{form.field.invalid.placeholder.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/timeline.ts
var timeline_default = {
  event: {
    minHeight: "var(--sc-cmp-timeline-event-min-height)"
  },
  vertical: {
    eventContent: {
      padding: "var(--sc-cmp-timeline-vertical-event-content-padding-y) var(--sc-cmp-timeline-vertical-event-content-padding-x)"
    }
  },
  horizontal: {
    eventContent: {
      padding: "var(--sc-cmp-timeline-horizontal-event-content-padding-y) var(--sc-cmp-timeline-horizontal-event-content-padding-x)"
    }
  },
  eventMarker: {
    size: "var(--sc-cmp-timeline-event-marker-size)",
    content: {
      size: "var(--sc-cmp-timeline-event-marker-content-size)",
      background: "{primary.color}",
      insetShadow: "var(--sc-cmp-timeline-event-marker-content-inset-shadow)",
      borderRadius: "0.1875rem"
    },
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderWidth: "0.142857rem",
    borderRadius: "0.5625rem"
  },
  eventConnector: {
    size: "0.142857rem",
    color: "{content.border.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/accordion.ts
var accordion_default = {
  root: {
    transitionDuration: "{transition.duration}"
  },
  panel: {
    borderColor: "{content.border.color}",
    borderWidth: "0 0 0.071429rem 0"
  },
  header: {
    last: {
      bottomBorderRadius: "{content.border.radius}",
      activeBottomBorderRadius: "0"
    },
    color: "{text.muted.color}",
    first: {
      borderWidth: "0",
      topBorderRadius: "{content.border.radius}"
    },
    padding: "var(--sc-cmp-accordion-header-padding)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "{content.background}",
    fontWeight: "600",
    hoverColor: "{text.color}",
    toggleIcon: {
      color: "{text.muted.color}",
      hoverColor: "{text.color}",
      activeColor: "{text.color}",
      activeHoverColor: "{text.color}"
    },
    activeColor: "{text.color}",
    borderColor: "{content.border.color}",
    borderWidth: "0",
    borderRadius: "0",
    hoverBackground: "{content.background}",
    activeBackground: "{content.background}",
    activeHoverColor: "{text.color}",
    activeHoverBackground: "{content.background}"
  },
  content: {
    color: "{text.color}",
    padding: "var(--sc-cmp-accordion-content-padding-top) var(--sc-cmp-accordion-content-padding-right) var(--sc-cmp-accordion-content-padding-bottom) var(--sc-cmp-accordion-content-padding-left)",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderWidth: "0"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/iconfield.ts
var iconfield_default = {
  icon: {
    color: "{form.field.icon.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/iftalabel.ts
var iftalabel_default = {
  root: {
    top: "{form.field.padding.y}",
    color: "{form.field.float.label.color}",
    fontSize: "var(--sc-font-size-100)",
    positionX: "{form.field.padding.x}",
    focusColor: "{form.field.float.label.focus.color}",
    fontWeight: "400",
    invalidColor: "{form.field.float.label.invalid.color}",
    transitionDuration: "{form.field.transition.duration}"
  },
  input: {
    paddingTop: "var(--sc-cmp-iftalabel-input-padding-top)",
    paddingBottom: "{form.field.padding.y}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/inputtext.ts
var inputtext_default = {
  root: {
    lg: {
      fontSize: "{form.field.lg.font.size}",
      paddingX: "{form.field.lg.padding.x}",
      paddingY: "{form.field.lg.padding.y}"
    },
    sm: {
      fontSize: "{form.field.sm.font.size}",
      paddingX: "{form.field.sm.padding.x}",
      paddingY: "{form.field.sm.padding.y}"
    },
    color: "{form.field.color}",
    shadow: "var(--sc-cmp-inputtext-shadow)",
    paddingX: "{form.field.padding.x}",
    paddingY: "{form.field.padding.y}",
    focusRing: {
      color: "{form.field.focus.ring.color}",
      style: "{form.field.focus.ring.style}",
      width: "{form.field.focus.ring.width}",
      offset: "{form.field.focus.ring.offset}",
      shadow: "none"
    },
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}",
    disabledColor: "{form.field.disabled.color}",
    filledBackground: "{form.field.filled.background}",
    focusBorderColor: "{form.field.focus.border.color}",
    hoverBorderColor: "{form.field.hover.border.color}",
    placeholderColor: "{form.field.placeholder.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{form.field.transition.duration}",
    filledFocusBackground: "{form.field.filled.focus.background}",
    filledHoverBackground: "{form.field.filled.hover.background}",
    invalidPlaceholderColor: "{form.field.invalid.placeholder.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/orderlist.ts
var orderlist_default = {
  root: {
    gap: "var(--sc-cmp-orderlist-gap)"
  },
  controls: {
    gap: "var(--sc-cmp-orderlist-controls-gap)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/paginator.ts
var paginator_default = {
  root: {
    gap: "var(--sc-cmp-paginator-gap)",
    color: "{content.color}",
    padding: "var(--sc-cmp-paginator-padding-y) var(--sc-cmp-paginator-padding-x)",
    background: "{content.background}",
    borderRadius: "{content.border.radius}",
    transitionDuration: "{transition.duration}"
  },
  navButton: {
    color: "{text.muted.color}",
    width: "var(--sc-cmp-paginator-nav-button-width)",
    height: "var(--sc-cmp-paginator-nav-button-height)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "#00000000",
    hoverColor: "{text.hover.muted.color}",
    borderRadius: "var(--sc-cmp-paginator-nav-button-border-radius)",
    selectedColor: "{highlight.color}",
    hoverBackground: "{content.hover.background}",
    selectedBackground: "{highlight.background}"
  },
  jumpToPageInput: {
    maxWidth: "var(--sc-cmp-paginator-jump-to-page-input-max-width)"
  },
  currentPageReport: {
    color: "{text.muted.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/panelmenu.ts
var panelmenu_default = {
  item: {
    gap: "var(--sc-cmp-panelmenu-item-gap)",
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
    gap: "var(--sc-cmp-panelmenu-gap)",
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
    indent: "var(--sc-cmp-panelmenu-submenu-indent)"
  },
  submenuIcon: {
    color: "{navigation.submenu.icon.color}",
    focusColor: "{navigation.submenu.icon.focus.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/speeddial.ts
var speeddial_default = {
  root: {
    gap: "var(--sc-cmp-speeddial-gap)",
    transitionDuration: "{transition.duration}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/treetable.ts
var treetable_default = {
  row: {
    color: "{content.color}",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "-0.071429rem",
      shadow: "none"
    },
    background: "{content.background}",
    hoverColor: "{content.hover.color}",
    selectedColor: "{highlight.color}",
    hoverBackground: "{content.hover.background}",
    selectedBackground: "{highlight.background}"
  },
  root: {
    transitionDuration: "{transition.duration}"
  },
  footer: {
    color: "{content.color}",
    padding: "var(--sc-cmp-treetable-footer-padding-y) var(--sc-cmp-treetable-footer-padding-x)",
    background: "{content.background}",
    borderColor: "{treetable.border.color}",
    borderWidth: "0 0 0.071429rem 0"
  },
  header: {
    color: "{content.color}",
    padding: "var(--sc-cmp-treetable-header-padding-y) var(--sc-cmp-treetable-header-padding-x)",
    background: "{content.background}",
    borderColor: "{treetable.border.color}",
    borderWidth: "0 0 0.071429rem 0"
  },
  bodyCell: {
    gap: "var(--sc-cmp-treetable-body-cell-gap)",
    padding: "var(--sc-cmp-treetable-body-cell-padding-y) var(--sc-cmp-treetable-body-cell-padding-x)",
    borderColor: "{treetable.border.color}"
  },
  sortIcon: {
    size: "var(--sc-cmp-treetable-sort-icon-size)",
    color: "{text.muted.color}",
    hoverColor: "{text.hover.muted.color}"
  },
  footerCell: {
    color: "{content.color}",
    padding: "var(--sc-cmp-treetable-footer-cell-padding-y) var(--sc-cmp-treetable-footer-cell-padding-x)",
    background: "{content.background}",
    borderColor: "{treetable.border.color}"
  },
  headerCell: {
    gap: "var(--sc-cmp-treetable-header-cell-gap)",
    color: "{content.color}",
    padding: "var(--sc-cmp-treetable-header-cell-padding-y) var(--sc-cmp-treetable-header-cell-padding-x)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "-0.071429rem",
      shadow: "none"
    },
    background: "{content.background}",
    hoverColor: "{content.hover.color}",
    borderColor: "{treetable.border.color}",
    selectedColor: "{highlight.color}",
    hoverBackground: "{content.hover.background}",
    selectedBackground: "{highlight.background}"
  },
  colorScheme: {
    dark: {
      root: {
        borderColor: "var(--sc-cmp-treetable-border-color)"
      },
      bodyCell: {
        selectedBorderColor: "var(--sc-cmp-treetable-body-cell-selected-border-color)"
      }
    },
    light: {
      root: {
        borderColor: "{content.border.color}"
      },
      bodyCell: {
        selectedBorderColor: "{primary.100}"
      }
    }
  },
  columnTitle: {
    fontWeight: "600"
  },
  loadingIcon: {
    size: "var(--sc-cmp-treetable-loading-icon-size)"
  },
  columnFooter: {
    fontWeight: "600"
  },
  paginatorTop: {
    borderColor: "{content.border.color}",
    borderWidth: "0 0 0.071429rem 0"
  },
  columnResizer: {
    width: "var(--sc-cmp-treetable-column-resizer-width)"
  },
  paginatorBottom: {
    borderColor: "{content.border.color}",
    borderWidth: "0 0 0.071429rem 0"
  },
  resizeIndicator: {
    color: "{primary.color}",
    width: "0.071429rem"
  },
  nodeToggleButton: {
    size: "var(--sc-cmp-treetable-node-toggle-button-size)",
    color: "{text.muted.color}",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    hoverColor: "{text.color}",
    borderRadius: "var(--sc-cmp-treetable-node-toggle-button-border-radius)",
    hoverBackground: "{content.hover.background}",
    selectedHoverColor: "{primary.color}",
    selectedHoverBackground: "{content.background}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/datatable.ts
var datatable_default = {
  header: {
    padding: "var(--sc-cmp-datatable-header-padding-y) var(--sc-cmp-datatable-header-padding-x)",
    sm: {
      padding: "var(--sc-cmp-datatable-header-sm-padding-y) var(--sc-cmp-datatable-header-sm-padding-x)"
    },
    lg: {
      padding: "var(--sc-cmp-datatable-header-lg-padding-y) var(--sc-cmp-datatable-header-lg-padding-x)"
    }
  },
  headerCell: {
    gap: "var(--sc-cmp-datatable-header-cell-gap)",
    padding: "var(--sc-cmp-datatable-header-cell-padding-y) var(--sc-cmp-datatable-header-cell-padding-x)",
    sm: {
      padding: "var(--sc-cmp-datatable-header-cell-sm-padding-y) var(--sc-cmp-datatable-header-cell-sm-padding-x)"
    },
    lg: {
      padding: "var(--sc-cmp-datatable-header-cell-lg-padding-y) var(--sc-cmp-datatable-header-cell-lg-padding-x)"
    }
  },
  bodyCell: {
    padding: "var(--sc-cmp-datatable-body-cell-padding-y) var(--sc-cmp-datatable-body-cell-padding-x)",
    sm: {
      padding: "var(--sc-cmp-datatable-body-cell-sm-padding-y) var(--sc-cmp-datatable-body-cell-sm-padding-x)"
    },
    lg: {
      padding: "var(--sc-cmp-datatable-body-cell-lg-padding-y) var(--sc-cmp-datatable-body-cell-lg-padding-x)"
    }
  },
  footerCell: {
    padding: "var(--sc-cmp-datatable-footer-cell-padding-y) var(--sc-cmp-datatable-footer-cell-padding-x)",
    sm: {
      padding: "var(--sc-cmp-datatable-footer-cell-sm-padding-y) var(--sc-cmp-datatable-footer-cell-sm-padding-x)"
    },
    lg: {
      padding: "var(--sc-cmp-datatable-footer-cell-lg-padding-y) var(--sc-cmp-datatable-footer-cell-lg-padding-x)"
    }
  },
  footer: {
    padding: "var(--sc-cmp-datatable-footer-padding-y) var(--sc-cmp-datatable-footer-padding-x)",
    sm: {
      padding: "var(--sc-cmp-datatable-footer-sm-padding-y) var(--sc-cmp-datatable-footer-sm-padding-x)"
    },
    lg: {
      padding: "var(--sc-cmp-datatable-footer-lg-padding-y) var(--sc-cmp-datatable-footer-lg-padding-x)"
    }
  },
  filter: {
    inlineGap: "var(--sc-cmp-datatable-filter-inline-gap)",
    overlayPopover: {
      gap: "var(--sc-cmp-datatable-filter-overlay-popover-gap)"
    }
  },
  colorScheme: {
    dark: {
      bodyCell: {
        selectedBorderColor: "var(--sc-cmp-datatable-body-cell-selected-border-color)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/breadcrumb.ts
var breadcrumb_default = {
  item: {
    gap: "{navigation.item.gap}",
    icon: {
      color: "{navigation.item.icon.color}",
      hoverColor: "{navigation.item.icon.focus.color}"
    },
    color: "{text.muted.color}",
    /* El tamaño va aquí, en el TOKEN del componente, y no heredado del
     * contenedor. Medido el 2026-08-25: sin esta línea el `<p-breadcrumb>`
     * no fija `font-size` en ninguna parte —ni el preset ni el SCSS del
     * wrapper— así que HEREDA el de donde lo sueltes. En la TopBar del
     * supervisor eso daba **16px** cuando el DS dice 14, y en la demo de
     * sc-docs habría dado otro número: un componente del DS que mide
     * distinto según dónde caiga no es un componente del DS.
     *
     * 14 = `--sc-font-size-200`, el cuerpo de texto del DS, y es lo que
     * marca el maestro de Figma para la miga. */
    label: {
      fontSize: "var(--sc-font-size-200)"
    },
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    hoverColor: "{text.color}",
    borderRadius: "{content.border.radius}"
  },
  root: {
    gap: "var(--sc-cmp-breadcrumb-gap)",
    padding: "var(--sc-cmp-breadcrumb-padding)",
    background: "{content.background}",
    transitionDuration: "{transition.duration}"
  },
  separator: {
    color: "{navigation.item.icon.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/datepicker.ts
var datepicker_default = {
  date: {
    color: "{content.color}",
    width: "var(--sc-cmp-datepicker-date-width)",
    height: "var(--sc-cmp-datepicker-date-height)",
    padding: "var(--sc-cmp-datepicker-date-padding)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    hoverColor: "{content.hover.color}",
    borderRadius: "var(--sc-cmp-datepicker-date-border-radius)",
    selectedColor: "{primary.contrast.color}",
    hoverBackground: "{content.hover.background}",
    rangeSelectedColor: "{highlight.color}",
    selectedBackground: "{primary.color}",
    rangeSelectedBackground: "{highlight.background}"
  },
  root: {
    transitionDuration: "{form.field.transition.duration}"
  },
  year: {
    padding: "var(--sc-cmp-datepicker-year-padding)",
    borderRadius: "{content.border.radius}"
  },
  group: {
    gap: "{overlay.popover.padding}",
    borderColor: "{content.border.color}"
  },
  month: {
    padding: "var(--sc-cmp-datepicker-month-padding)",
    borderRadius: "{content.border.radius}"
  },
  panel: {
    color: "{content.color}",
    shadow: "var(--sc-cmp-datepicker-panel-shadow)",
    padding: "{overlay.popover.padding}",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  },
  /*
   * `fontSize: "1em"` en título, mes y año = «lo que mida la cabecera». Hasta que Aura
   * fue la base del tema (2026-09-13) estos tres no tenían tamaño propio y lo heredaban
   * de `.p-datepicker-header`, que es donde `sc-datepicker` fija el de cada talla (sm 12,
   * lg 16). Aura les trae 14px fijos, y un valor propio le gana al heredado: medido en
   * Conversaciones (talla sm), mes y año a 14 con los días a 12. `1em` devuelve la
   * herencia sin añadir clases `.p-*` al componente (`audit:primeng-coupling`).
   */
  title: {
    gap: "var(--sc-cmp-datepicker-title-gap)",
    fontSize: "1em",
    fontWeight: "500"
  },
  header: {
    color: "{content.color}",
    padding: "var(--sc-cmp-datepicker-header-padding-top) var(--sc-cmp-datepicker-header-padding-right) var(--sc-cmp-datepicker-header-padding-bottom) var(--sc-cmp-datepicker-header-padding-left)",
    background: "{content.background}",
    borderColor: "{content.border.color}"
  },
  dayView: {
    margin: "var(--sc-cmp-datepicker-day-view-margin-top) var(--sc-cmp-datepicker-day-view-margin-right) var(--sc-cmp-datepicker-day-view-margin-bottom) var(--sc-cmp-datepicker-day-view-margin-left)"
  },
  weekDay: {
    color: "{content.color}",
    padding: "var(--sc-cmp-datepicker-week-day-padding)",
    fontWeight: "500"
  },
  dropdown: {
    lg: {
      width: "var(--sc-cmp-datepicker-dropdown-lg-width)"
    },
    sm: {
      width: "var(--sc-cmp-datepicker-dropdown-sm-width)"
    },
    width: "var(--sc-cmp-datepicker-dropdown-width)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}",
    hoverBorderColor: "{form.field.border.color}",
    activeBorderColor: "{form.field.border.color}"
  },
  yearView: {
    margin: "var(--sc-cmp-datepicker-year-view-margin-top) var(--sc-cmp-datepicker-year-view-margin-right) var(--sc-cmp-datepicker-year-view-margin-bottom) var(--sc-cmp-datepicker-year-view-margin-left)"
  },
  buttonbar: {
    padding: "var(--sc-cmp-datepicker-buttonbar-padding-top) var(--sc-cmp-datepicker-buttonbar-padding-right) var(--sc-cmp-datepicker-buttonbar-padding-bottom) var(--sc-cmp-datepicker-buttonbar-padding-left)",
    borderColor: "{content.border.color}"
  },
  inputIcon: {
    color: "{form.field.icon.color}"
  },
  monthView: {
    margin: "var(--sc-cmp-datepicker-month-view-margin-top) var(--sc-cmp-datepicker-month-view-margin-right) var(--sc-cmp-datepicker-month-view-margin-bottom) var(--sc-cmp-datepicker-month-view-margin-left)"
  },
  selectYear: {
    fontSize: "1em",
    color: "{content.color}",
    padding: "var(--sc-cmp-datepicker-select-year-padding-y) var(--sc-cmp-datepicker-select-year-padding-x)",
    hoverColor: "{content.hover.color}",
    borderRadius: "{content.border.radius}",
    hoverBackground: "{content.hover.background}"
  },
  timePicker: {
    gap: "var(--sc-cmp-datepicker-time-picker-gap)",
    padding: "var(--sc-cmp-datepicker-time-picker-padding-top) var(--sc-cmp-datepicker-time-picker-padding-right) var(--sc-cmp-datepicker-time-picker-padding-bottom) var(--sc-cmp-datepicker-time-picker-padding-left)",
    buttonGap: "var(--sc-cmp-datepicker-time-picker-button-gap)",
    borderColor: "{content.border.color}"
  },
  colorScheme: {
    dark: {
      today: {
        color: "var(--sc-cmp-datepicker-today-color)",
        background: "{surface.700}"
      },
      dropdown: {
        color: "{surface.300}",
        background: "{surface.800}",
        hoverColor: "{surface.200}",
        activeColor: "{surface.100}",
        hoverBackground: "{surface.700}",
        activeBackground: "{surface.600}"
      }
    },
    light: {
      today: {
        color: "var(--sc-cmp-datepicker-today-color)",
        background: "var(--sc-cmp-datepicker-today-background)"
      },
      dropdown: {
        color: "var(--sc-cmp-datepicker-dropdown-color)",
        background: "var(--sc-cmp-datepicker-dropdown-background)",
        hoverColor: "var(--sc-cmp-datepicker-dropdown-hover-color)",
        activeColor: "var(--sc-cmp-datepicker-dropdown-active-color)",
        hoverBackground: "var(--sc-cmp-datepicker-dropdown-hover-background)",
        activeBackground: "var(--sc-cmp-datepicker-dropdown-active-background)"
      }
    }
  },
  selectMonth: {
    fontSize: "1em",
    color: "{content.color}",
    padding: "var(--sc-cmp-datepicker-select-month-padding-y) var(--sc-cmp-datepicker-select-month-padding-x)",
    hoverColor: "{content.hover.color}",
    borderRadius: "{content.border.radius}",
    hoverBackground: "{content.hover.background}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/fileupload.ts
var fileupload_default = {
  file: {
    gap: "var(--sc-cmp-fileupload-file-gap)",
    info: {
      gap: "var(--sc-cmp-fileupload-file-info-gap)"
    },
    padding: "var(--sc-cmp-fileupload-file-padding)",
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
    gap: "var(--sc-cmp-fileupload-basic-gap)"
  },
  header: {
    gap: "var(--sc-cmp-fileupload-header-gap)",
    color: "{text.color}",
    padding: "var(--sc-cmp-fileupload-header-padding)",
    background: "#00000000",
    borderColor: "#00000000",
    borderWidth: "0",
    borderRadius: "0"
  },
  content: {
    gap: "var(--sc-cmp-fileupload-content-gap)",
    padding: "var(--sc-cmp-fileupload-content-padding-top) var(--sc-cmp-fileupload-content-padding-right) var(--sc-cmp-fileupload-content-padding-bottom) var(--sc-cmp-fileupload-content-padding-left)",
    highlightBorderColor: "{primary.color}"
  },
  fileList: {
    gap: "var(--sc-cmp-fileupload-file-list-gap)"
  },
  progressbar: {
    height: "var(--sc-cmp-fileupload-progressbar-height)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/floatlabel.ts
var floatlabel_default = {
  in: {
    input: {
      paddingTop: "var(--sc-cmp-floatlabel-in-input-padding-top)",
      paddingBottom: "{form.field.padding.y}"
    },
    active: {
      top: "{form.field.padding.y}"
    }
  },
  on: {
    active: {
      padding: "var(--sc-cmp-floatlabel-on-active-padding-y) var(--sc-cmp-floatlabel-on-active-padding-x)",
      background: "{form.field.background}"
    },
    borderRadius: "{border.radius.xs}"
  },
  over: {
    active: {
      top: "var(--sc-cmp-floatlabel-over-active-top)"
    }
  },
  root: {
    color: "{form.field.float.label.color}",
    active: {
      fontSize: "var(--sc-font-size-100)",
      fontWeight: "400"
    },
    positionX: "{form.field.padding.x}",
    positionY: "{form.field.padding.y}",
    focusColor: "{form.field.float.label.focus.color}",
    fontWeight: "500",
    activeColor: "{form.field.float.label.active.color}",
    invalidColor: "{form.field.float.label.invalid.color}",
    transitionDuration: "{form.field.transition.duration}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/inputgroup.ts
var inputgroup_default = {
  addon: {
    color: "{form.field.icon.color}",
    padding: "var(--sc-cmp-inputgroup-addon-padding-y) var(--sc-cmp-inputgroup-addon-padding-x)",
    minWidth: "var(--sc-cmp-inputgroup-addon-min-width)",
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/metergroup.ts
var metergroup_default = {
  root: {
    gap: "var(--sc-cmp-metergroup-gap)",
    borderRadius: "{content.border.radius}"
  },
  label: {
    gap: "var(--sc-cmp-metergroup-label-gap)"
  },
  meters: {
    size: "var(--sc-cmp-metergroup-meters-size)",
    background: "{content.border.color}"
  },
  labelIcon: {
    size: "var(--sc-cmp-metergroup-label-icon-size)"
  },
  labelList: {
    verticalGap: "var(--sc-cmp-metergroup-label-list-vertical-gap)",
    horizontalGap: "var(--sc-cmp-metergroup-label-list-horizontal-gap)"
  },
  labelMarker: {
    size: "var(--sc-cmp-metergroup-label-marker-size)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/tieredmenu.ts
var tieredmenu_default = {
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
    mobileIndent: "var(--sc-cmp-tieredmenu-submenu-mobile-indent)"
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
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/treeselect.ts
var treeselect_default = {
  chip: {
    borderRadius: "{border.radius.sm}"
  },
  root: {
    lg: {
      fontSize: "{form.field.lg.font.size}",
      paddingX: "{form.field.lg.padding.x}",
      paddingY: "{form.field.lg.padding.y}"
    },
    sm: {
      fontSize: "{form.field.sm.font.size}",
      paddingX: "{form.field.sm.padding.x}",
      paddingY: "{form.field.sm.padding.y}"
    },
    color: "{form.field.color}",
    shadow: "var(--sc-cmp-treeselect-shadow)",
    paddingX: "{form.field.padding.x}",
    paddingY: "{form.field.padding.y}",
    focusRing: {
      color: "{form.field.focus.ring.color}",
      style: "{form.field.focus.ring.style}",
      width: "{form.field.focus.ring.width}",
      offset: "{form.field.focus.ring.offset}",
      shadow: "none"
    },
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}",
    disabledColor: "{form.field.disabled.color}",
    filledBackground: "{form.field.filled.background}",
    focusBorderColor: "{form.field.focus.border.color}",
    hoverBorderColor: "{form.field.hover.border.color}",
    placeholderColor: "{form.field.placeholder.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{transition.duration}",
    filledFocusBackground: "{form.field.filled.focus.background}",
    filledHoverBackground: "{form.field.filled.hover.background}",
    invalidPlaceholderColor: "{form.field.invalid.placeholder.color}"
  },
  tree: {
    padding: "var(--sc-scale-0-25)"
  },
  overlay: {
    color: "{overlay.select.color}",
    shadow: "var(--sc-cmp-treeselect-overlay-shadow)",
    background: "{overlay.select.background}",
    borderColor: "{overlay.select.border.color}",
    borderRadius: "{overlay.select.border.radius}"
  },
  dropdown: {
    color: "{form.field.icon.color}",
    width: "var(--sc-cmp-treeselect-dropdown-width)"
  },
  clearIcon: {
    color: "{form.field.icon.color}"
  },
  emptyMessage: {
    padding: "{list.option.padding}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/contextmenu.ts
var contextmenu_default = {
  item: {
    gap: "{navigation.item.gap}",
    icon: {
      color: "{navigation.item.icon.color}",
      focusColor: "{navigation.item.icon.focus.color}",
      activeColor: "{navigation.item.icon.active.color}"
    },
    color: "{navigation.item.color}",
    padding: "var(--sc-cmp-contextmenu-item-padding-y) var(--sc-cmp-contextmenu-item-padding-x)",
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
    shadow: "var(--sc-cmp-contextmenu-shadow)",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}",
    transitionDuration: "{transition.duration}"
  },
  submenu: {
    mobileIndent: "var(--sc-cmp-contextmenu-submenu-mobile-indent)"
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
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/inputnumber.ts
var inputnumber_default = {
  root: {
    transitionDuration: "{transition.duration}"
  },
  button: {
    width: "var(--sc-cmp-inputnumber-button-width)",
    borderRadius: "{form.field.border.radius}",
    verticalPadding: "{form.field.padding.y}"
  },
  colorScheme: {
    dark: {
      button: {
        color: "{surface.400}",
        background: "var(--sc-cmp-inputnumber-button-background)",
        hoverColor: "{surface.300}",
        activeColor: "{surface.200}",
        borderColor: "{form.field.border.color}",
        hoverBackground: "{surface.800}",
        activeBackground: "{surface.700}",
        hoverBorderColor: "{form.field.border.color}",
        activeBorderColor: "{form.field.border.color}"
      }
    },
    light: {
      button: {
        color: "var(--sc-cmp-inputnumber-button-color)",
        background: "var(--sc-cmp-inputnumber-button-background)",
        hoverColor: "var(--sc-cmp-inputnumber-button-hover-color)",
        activeColor: "var(--sc-cmp-inputnumber-button-active-color)",
        borderColor: "{form.field.border.color}",
        hoverBackground: "var(--sc-cmp-inputnumber-button-hover-background)",
        activeBackground: "var(--sc-cmp-inputnumber-button-active-background)",
        hoverBorderColor: "{form.field.border.color}",
        activeBorderColor: "{form.field.border.color}"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/multiselect.ts
var multiselect_default = {
  chip: {
    borderRadius: "{border.radius.sm}"
  },
  list: {
    gap: "{list.gap}",
    header: {
      padding: "{list.header.padding}"
    },
    padding: "{list.padding}"
  },
  root: {
    lg: {
      fontSize: "{form.field.lg.font.size}",
      paddingX: "{form.field.lg.padding.x}",
      paddingY: "{form.field.lg.padding.y}"
    },
    sm: {
      fontSize: "{form.field.sm.font.size}",
      paddingX: "{form.field.sm.padding.x}",
      paddingY: "{form.field.sm.padding.y}"
    },
    color: "{form.field.color}",
    shadow: "var(--sc-cmp-multiselect-shadow)",
    paddingX: "{form.field.padding.x}",
    paddingY: "{form.field.padding.y}",
    focusRing: {
      color: "{form.field.focus.ring.color}",
      style: "{form.field.focus.ring.style}",
      width: "{form.field.focus.ring.width}",
      offset: "{form.field.focus.ring.offset}",
      shadow: "none"
    },
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}",
    disabledColor: "{form.field.disabled.color}",
    filledBackground: "{form.field.filled.background}",
    focusBorderColor: "{form.field.focus.border.color}",
    hoverBorderColor: "{form.field.hover.border.color}",
    placeholderColor: "{form.field.placeholder.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{form.field.transition.duration}",
    filledFocusBackground: "{form.field.filled.focus.background}",
    filledHoverBackground: "{form.field.filled.hover.background}",
    invalidPlaceholderColor: "{form.field.invalid.placeholder.color}"
  },
  option: {
    gap: "var(--sc-cmp-multiselect-option-gap)",
    color: "{list.option.color}",
    padding: "{list.option.padding}",
    focusColor: "{list.option.focus.color}",
    borderRadius: "{list.option.border.radius}",
    selectedColor: "{list.option.selected.color}",
    focusBackground: "{list.option.focus.background}",
    selectedBackground: "{list.option.selected.background}",
    selectedFocusColor: "{list.option.selected.focus.color}",
    selectedFocusBackground: "{list.option.selected.focus.background}"
  },
  overlay: {
    color: "{overlay.select.color}",
    shadow: "var(--sc-cmp-multiselect-overlay-shadow)",
    background: "{overlay.select.background}",
    borderColor: "{overlay.select.border.color}",
    borderRadius: "{overlay.select.border.radius}"
  },
  dropdown: {
    color: "{form.field.icon.color}",
    width: "var(--sc-cmp-multiselect-dropdown-width)"
  },
  clearIcon: {
    color: "{form.field.icon.color}"
  },
  optionGroup: {
    color: "{list.option.group.color}",
    padding: "{list.option.group.padding}",
    background: "{list.option.group.background}",
    fontWeight: "{list.option.group.font.weight}"
  },
  emptyMessage: {
    padding: "{list.option.padding}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/progressbar.ts
var progressbar_default = {
  root: {
    height: "var(--sc-cmp-progressbar-height)",
    background: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  },
  label: {
    color: "{primary.contrast.color}",
    fontSize: "var(--sc-font-size-100)",
    fontWeight: "600"
  },
  value: {
    background: "{primary.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/radiobutton.ts
var radiobutton_default = {
  icon: {
    lg: {
      size: "var(--sc-cmp-radiobutton-icon-lg-size)"
    },
    sm: {
      size: "var(--sc-cmp-radiobutton-icon-sm-size)"
    },
    size: "var(--sc-cmp-radiobutton-icon-size)",
    checkedColor: "{primary.contrast.color}",
    disabledColor: "{form.field.disabled.color}",
    checkedHoverColor: "{primary.contrast.color}"
  },
  root: {
    lg: {
      width: "var(--sc-cmp-radiobutton-lg-width)",
      height: "var(--sc-cmp-radiobutton-lg-height)"
    },
    sm: {
      width: "var(--sc-cmp-radiobutton-sm-width)",
      height: "var(--sc-cmp-radiobutton-sm-height)"
    },
    width: "var(--sc-cmp-radiobutton-width)",
    height: "var(--sc-cmp-radiobutton-height)",
    shadow: "var(--sc-cmp-radiobutton-shadow)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    filledBackground: "{form.field.filled.background}",
    focusBorderColor: "{form.field.border.color}",
    hoverBorderColor: "{form.field.hover.border.color}",
    checkedBackground: "{primary.color}",
    checkedBorderColor: "{primary.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{form.field.transition.duration}",
    checkedHoverBackground: "{primary.hover.color}",
    checkedFocusBorderColor: "{primary.color}",
    checkedHoverBorderColor: "{primary.hover.color}",
    checkedDisabledBorderColor: "{form.field.border.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/scrollpanel.ts
var scrollpanel_default = {
  bar: {
    size: "0.642857rem",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    borderRadius: "{border.radius.sm}"
  },
  root: {
    transitionDuration: "{transition.duration}"
  },
  colorScheme: {
    dark: {
      bar: {
        background: "{surface.800}"
      }
    },
    light: {
      bar: {
        background: "var(--sc-cmp-scrollpanel-bar-background)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/splitbutton.ts
var splitbutton_default = {
  root: {
    borderRadius: "{form.field.border.radius}",
    raisedShadow: "var(--sc-cmp-splitbutton-raised-shadow)",
    roundedBorderRadius: "var(--sc-cmp-splitbutton-rounded-border-radius)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/autocomplete.ts
var autocomplete_default = {
  chip: {
    borderRadius: "{border.radius.sm}"
  },
  list: {
    gap: "{list.gap}",
    padding: "{list.padding}"
  },
  root: {
    color: "{form.field.color}",
    shadow: "var(--sc-cmp-autocomplete-shadow)",
    paddingX: "{form.field.padding.x}",
    paddingY: "{form.field.padding.y}",
    focusRing: {
      color: "{form.field.focus.ring.color}",
      style: "{form.field.focus.ring.style}",
      width: "{form.field.focus.ring.width}",
      offset: "{form.field.focus.ring.offset}",
      shadow: "none"
    },
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}",
    disabledColor: "{form.field.disabled.color}",
    filledBackground: "{form.field.filled.background}",
    focusBorderColor: "{form.field.focus.border.color}",
    hoverBorderColor: "{form.field.hover.border.color}",
    placeholderColor: "{form.field.placeholder.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{form.field.transition.duration}",
    filledFocusBackground: "{form.field.filled.focus.background}",
    filledHoverBackground: "{form.field.filled.hover.background}",
    invalidPlaceholderColor: "{form.field.invalid.placeholder.color}"
  },
  option: {
    color: "{list.option.color}",
    padding: "{list.option.padding}",
    focusColor: "{list.option.focus.color}",
    borderRadius: "{list.option.border.radius}",
    selectedColor: "{list.option.selected.color}",
    focusBackground: "{list.option.focus.background}",
    selectedBackground: "{list.option.selected.background}",
    selectedFocusColor: "{list.option.selected.focus.color}",
    selectedFocusBackground: "{list.option.selected.focus.background}"
  },
  overlay: {
    color: "{overlay.select.color}",
    shadow: "var(--sc-cmp-autocomplete-overlay-shadow)",
    background: "{overlay.select.background}",
    borderColor: "{overlay.select.border.color}",
    borderRadius: "{overlay.select.border.radius}"
  },
  dropdown: {
    lg: {
      width: "var(--sc-cmp-autocomplete-dropdown-lg-width)"
    },
    sm: {
      width: "var(--sc-cmp-autocomplete-dropdown-sm-width)"
    },
    width: "var(--sc-cmp-autocomplete-dropdown-width)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}",
    hoverBorderColor: "{form.field.border.color}",
    activeBorderColor: "{form.field.border.color}"
  },
  colorScheme: {
    dark: {
      chip: {
        focusColor: "var(--sc-cmp-autocomplete-chip-focus-color)",
        focusBackground: "{surface.700}"
      },
      dropdown: {
        color: "{surface.300}",
        background: "{surface.800}",
        hoverColor: "{surface.200}",
        activeColor: "{surface.100}",
        hoverBackground: "{surface.700}",
        activeBackground: "{surface.600}"
      }
    },
    light: {
      chip: {
        focusColor: "var(--sc-cmp-autocomplete-chip-focus-color)",
        focusBackground: "var(--sc-cmp-autocomplete-chip-focus-background)"
      },
      dropdown: {
        color: "var(--sc-cmp-autocomplete-dropdown-color)",
        background: "var(--sc-cmp-autocomplete-dropdown-background)",
        hoverColor: "var(--sc-cmp-autocomplete-dropdown-hover-color)",
        activeColor: "var(--sc-cmp-autocomplete-dropdown-active-color)",
        hoverBackground: "var(--sc-cmp-autocomplete-dropdown-hover-background)",
        activeBackground: "var(--sc-cmp-autocomplete-dropdown-active-background)"
      }
    }
  },
  optionGroup: {
    color: "{list.option.group.color}",
    padding: "{list.option.group.padding}",
    background: "{list.option.group.background}",
    fontWeight: "{list.option.group.font.weight}"
  },
  emptyMessage: {
    padding: "{list.option.padding}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/confirmpopup.ts
var confirmpopup_default = {
  icon: {
    size: "var(--sc-cmp-confirmpopup-icon-size)",
    color: "{overlay.popover.color}"
  },
  root: {
    color: "{overlay.popover.color}",
    gutter: "0.714286rem",
    shadow: "var(--sc-cmp-confirmpopup-shadow)",
    background: "{overlay.popover.background}",
    arrowOffset: "var(--sc-cmp-confirmpopup-arrow-offset)",
    borderColor: "{overlay.popover.border.color}",
    borderRadius: "{overlay.popover.border.radius}"
  },
  footer: {
    gap: "var(--sc-cmp-confirmpopup-footer-gap)",
    padding: "0 {overlay.popover.padding} {overlay.popover.padding}"
  },
  content: {
    gap: "var(--sc-cmp-confirmpopup-content-gap)",
    padding: "{overlay.popover.padding}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/imagecompare.ts
var imagecompare_default = {
  handle: {
    size: "1.071429rem",
    focusRing: {
      color: "#ffffff4d",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    hoverSize: "2.142857rem",
    background: "#ffffff4d",
    borderColor: "#00000000",
    borderWidth: "0",
    borderRadius: "0.535714rem",
    hoverBackground: "#ffffff4d",
    hoverBorderColor: "#00000000",
    transitionDuration: "{transition.duration}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/overlaybadge.ts
var overlaybadge_default = {
  root: {
    outline: {
      color: "{content.background}",
      width: "0.142857rem"
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/selectbutton.ts
var selectbutton_default = {
  root: {
    borderRadius: "{form.field.border.radius}"
  },
  colorScheme: {
    dark: {
      root: {
        invalidBorderColor: "{form.field.invalid.border.color}"
      }
    },
    light: {
      root: {
        invalidBorderColor: "{form.field.invalid.border.color}"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/togglebutton.ts
var togglebutton_default = {
  icon: {
    disabledColor: "{form.field.disabled.color}"
  },
  root: {
    lg: {
      padding: "var(--sc-cmp-togglebutton-lg-padding)",
      fontSize: "{form.field.lg.font.size}"
    },
    sm: {
      padding: "var(--sc-cmp-togglebutton-sm-padding)",
      fontSize: "{form.field.sm.font.size}"
    },
    gap: "var(--sc-cmp-togglebutton-gap)",
    padding: "var(--sc-cmp-togglebutton-padding)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    fontWeight: "500",
    borderRadius: "{content.border.radius}",
    disabledColor: "{form.field.disabled.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{form.field.transition.duration}",
    disabledBorderColor: "{form.field.disabled.background}"
  },
  content: {
    lg: {
      padding: "var(--sc-cmp-togglebutton-content-lg-padding-y) var(--sc-cmp-togglebutton-content-lg-padding-x)"
    },
    sm: {
      padding: "var(--sc-cmp-togglebutton-content-sm-padding-y) var(--sc-cmp-togglebutton-content-sm-padding-x)"
    },
    padding: "var(--sc-cmp-togglebutton-content-padding-y) var(--sc-cmp-togglebutton-content-padding-x)",
    borderRadius: "{content.border.radius}",
    checkedShadow: "var(--sc-cmp-togglebutton-content-checked-shadow)"
  },
  colorScheme: {
    dark: {
      icon: {
        color: "{surface.400}",
        hoverColor: "{surface.300}",
        checkedColor: "var(--sc-cmp-togglebutton-icon-checked-color)"
      },
      root: {
        color: "var(--sc-cmp-togglebutton-color)",
        background: "var(--sc-cmp-togglebutton-background)",
        hoverColor: "var(--sc-cmp-togglebutton-hover-color)",
        borderColor: "var(--sc-cmp-togglebutton-border-color)",
        checkedColor: "var(--sc-cmp-togglebutton-checked-color)",
        hoverBackground: "var(--sc-cmp-togglebutton-hover-background)",
        checkedBackground: "var(--sc-cmp-togglebutton-checked-background)",
        checkedBorderColor: "var(--sc-cmp-togglebutton-checked-border-color)"
      },
      content: {
        checkedBackground: "{surface.800}"
      }
    },
    light: {
      icon: {
        color: "var(--sc-cmp-togglebutton-icon-color)",
        hoverColor: "var(--sc-cmp-togglebutton-icon-hover-color)",
        checkedColor: "var(--sc-cmp-togglebutton-icon-checked-color)"
      },
      root: {
        /* Fue divergencia por AA (customs-catalog §1.10, 2026-09-14): el Kit daba `surface.500` para la
         * opción no elegida, 2,56:1 sobre su carril `surface.100`. Desde el export del 2026-10-17 el Kit
         * dice `surface.700` (6,40:1) y `surface.900` al pasar el ratón, lo mismo que se pintaba a mano:
         * se lee la variable (`figma-pendiente.md` §8). */
        color: "var(--sc-cmp-togglebutton-color)",
        background: "var(--sc-cmp-togglebutton-background)",
        hoverColor: "var(--sc-cmp-togglebutton-hover-color)",
        borderColor: "var(--sc-cmp-togglebutton-border-color)",
        checkedColor: "var(--sc-cmp-togglebutton-checked-color)",
        hoverBackground: "var(--sc-cmp-togglebutton-hover-background)",
        checkedBackground: "var(--sc-cmp-togglebutton-checked-background)",
        checkedBorderColor: "var(--sc-cmp-togglebutton-checked-border-color)"
      },
      content: {
        checkedBackground: "var(--sc-cmp-togglebutton-content-checked-background)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/toggleswitch.ts
var toggleswitch_default = {
  root: {
    gap: "var(--sc-cmp-toggleswitch-gap)",
    width: "var(--sc-cmp-toggleswitch-width)",
    height: "var(--sc-cmp-toggleswitch-height)",
    shadow: "var(--sc-cmp-toggleswitch-shadow)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    borderColor: "#00000000",
    borderWidth: "0.071429rem",
    borderRadius: "2.142857rem",
    slideDuration: "0.2s",
    hoverBorderColor: "#00000000",
    checkedBorderColor: "#00000000",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{transition.duration}",
    checkedHoverBorderColor: "#00000000"
  },
  handle: {
    size: "var(--sc-cmp-toggleswitch-handle-size)",
    borderRadius: "var(--sc-cmp-toggleswitch-handle-border-radius)"
  },
  colorScheme: {
    dark: {
      root: {
        background: "var(--sc-cmp-toggleswitch-background)",
        hoverBackground: "var(--sc-cmp-toggleswitch-hover-background)",
        checkedBackground: "{primary.color}",
        disabledBackground: "var(--sc-cmp-toggleswitch-disabled-background)",
        checkedHoverBackground: "{primary.hover.color}"
      },
      handle: {
        color: "{surface.900}",
        background: "{surface.400}",
        hoverColor: "{surface.800}",
        checkedColor: "{primary.color}",
        hoverBackground: "{surface.300}",
        checkedBackground: "{surface.900}",
        checkedHoverColor: "{primary.hover.color}",
        disabledBackground: "{surface.900}",
        checkedHoverBackground: "{surface.900}"
      }
    },
    light: {
      root: {
        background: "var(--sc-cmp-toggleswitch-background)",
        hoverBackground: "var(--sc-cmp-toggleswitch-hover-background)",
        checkedBackground: "{primary.color}",
        disabledBackground: "{form.field.disabled.background}",
        checkedHoverBackground: "{primary.hover.color}"
      },
      handle: {
        color: "{text.muted.color}",
        background: "var(--sc-cmp-toggleswitch-handle-background)",
        hoverColor: "{text.color}",
        checkedColor: "{primary.color}",
        hoverBackground: "var(--sc-cmp-toggleswitch-handle-hover-background)",
        checkedBackground: "var(--sc-cmp-toggleswitch-handle-checked-background)",
        checkedHoverColor: "{primary.hover.color}",
        disabledBackground: "{form.field.disabled.color}",
        checkedHoverBackground: "var(--sc-cmp-toggleswitch-handle-checked-hover-background)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/cascadeselect.ts
var cascadeselect_default = {
  list: {
    gap: "{list.gap}",
    padding: "{list.padding}",
    mobileIndent: "var(--sc-cmp-cascadeselect-list-mobile-indent)"
  },
  root: {
    lg: {
      fontSize: "{form.field.lg.font.size}",
      paddingX: "{form.field.lg.padding.x}",
      paddingY: "{form.field.lg.padding.y}"
    },
    sm: {
      fontSize: "{form.field.sm.font.size}",
      paddingX: "{form.field.sm.padding.x}",
      paddingY: "{form.field.sm.padding.y}"
    },
    color: "{form.field.color}",
    shadow: "var(--sc-cmp-cascadeselect-shadow)",
    paddingX: "{form.field.padding.x}",
    paddingY: "{form.field.padding.y}",
    focusRing: {
      color: "{form.field.focus.ring.color}",
      style: "{form.field.focus.ring.style}",
      width: "{form.field.focus.ring.width}",
      offset: "{form.field.focus.ring.offset}",
      shadow: "none"
    },
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}",
    disabledColor: "{form.field.disabled.color}",
    filledBackground: "{form.field.filled.background}",
    focusBorderColor: "{form.field.focus.border.color}",
    hoverBorderColor: "{form.field.hover.border.color}",
    placeholderColor: "{form.field.placeholder.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{form.field.transition.duration}",
    filledFocusBackground: "{form.field.filled.focus.background}",
    filledHoverBackground: "{form.field.filled.hover.background}",
    invalidPlaceholderColor: "{form.field.invalid.placeholder.color}"
  },
  option: {
    icon: {
      size: "var(--sc-cmp-cascadeselect-option-icon-size)",
      color: "{list.option.icon.color}",
      focusColor: "{list.option.icon.focus.color}"
    },
    color: "{list.option.color}",
    padding: "{list.option.padding}",
    focusColor: "{list.option.focus.color}",
    borderRadius: "{list.option.border.radius}",
    selectedColor: "{list.option.selected.color}",
    focusBackground: "{list.option.focus.background}",
    selectedBackground: "{list.option.selected.background}",
    selectedFocusColor: "{list.option.selected.focus.color}",
    selectedFocusBackground: "{list.option.selected.focus.background}"
  },
  overlay: {
    color: "{overlay.select.color}",
    shadow: "var(--sc-cmp-cascadeselect-overlay-shadow)",
    background: "{overlay.select.background}",
    borderColor: "{overlay.select.border.color}",
    borderRadius: "{overlay.select.border.radius}"
  },
  dropdown: {
    color: "{form.field.icon.color}",
    width: "var(--sc-cmp-cascadeselect-dropdown-width)"
  },
  clearIcon: {
    color: "{form.field.icon.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/confirmdialog.ts
var confirmdialog_default = {
  icon: {
    size: "var(--sc-cmp-confirmdialog-icon-size)",
    color: "{overlay.modal.color}"
  },
  content: {
    gap: "var(--sc-cmp-confirmdialog-content-gap)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/progressspinner.ts
var progressspinner_default = {
  colorScheme: {
    dark: {
      root: {
        colorOne: "var(--sc-cmp-progressspinner-color-one)",
        colorTwo: "var(--sc-cmp-progressspinner-color-two)",
        colorFour: "var(--sc-cmp-progressspinner-color-four)",
        colorThree: "var(--sc-cmp-progressspinner-color-three)"
      }
    },
    light: {
      root: {
        colorOne: "var(--sc-cmp-progressspinner-color-one)",
        colorTwo: "var(--sc-cmp-progressspinner-color-two)",
        colorFour: "var(--sc-cmp-progressspinner-color-four)",
        colorThree: "var(--sc-cmp-progressspinner-color-three)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/virtualscroller.ts
var virtualscroller_default = {
  loader: {
    icon: {
      size: "var(--sc-cmp-virtualscroller-loader-icon-size)"
    },
    mask: {
      color: "{text.muted.color}",
      background: "{content.background}"
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/organizationchart.ts
var organizationchart_default = {
  node: {
    color: "{content.color}",
    padding: "var(--sc-cmp-organizationchart-node-padding-y) var(--sc-cmp-organizationchart-node-padding-x)",
    background: "{content.background}",
    hoverColor: "{content.hover.color}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}",
    selectedColor: "{highlight.color}",
    hoverBackground: "{content.hover.background}",
    toggleablePadding: "var(--sc-cmp-organizationchart-node-toggleable-padding-top) var(--sc-cmp-organizationchart-node-toggleable-padding-right) var(--sc-cmp-organizationchart-node-toggleable-padding-bottom) var(--sc-cmp-organizationchart-node-toggleable-padding-left)",
    selectedBackground: "{highlight.background}"
  },
  root: {
    gutter: "var(--sc-cmp-organizationchart-gutter)",
    transitionDuration: "{transition.duration}"
  },
  connector: {
    color: "{content.border.color}",
    height: "1.714286rem",
    borderRadius: "{content.border.radius}"
  },
  nodeToggleButton: {
    size: "var(--sc-cmp-organizationchart-node-toggle-button-size)",
    color: "{text.muted.color}",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "{content.background}",
    hoverColor: "{text.color}",
    borderColor: "{content.border.color}",
    borderRadius: "var(--sc-cmp-organizationchart-node-toggle-button-border-radius)",
    hoverBackground: "{content.hover.background}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/extend.ts
var extend_default = {
  app: {
    typography: {
      sm: {
        fontSize: "var(--sc-font-size-100)",
        lineHeight: "var(--sc-line-height-100)"
      },
      md: {
        fontSize: "var(--sc-font-size-200)",
        lineHeight: "var(--sc-line-height-200)"
      },
      lg: {
        fontSize: "var(--sc-font-size-300)",
        lineHeight: "var(--sc-line-height-300)"
      }
    },
    toggleswitch: {
      md: {
        width: "var(--sc-scale-2-5)",
        height: "var(--sc-scale-1-5)",
        gap: "var(--sc-scale-0-25)",
        handle: {
          size: "var(--sc-scale-1)",
          borderRadius: "var(--sc-scale-0-5)"
        }
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/rem-scale.ts
var DESIGN_REM_BASE_PX = 14;
var BROWSER_REM_BASE_PX = 16;
var REM_SCALE = DESIGN_REM_BASE_PX / BROWSER_REM_BASE_PX;
var REM_VALUE_PATTERN = /(-?\d*\.?\d+)rem\b/g;
var formatRem = (value) => {
  const rounded = Number(value.toFixed(6));
  return rounded === 0 ? "0" : `${rounded}rem`;
};
var fromDesignRem = (value) => formatRem(value * REM_SCALE);
var fromDesignPx = (value) => formatRem(value / BROWSER_REM_BASE_PX);
var normalizeString = (value) => value.replace(REM_VALUE_PATTERN, (_, amount) => fromDesignRem(Number(amount)));
var normalizeDesignRem = (value) => {
  if (typeof value === "string") {
    return normalizeString(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeDesignRem(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeDesignRem(item)])
    );
  }
  return value;
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/css.ts
var token = (dt, key, fallback) => `${dt(key, fallback) ?? fallback}`;
var mdTypographySelectors = [
  ".p-component.p-button",
  ".p-component.p-inputtext",
  ".p-component.p-textarea",
  ".p-datepicker-day-view",
  ".p-datepicker-time-picker span",
  ".p-editor .ql-container",
  ".p-editor .ql-snow .ql-editor h4",
  ".p-editor .ql-snow .ql-picker.ql-header .ql-picker-item[data-value='4']::before",
  ".p-select .p-select-label",
  ".p-multiselect .p-multiselect-label",
  ".p-treeselect .p-treeselect-label",
  ".p-cascadeselect .p-cascadeselect-label",
  ".p-autocomplete .p-autocomplete-input-multiple",
  ".p-autocomplete .p-autocomplete-input-chip input",
  ".p-terminal .p-terminal-prompt-value",
  ".p-component.p-togglebutton",
  ".p-select-option",
  ".p-multiselect-option",
  ".p-listbox-option",
  /* Etiquetas: ya leían la rampa antes de DD-91. */
  ".p-chip",
  ".p-toast-summary",
  ".p-breadcrumb-item-label",
  ".p-contextmenu-item-label",
  /* Como la del menú contextual: sin letra ni interlineado propios, heredaba el 1.5 del body (14/21). Medido en el menú
   * «⋮» de las filas de grupos (2026-10-09). */
  ".p-menu-item-label"
];
var smTypographySelectors = [
  ".p-component.p-button-sm",
  ".p-component.p-inputtext-sm",
  ".p-component.p-textarea-sm",
  ".p-select.p-select-sm .p-select-label",
  ".p-multiselect.p-multiselect-sm .p-multiselect-label",
  ".p-treeselect.p-treeselect-sm .p-treeselect-label",
  ".p-cascadeselect.p-cascadeselect-sm .p-cascadeselect-label",
  ".p-autocomplete:has(.p-inputtext-sm) .p-autocomplete-input-multiple",
  ".p-autocomplete:has(.p-inputtext-sm) .p-autocomplete-input-chip input",
  ".p-component.p-togglebutton-sm",
  /* Etiquetas: ya leían la rampa antes de DD-91. */
  ".p-tag",
  ".p-toast-detail"
];
var lgTypographySelectors = [
  ".p-component.p-button-lg",
  ".p-component.p-inputtext-lg",
  ".p-component.p-textarea-lg",
  ".p-select.p-select-lg .p-select-label",
  ".p-multiselect.p-multiselect-lg .p-multiselect-label",
  ".p-treeselect.p-treeselect-lg .p-treeselect-label",
  ".p-cascadeselect.p-cascadeselect-lg .p-cascadeselect-label",
  ".p-autocomplete:has(.p-inputtext-lg) .p-autocomplete-input-multiple",
  ".p-autocomplete:has(.p-inputtext-lg) .p-autocomplete-input-chip input",
  ".p-component.p-togglebutton-lg"
];
var typographyRule = (selectors, dt, size, fontSizeFallback, lineHeightFallback) => `${selectors.join(",\n")} {
    font-size: ${token(dt, `app.typography.${size}.font.size`, fontSizeFallback)};
    line-height: ${token(dt, `app.typography.${size}.line.height`, lineHeightFallback)};
}`;
var baseTableCss = () => `
sc-datatable .p-datatable-thead > tr > th {
    font-size: var(--sc-font-size-body-2);
    line-height: var(--sc-line-height-body-2);
    font-weight: var(--sc-font-weight-semibold);
}

sc-datatable .p-datatable-tbody > tr > td {
    font-size: var(--sc-font-size-body-2);
    line-height: var(--sc-line-height-body-2);
    font-weight: var(--sc-font-weight-regular);
}

sc-datatable .p-datatable-tfoot > tr > td {
    font-size: var(--sc-font-size-body-2);
    line-height: var(--sc-line-height-body-2);
    font-weight: var(--sc-font-weight-semibold);
}
`;
var emptyCaptionCss = () => `
sc-datatable .p-datatable-header:empty {
    display: none;
}
`;
var LIST = "sc-datatable.sc-datatable--list";
var listBehaviorCss = () => `
${LIST} .p-datatable-table {
    table-layout: fixed;
}

${LIST} .p-datatable-tbody > tr > td:not(.p-datatable-frozen-column) {
    position: relative;
}

${LIST} .p-datatable-tbody > tr {
    transition: background var(--sc-transition-fast) var(--sc-easing-default);
}

${LIST} .p-datatable-tbody > tr.sc-row--clickable {
    cursor: pointer;
}

${LIST} .p-datatable-tbody > tr.sc-row--clickable:hover,
${LIST} .p-datatable-tbody > tr.p-selectable-row:hover {
    background: var(--sc-bg-default);
}

${LIST} .p-datatable-tbody > tr:not(.sc-row--clickable):not(.p-selectable-row):hover {
    background: transparent;
}

/* \`sc-row--selected\` la pone \`sc-datatable\` a toda fila seleccionada, tambi\xE9n a las que a\xF1ade un tramo con May\xFAsculas,
 * que p-table no resalta (2026-10-05). Va en la lista, la \xFAnica variante con selecci\xF3n m\xFAltiple (la pieza de listas,
 * Conversaciones y la demo de sc-docs). */
${LIST} .p-datatable-tbody > tr.p-datatable-row-selected,
${LIST} .p-datatable-tbody > tr.sc-row--selected {
    background: var(--sc-bg-secondary-hover);
}

${LIST} .p-datatable-tbody > tr:has(> td[colspan]) {
    background: none;
}

${LIST} .p-datatable-tbody > tr:has(> td[colspan]) > td {
    border-bottom: 0;
}

${LIST} .p-datatable-tbody > tr > :is(td, th) :is(.p-tag, button) {
    vertical-align: middle;
}
`;
var iconOnlyMultiSelectCss = () => `
.sc-multiselect--icon-only .p-multiselect-label-container {
    flex: 0 0 0;
    visibility: hidden;
}
.sc-multiselect--icon-only .p-multiselect-dropdown {
    width: 100%;
}
`;
var RH = "sc-datatable .p-datatable-tbody > tr > th[scope='row']";
var rowHeaderCss = () => `
${RH} {
    text-align: start;
    border-color: var(--p-datatable-body-cell-border-color);
    border-style: solid;
    border-width: 0 0 1px 0;
    padding: var(--p-datatable-body-cell-padding);
    font-size: var(--sc-font-size-body-2);
    line-height: var(--sc-line-height-body-2);
    font-weight: var(--sc-font-weight-regular);
}
sc-datatable .p-datatable-tbody > tr:has(+ .p-datatable-row-selected) > th[scope='row'],
sc-datatable .p-datatable-tbody > tr.p-datatable-row-selected > th[scope='row'] {
    border-block-end-color: var(--p-datatable-body-cell-selected-border-color);
}
sc-datatable.sc-datatable--resizable .p-datatable-tbody > tr > th[scope='row'] {
    overflow: hidden;
    white-space: nowrap;
}
sc-datatable.sc-datatable--sm .p-datatable-tbody > tr > th[scope='row'] {
    padding: var(--p-datatable-body-cell-sm-padding);
}
sc-datatable.sc-datatable--lg .p-datatable-tbody > tr > th[scope='row'] {
    padding: var(--p-datatable-body-cell-lg-padding);
}
sc-datatable.sc-datatable--gridlines .p-datatable-tbody > tr > th[scope='row'] {
    border-width: 0 0 1px 1px;
}
/* Fija, toma el fondo de su fila como la \`td\` fija. */
sc-datatable.sc-datatable--scroll .p-datatable-tbody > tr > th.p-datatable-frozen-column {
    background: inherit;
}
${LIST} .p-datatable-tbody > tr > th[scope='row']:not(.p-datatable-frozen-column) {
    position: relative;
}
`;
var frozenColumnsCss = () => `
/* El hover inerte de lista era transparente: una celda fija debe tapar los datos que pasan debajo. */
${LIST} .p-datatable-tbody > tr:not(.sc-row--clickable):not(.p-selectable-row):not(.p-datatable-row-selected):hover:has(> .p-datatable-frozen-column) {
    background: var(--p-datatable-row-background);
}
sc-datatable.sc-datatable--overflow-right .sc-datatable__frozen-right-edge,
sc-datatable.sc-datatable--overflow-left .sc-datatable__frozen-left-edge {
    box-shadow: var(--sc-shadow-sm);
}
`;
var tagOneLineCss = () => `
.p-component.p-tag {
    max-width: 100%;
}

.p-tag .p-tag-label {
    min-width: 0;
    overflow: clip;
    text-overflow: ellipsis;
    white-space: nowrap;
}
`;
var STICKY = "sc-datatable.sc-datatable--sticky-header > p-table";
var stickyHeaderCss = () => `
${STICKY} > .p-datatable-table-container {
    overflow: visible !important;
    isolation: isolate;
}

${STICKY} > .p-datatable-table-container > .p-datatable-table > .p-datatable-thead {
    inset-block-start: 0;
    z-index: var(--sc-z-sticky);
}
`;
var scrollableScrollbarCss = () => `
/* Ajustada a sus filas: cada caja encoge hasta el alto que le dejan, y el contenedor hace scroll. */
sc-datatable.sc-datatable--fit > p-table {
    display: flex;
    flex-direction: column;
    flex: 0 1 auto;
    min-height: 0;
}

sc-datatable.sc-datatable--fit > p-table > .p-datatable-table-container {
    flex: 0 1 auto;
    min-height: 0;
}

sc-datatable.sc-datatable--fill > p-table {
    flex: 1 1 auto;
    min-height: 0;
}

/* Sin hueco reservado para la barra (decisi\xF3n de producto, 2026-09-15). El 2026-09-14 se reservaba a los dos lados
 * (\`scrollbar-gutter: stable both-edges\`) para que las rayas quedaran sim\xE9tricas, pero el color de una fila
 * no puede pintar en ese hueco: el rojo de una fallida, el amarillo de una en proceso, el hover y la selecci\xF3n
 * se cortaban antes de cada borde de la tarjeta, lo que med\xEDa la barra. Ahora llegan al borde; con barra, a la derecha acaban donde
 * empieza ella. El precio, aceptado: al aparecer o desaparecer la barra las columnas se mueven su ancho. */

/* Como la barra de ScrollArea (decisi\xF3n de producto, 2026-09-15): fina, del color de su tirador y solo con el rat\xF3n
 * encima. No es ScrollArea: la lista virtual de \`p-table\` tiene que ser due\xF1a de su contenedor de scroll
 * (sin ella pinta todas las filas), as\xED que se imita su aspecto sobre la barra nativa. */
sc-datatable.sc-datatable--scroll > p-table > .p-datatable-table-container::-webkit-scrollbar,
sc-datatable.sc-datatable--scroll .p-virtualscroller::-webkit-scrollbar {
    width: var(--sc-spacing-0-25);
    height: var(--sc-spacing-0-25);
}

sc-datatable.sc-datatable--scroll > p-table > .p-datatable-table-container::-webkit-scrollbar-track,
sc-datatable.sc-datatable--scroll .p-virtualscroller::-webkit-scrollbar-track {
    margin-block-start: var(--sc-datatable-thead-height, 0);
    background: transparent;
}

sc-datatable.sc-datatable--scroll > p-table > .p-datatable-table-container::-webkit-scrollbar-thumb,
sc-datatable.sc-datatable--scroll .p-virtualscroller::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: var(--sc-radius-full);
}

sc-datatable.sc-datatable--scroll > p-table > .p-datatable-table-container:hover::-webkit-scrollbar-thumb,
sc-datatable.sc-datatable--scroll .p-virtualscroller:hover::-webkit-scrollbar-thumb {
    background: var(--p-scrollarea-handle-background);
}
`;
var buttonMotionCss = () => `
.p-component.p-button {
    transition:
        background-color 150ms ease-out,
        border-color 150ms ease-out,
        color 150ms ease-out,
        outline-color 150ms ease-out,
        box-shadow 150ms ease-out,
        transform 150ms ease-out;
}

.p-component.p-button:active {
    transform: scale(0.96);
}

.p-component.p-button:disabled,
.p-component.p-button[aria-disabled="true"] {
    transform: none;
    cursor: not-allowed;
}

.p-component.p-button:disabled:active,
.p-component.p-button[aria-disabled="true"]:active {
    transform: none;
}

@media (prefers-reduced-motion: reduce) {
    .p-component.p-button {
        transition: none;
    }

    .p-component.p-button:active {
        transform: none;
    }
}
`;
var dangerMenuItemCss = () => `
.sc-menu-item--danger .p-menu-item-link,
.sc-menu-item--danger .p-menu-item-icon,
.sc-menu-item--danger .p-tieredmenu-item-link,
.sc-menu-item--danger .p-tieredmenu-item-icon {
    color: var(--sc-text-danger);
}

.sc-menu-item--danger .p-menu-item-content:hover,
.sc-menu-item--danger .p-tieredmenu-item-content:hover {
    background: var(--sc-bg-danger-subtle);
}

.sc-menu-item--danger .p-menu-item-content:hover .p-menu-item-link,
.sc-menu-item--danger .p-menu-item-content:hover .p-menu-item-icon,
.sc-menu-item--danger .p-tieredmenu-item-content:hover .p-tieredmenu-item-link,
.sc-menu-item--danger .p-tieredmenu-item-content:hover .p-tieredmenu-item-icon {
    color: var(--sc-text-danger);
}
`;
var breadcrumbLinkCss = () => `
.sc-breadcrumb-item--link {
    cursor: pointer;
}

@media (hover: hover) {
    .sc-breadcrumb-item--link:hover .p-breadcrumb-item-label {
        text-decoration-line: underline;
        text-decoration-thickness: from-font;
        text-underline-position: from-font;
    }
}
`;
var sidebarFloatingGroundCss = () => `
p-sidebar-layout:has(p-sidebar[data-variant="floating"]) {
    background: var(--p-sidebar-main-floating-background);
}
`;
var inputGroupSizeCss = () => `
.sc-inputgroup--sm {
    --p-inputtext-padding-x: var(--p-inputtext-sm-padding-x);
    --p-inputtext-padding-y: var(--p-inputtext-sm-padding-y);
    --p-app-typography-md-font-size: var(--p-app-typography-sm-font-size);
    --p-app-typography-md-line-height: var(--p-app-typography-sm-line-height);
    --p-inputgroup-addon-font-size: var(--p-inputtext-sm-font-size);
}

.sc-inputgroup--lg {
    --p-inputtext-padding-x: var(--p-inputtext-lg-padding-x);
    --p-inputtext-padding-y: var(--p-inputtext-lg-padding-y);
    --p-app-typography-md-font-size: var(--p-app-typography-lg-font-size);
    --p-app-typography-md-line-height: var(--p-app-typography-lg-line-height);
    --p-inputgroup-addon-font-size: var(--p-inputtext-lg-font-size);
}
`;
var presetCss = ({ dt } = {}) => `
${typographyRule(
  mdTypographySelectors,
  dt,
  "md",
  fromDesignPx(14),
  /* 20, no 21: DD-39 unificó el line-height md. El fallback solo entra si la variable
   * no resuelve, y hasta ahora contradecía al token — habría reintroducido justo el
   * 21 que costó semanas cazar. */
  fromDesignPx(20)
)}

${typographyRule(smTypographySelectors, dt, "sm", fromDesignPx(12), fromDesignPx(18))}

${typographyRule(lgTypographySelectors, dt, "lg", fromDesignPx(16), fromDesignPx(24))}

.p-button .p-button-icon {
    line-height: 1;
}

/* El aviso y el tooltip tienen su letra en el preset (\`message.text.*\`, \`tooltip.fontSize\`: lo que lee el Theme Designer)
 * pero ning\xFAn interlineado: heredaban el 1.5 del body, 14/21 (el aviso de tres l\xEDneas med\xEDa 63 en vez de 60). Aqu\xED solo el
 * interlineado de su talla, para no pisarles la letra. */
.p-tooltip-text,
.p-message-text {
    line-height: ${token(dt, "app.typography.md.line.height", fromDesignPx(20))};
}

.p-message-sm .p-message-text {
    line-height: ${token(dt, "app.typography.sm.line.height", fromDesignPx(18))};
}

.p-message-lg .p-message-text {
    line-height: ${token(dt, "app.typography.lg.line.height", fromDesignPx(24))};
}

/* El t\xEDtulo del drawer es el pelda\xF1o 450 (20, \`drawer.title.fontSize\`) y su interlineado es el del mismo pelda\xF1o, 28
 * (\`docs/tipografia.md\` \xA72); heredaba 30. */
.p-drawer-title {
    line-height: var(--sc-line-height-450);
}

${baseTableCss()}
${emptyCaptionCss()}
${listBehaviorCss()}
${frozenColumnsCss()}
${rowHeaderCss()}
${iconOnlyMultiSelectCss()}
${stickyHeaderCss()}
${scrollableScrollbarCss()}
${tagOneLineCss()}

${buttonMotionCss()}

${dangerMenuItemCss()}

${breadcrumbLinkCss()}

${inputGroupSizeCss()}

${sidebarFloatingGroundCss()}
`;
var css_default = presetCss;

// projects/ui-smartcontact/src/lib/theme/sc-preset/index.ts
var preset = definePreset(Aura, normalizeDesignRem({
  ...base_default,
  components: {
    datatable: datatable_default,
    tag: tag_default,
    card: card_default,
    chip: chip_default,
    dock: dock_default,
    knob: knob_default,
    menu: menu_default,
    tabs: tabs_default,
    tree: tree_default,
    badge: badge_default,
    image: image_default,
    panel: panel_default,
    toast: toast_default,
    avatar: avatar_default,
    button: button_default,
    dialog: dialog_default,
    drawer: drawer_default,
    sidebar: sidebar_default,
    editor: editor_default,
    rating: rating_default,
    ripple: ripple_default,
    select: select_default,
    slider: slider_default,
    blockui: blockui_default,
    divider: divider_default,
    inplace: inplace_default,
    listbox: listbox_default,
    menubar: menubar_default,
    message: message_default,
    popover: popover_default,
    stepper: stepper_default,
    toolbar: toolbar_default,
    tooltip: tooltip_default,
    carousel: carousel_default,
    checkbox: checkbox_default,
    dataview: dataview_default,
    fieldset: fieldset_default,
    galleria: galleria_default,
    inputotp: inputotp_default,
    megamenu: megamenu_default,
    password: password_default,
    picklist: picklist_default,
    skeleton: skeleton_default,
    splitter: splitter_default,
    terminal: terminal_default,
    textarea: textarea_default,
    timeline: timeline_default,
    accordion: accordion_default,
    iconfield: iconfield_default,
    iftalabel: iftalabel_default,
    inputtext: inputtext_default,
    orderlist: orderlist_default,
    paginator: paginator_default,
    panelmenu: panelmenu_default,
    speeddial: speeddial_default,
    treetable: treetable_default,
    breadcrumb: breadcrumb_default,
    datepicker: datepicker_default,
    fileupload: fileupload_default,
    floatlabel: floatlabel_default,
    inputgroup: inputgroup_default,
    metergroup: metergroup_default,
    tieredmenu: tieredmenu_default,
    treeselect: treeselect_default,
    contextmenu: contextmenu_default,
    inputnumber: inputnumber_default,
    multiselect: multiselect_default,
    progressbar: progressbar_default,
    radiobutton: radiobutton_default,
    scrollpanel: scrollpanel_default,
    splitbutton: splitbutton_default,
    autocomplete: autocomplete_default,
    confirmpopup: confirmpopup_default,
    imagecompare: imagecompare_default,
    overlaybadge: overlaybadge_default,
    selectbutton: selectbutton_default,
    togglebutton: togglebutton_default,
    toggleswitch: toggleswitch_default,
    cascadeselect: cascadeselect_default,
    confirmdialog: confirmdialog_default,
    progressspinner: progressspinner_default,
    virtualscroller: virtualscroller_default,
    organizationchart: organizationchart_default
  },
  extend: extend_default,
  css: css_default
}));
var sc_preset_default = preset;

// <stdin>
var stdin_default = definePreset2(sc_preset_default, { extend: { "primitive": { "typography": { "font": { "weight": { "regular": "var(--sc-font-weight-regular)", "medium": "var(--sc-font-weight-medium)", "semibold": "var(--sc-font-weight-semibold)", "bold": "var(--sc-font-weight-bold)" }, "size": { "100": "var(--sc-font-size-100)", "200": "var(--sc-font-size-200)", "300": "var(--sc-font-size-300)", "400": "var(--sc-font-size-400)", "450": "var(--sc-font-size-450)", "500": "var(--sc-font-size-500)", "650": "var(--sc-font-size-650)", "800": "var(--sc-font-size-800)", "900": "var(--sc-font-size-900)" }, "family": { "inter": "Inter" }, "style": { "regular": "Regular", "medium": "Medium", "semibold": "Semi Bold", "bold": "Bold" } }, "line": { "height": { "100": "var(--sc-line-height-100)", "200": "var(--sc-line-height-200)", "300": "var(--sc-line-height-300)", "450": "var(--sc-line-height-450)", "500": "var(--sc-line-height-500)", "650": "var(--sc-line-height-650)", "800": "var(--sc-line-height-800)", "900": "var(--sc-line-height-900)" } } } }, "semantic": { "text": { "accent": "var(--sc-text-accent)", "inverse": "var(--sc-text-inverse)", "heading": "var(--sc-text-heading)", "subtle": "var(--sc-text-subtle)" }, "presence": { "available": "{green.400}", "unavailable": "{red.400}", "administrative": "{red.600}", "talking": "{cyan.400}", "wrapup": "{cyan.600}" } }, "component": { "custommodal": { "background": "{overlay.modal.background}", "color": "{overlay.modal.color}", "border": { "color": "{overlay.modal.border.color}", "radius": "{overlay.modal.border.radius}" }, "header": { "padding": "{overlay.modal.padding}", "gap": "var(--sc-scale-0-5)" }, "subheader": { "padding": "{overlay.modal.padding}", "gap": "var(--sc-scale-0-5)", "color": "{form.field.float.label.color}" }, "title": { "font": { "size": "{primitive.typography.font.size.400}", "weight": "{primitive.typography.font.weight.semibold}" } }, "footer": { "gap": "var(--sc-scale-0-5)", "padding": { "top": "0", "right": "{overlay.modal.padding}", "bottom": "{overlay.modal.padding}", "left": "{overlay.modal.padding}" } }, "content": { "padding": { "top": "0", "right": "{overlay.modal.padding}", "bottom": "{overlay.modal.padding}", "left": "{overlay.modal.padding}" } }, "error": { "background": "#ef444429", "color": "{red.500}", "border": { "color": "#b91c1c5c" } }, "warn": { "background": "#eab30829", "color": "{yellow.300}", "border": { "color": "#a162075c" } } }, "dialog": { "icon": { "color": "var(--sc-dialog-head-icon-fg)" } } } } });
export {
  stdin_default as default
};
