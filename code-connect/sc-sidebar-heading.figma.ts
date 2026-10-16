// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=15380-91354

import figma from "figma"

const title = figma.selectedInstance.getString("Label")
const divider = figma.selectedInstance.getBoolean("Divider", {
  true: "no es la primera sección: divisor en plegado",
  false: "primera sección: sin divisor",
})

// El título de sección no es un componente: es el `titleKey` de una NavSection y la plantilla del sidebar
// pinta el título (desplegado) y el divisor (plegado) como hermanos que se funden.
export default {
  id: "sidebar-heading",
  example: figma.code`<!-- título "${title}": ${divider} -->
<!-- nav-data.ts: { titleKey: 'sidebar.<clave>', items: [ ...categorías y filas ] } -->`,
}
