// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=15380-91337

import figma from "figma"

const label = figma.selectedInstance.getString("Label")
const state = figma.selectedInstance.getEnum("State", {
  Default: "reposo",
  Hover: ":hover (CSS)",
  Focus: ":focus-visible (CSS)",
  Selected: "currentPath() coincide con item.path",
  "Selected focus": "currentPath() coincide y :focus-visible",
  "Parent active": "accentKey() es la clave de esta fila",
  "Parent active hover": "accentKey() es la clave de esta fila y :hover",
  "Parent active focus": "accentKey() es la clave de esta fila y :focus-visible",
})
const level = figma.selectedInstance.getEnum("Level", {
  "0": "data-depth=0",
  "1": "data-depth=1",
  "2": "data-depth=2 (el menú real no pasa de ahí)",
})
const chevron = figma.selectedInstance.getEnum("Chevron", {
  None: "sin children",
  Closed: "con children, clave fuera de openKeys()",
  Open: "con children, clave dentro de openKeys()",
})

// Una fila de Figma es UNA ENTRADA de NAV_SECTIONS (nav-data.ts); el componente la pinta. State, Level
// y Chevron se derivan, no se pasan: Hover y Focus son :hover y :focus-visible.
export default {
  id: "sidebar-item",
  example: figma.code`<!-- fila "${label}": ${state} · ${level} · ${chevron} -->
<sc-sidebar-nav-item
  [item]="item"
  [currentPath]="currentPath()"
  [openKeys]="openKeys()"
  [accentKey]="accentKey()"
  (navigate)="onNavigate($event)"
  (toggleOpen)="onToggle($event)"
/>
<!-- nav-data.ts: { labelKey: 'sidebar.<clave>', icon: '<NavIconKey>', path: '/<ruta>' } -->`,
}
