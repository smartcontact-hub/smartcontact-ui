// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=15380-91410

import figma from "figma"

// Componente de app (projects/supervisor/src/app/core/layout/sidebar), no del paquete del DS. Es
// "custom": PrimeNG 22 trae Sidebar, el 21 no (decisión de producto, 2026-10-16), así que no tiene wrapper `sc-*` del DS.
export default {
  id: "sidebar",
  example: figma.code`<!-- Mode no es una entrada: Expanded sale de :hover / :focus-within / sidebar--pinned
     (se pliega 300 ms después de salir) y Collapsed es el reposo (80 px). El menú sale de NAV_SECTIONS
     (nav-data.ts); cambiar un hueco de Figma = cambiar ese árbol, no la plantilla. -->
<sc-sidebar></sc-sidebar>`,
}
