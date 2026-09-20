import type { SidebarDesignTokens } from '@primeuix/themes/types/sidebar';

/*
 * Sidebar (nuevo en PrimeNG 22): el Kit no lo exporta, así que se cablea a mano (guia-tokens.md,
 * «cablear a mano solo lo nuevo»). Solo el COLOR, y a los tokens de nuestra barra lateral
 * (`--sc-sidebar-*`, capa 5), que ya cambian solos en oscuro: por eso no lleva `colorScheme`.
 * Las medidas siguen las de Aura pasadas por nuestra escala, como el resto del preset.
 * Mapa de roles, sobre las claves de `@primeuix/themes/aura/sidebar`:
 *   suelo del sidebar (layout, panel)      → --sc-sidebar-bg
 *   texto de item / de grupo / de acción    → --sc-sidebar-fg-muted / -fg-subtle / -fg-faint
 *   hover y activo                          → --sc-sidebar-item-hover-bg / -item-active-bg, texto -fg-hover / -fg
 *   bordes                                  → --sc-sidebar-border
 *   zona de contenido (main)                → --sc-bg-canvas, el suelo de la app en el shell
 *   sombras (panel flotante, main inset)    → --sc-shadow-xs, la más ligera de la escala
 *   botón del menú                          → el relleno de un item de navegación del Kit
     ({navigation.item.padding}, 3,5 · 8,75), como ya lleva el sub-botón en Aura; plegado mide
     --sc-scale-2-25 (31,5 = 8,75 + 14 de icono + 8,75), así el icono cae en el centro exacto. Con el
     2rem y los 10px de Aura el icono de 14 no cabía en su hueco de 12 y se iba a la derecha.
 *   esquina del panel flotante              → --sc-radius-xl (12px): concéntrica con lo de dentro,
     el radio del botón (4px) más el relleno del grupo (8px). Con los 6px de Aura la esquina de
     fuera quedaba más cerrada que la del botón activo.
 *   filo del main inset                     → anillo de 1px con --sc-sidebar-border, antes de la sombra.
     Desviación de Aura, que solo lleva sombra: en oscuro el main (zinc-950) casi no se separa del
     marco (zinc-900) y la sombra no se ve sobre negro; en claro el contraste ya lo marca y el anillo
     no cambia nada a la vista.
 */
export default {
  root: {
    borderColor: 'var(--sc-sidebar-border)',
  },
  layout: {
    background: 'var(--sc-sidebar-bg)',
  },
  panel: {
    background: 'var(--sc-sidebar-bg)',
    color: 'var(--sc-sidebar-fg-muted)',
    floatingShadow: 'var(--sc-shadow-xs)',
    floatingBorderRadius: 'var(--sc-radius-xl)',
  },
  groupLabel: {
    color: 'var(--sc-sidebar-fg-subtle)',
  },
  groupAction: {
    color: 'var(--sc-sidebar-fg-faint)',
    focusColor: 'var(--sc-sidebar-fg-hover)',
    focusBackground: 'var(--sc-sidebar-item-hover-bg)',
  },
  menuButton: {
    padding: '{navigation.item.padding}',
    iconOnlyWidth: 'var(--sc-scale-2-25)',
    color: 'var(--sc-sidebar-fg-muted)',
    focusBackground: 'var(--sc-sidebar-item-hover-bg)',
    focusColor: 'var(--sc-sidebar-fg-hover)',
    activeBackground: 'var(--sc-sidebar-item-active-bg)',
    activeColor: 'var(--sc-sidebar-fg)',
    icon: {
      color: 'var(--sc-sidebar-fg-subtle)',
      focusColor: 'var(--sc-sidebar-fg-hover)',
    },
  },
  menuAction: {
    color: 'var(--sc-sidebar-fg-faint)',
    focusColor: 'var(--sc-sidebar-fg-hover)',
    focusBackground: 'var(--sc-sidebar-item-hover-bg)',
  },
  menuBadge: {
    background: 'var(--sc-sidebar-item-hover-bg)',
    borderColor: 'var(--sc-sidebar-border)',
    color: 'var(--sc-sidebar-fg-muted)',
  },
  menuSubButton: {
    color: 'var(--sc-sidebar-fg-muted)',
    focusBackground: 'var(--sc-sidebar-item-hover-bg)',
    focusColor: 'var(--sc-sidebar-fg-hover)',
    activeBackground: 'var(--sc-sidebar-item-active-bg)',
    activeColor: 'var(--sc-sidebar-fg)',
    icon: {
      color: 'var(--sc-sidebar-fg-subtle)',
      focusColor: 'var(--sc-sidebar-fg-hover)',
    },
  },
  main: {
    background: 'var(--sc-bg-canvas)',
    floatingBackground: 'var(--sc-bg-canvas)',
    insetBackground: 'var(--sc-bg-canvas)',
    shadow: '0 0 0 0.071429rem var(--sc-sidebar-border), var(--sc-shadow-xs)',
  },
} satisfies SidebarDesignTokens;
