// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=15380-91374
// source=projects/supervisor/src/app/core/layout/sidebar/sidebar-nav-item.component.ts
// component=SidebarNavItemComponent

import figma from "figma"

const open = figma.selectedInstance.getEnum("Open", {
  True: "la clave está en openKeys()",
  False: "la clave no está en openKeys()",
})

// Una categoría es una entrada de NAV_SECTIONS con `children`. El fondo del grupo (5% desplegado, 10%
// plegado) y el de los hijos (10%) los pone el CSS del sidebar (.nav-group--open), no el componente.
export default {
  id: "sidebar-group",
  example: figma.code`<!-- categoría: Open=${open} -->
<sc-sidebar-nav-item [item]="categoria" [currentPath]="currentPath()" [openKeys]="openKeys()" [accentKey]="accentKey()" (navigate)="onNavigate($event)" (toggleOpen)="onToggle($event)" />
<!-- nav-data.ts: { labelKey: 'sidebar.<clave>', icon: '<NavIconKey>', children: [ ...filas ] } -->`,
}
