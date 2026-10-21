// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=12610-23193

import figma from "figma"

const hint = figma.selectedInstance.getString("Pista")
const collapsible = figma.selectedInstance.getBoolean("Plegable", { true: "collapsible", false: "" })

// titleKey y hintKey son CLAVES de traducción. Los Slot 1..5 de Figma son el contenido proyectado.
export default {
  id: "subsection",
  example: figma.code`<!-- en Figma: pista "${hint}" -->
<sc-subsection titleKey="subseccion.titulo" hintKey="subseccion.pista" ${collapsible}>
  …
</sc-subsection>`,
}
